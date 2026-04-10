/**
 * Electron Main Process
 * - Loads the Express backend directly via require() inside Electron's Node.js runtime
 * - Creates the BrowserWindow pointing at the built React frontend
 * - Handles auto-updates via electron-updater
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log    = require('electron-log');
const path   = require('path');
const fs     = require('fs');
const http   = require('http');

// Configure logger
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting…');

// ─── Globals ────────────────────────────────────────────────────────────────
let mainWindow = null;
const isDev    = !app.isPackaged;
const BACKEND_PORT = 4000;

// ─── Backend bootstrap ───────────────────────────────────────────────────────
function startBackend() {
  if (isDev) {
    // In dev, run: cd backend && npm run dev  (separate terminal)
    log.info('Dev mode: backend should be started separately');
    return;
  }

  const resourcesPath = process.resourcesPath;
  const backendDir    = path.join(resourcesPath, 'backend');
  const serverPath    = path.join(backendDir, 'src', 'server.js');
  const dbDir         = app.getPath('userData');
  const dbPath        = path.join(dbDir, 'pizza.db');
  const templateDb    = path.join(resourcesPath, 'template.db');

  // ── 1. Copy template database on first launch ──────────────────────────────
  if (!fs.existsSync(dbPath)) {
    log.info(`First launch – copying database template to ${dbPath}`);
    if (fs.existsSync(templateDb)) {
      fs.mkdirSync(dbDir, { recursive: true });
      fs.copyFileSync(templateDb, dbPath);
      log.info('Database template copied successfully');
    } else {
      log.warn('No template.db found – Prisma will create a fresh database');
    }
  }

  // ── 2. Set environment variables for the backend ───────────────────────────
  process.env.DATABASE_URL  = `file:${dbPath}`;
  process.env.JWT_SECRET    = 'FirstItalianPizza_JWT_Secret_2024';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.PORT          = String(BACKEND_PORT);
  process.env.NODE_ENV      = 'production';
  // Uploads must go to writable AppData, NOT Program Files
  process.env.UPLOADS_DIR   = path.join(dbDir, 'uploads');
  fs.mkdirSync(process.env.UPLOADS_DIR, { recursive: true });

  // ── 3. Tell Prisma where its query-engine binary lives ─────────────────────
  //    Binary engine = plain .exe, no native module ABI issues with Electron
  const engineBinary = path.join(backendDir, 'node_modules', '.prisma', 'client', 'query-engine-windows.exe');
  if (fs.existsSync(engineBinary)) {
    process.env.PRISMA_QUERY_ENGINE_BINARY = engineBinary;
    log.info(`Prisma binary engine: ${engineBinary}`);
  } else {
    log.warn(`Prisma engine not found at: ${engineBinary}`);
  }

  // ── 4. Require the Express server inside Electron's Node.js runtime ────────
  //    (process.execPath is the Electron binary — we CANNOT spawn it as Node.js.
  //     require() runs the server in THIS process, which IS Node.js.)
  try {
    log.info(`Loading backend from: ${serverPath}`);
    require(serverPath);
    log.info('Backend server started successfully');
  } catch (err) {
    log.error('Failed to require backend server:', err);
    throw err;
  }
}

// ─── Wait for backend to be ready ────────────────────────────────────────────
function waitForBackend(retries = 40) {
  return new Promise((resolve, reject) => {
    const check = (n) => {
      http.get(`http://127.0.0.1:${BACKEND_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry(n);
      }).on('error', () => retry(n));
    };
    const retry = (n) => {
      if (n <= 0) return reject(new Error('Backend did not become ready in time'));
      setTimeout(() => check(n - 1), 300);
    };
    check(retries);
  });
}

// ─── Create BrowserWindow ─────────────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  1024,
    minHeight: 600,
    title: 'First Italian Pizza POS',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  if (isDev) {
    await mainWindow.loadURL(`http://localhost:3000`);
  } else {
    // Production: serve the built React app via the backend static route,
    // OR load the index.html from resources/frontend/
    const frontendIndex = path.join(process.resourcesPath, 'frontend', 'index.html');
    await mainWindow.loadFile(frontendIndex);
  }
}

// ─── Auto-updater setup ───────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    mainWindow?.webContents.send('update:available', info);
    dialog.showMessageBox(mainWindow, {
      type: 'info', title: 'Update Available',
      message: `Version ${info.version} is downloading in the background.`,
      buttons: ['OK'],
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    dialog.showMessageBox(mainWindow, {
      type: 'info', title: 'Update Ready',
      message: `Version ${info.version} downloaded. Restart to install.`,
      buttons: ['Restart Now', 'Later'], defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => log.error('Updater error:', err));

  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);
}

// ─── IPC ──────────────────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion());

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    startBackend();

    if (!isDev) {
      await waitForBackend();
      log.info('Backend is ready');
    }

    await createWindow();
    setupAutoUpdater();
  } catch (err) {
    log.error('Startup failed:', err);
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start the backend server.\n\nError: ${err.message}\n\nCheck logs at: ${log.transports.file.getFile().path}`
    );
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
