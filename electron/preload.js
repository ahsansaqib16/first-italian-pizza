/**
 * Preload script – runs in the renderer with Node access disabled.
 * Exposes a safe, limited API to the frontend via contextBridge.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion:    () => ipcRenderer.invoke('app:version'),
  checkUpdate:   () => ipcRenderer.invoke('app:check-update'),

  onUpdateChecking:     (cb) => ipcRenderer.on('update:checking',      (_e, d) => cb(d)),
  onUpdateAvailable:    (cb) => ipcRenderer.on('update:available',      (_e, d) => cb(d)),
  onUpdateNotAvailable: (cb) => ipcRenderer.on('update:not-available',  (_e, d) => cb(d)),
  onUpdateProgress:     (cb) => ipcRenderer.on('update:progress',       (_e, d) => cb(d)),
  onUpdateDownloaded:   (cb) => ipcRenderer.on('update:downloaded',     (_e, d) => cb(d)),
  onUpdateError:        (cb) => ipcRenderer.on('update:error',          (_e, d) => cb(d)),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
