@echo off
echo ============================================
echo   First Italian Pizza POS - Build .exe
echo ============================================
echo.

echo [1/3] Building React frontend...
cd frontend
call npm run build
if errorlevel 1 goto error
cd ..

echo.
echo [2/3] Installing production backend deps...
cd backend
call npm install --production
if errorlevel 1 goto error

echo [2b/3] Generating Prisma client...
call npx prisma generate
if errorlevel 1 goto error
cd ..

echo.
echo [3/3] Building Electron installer...
cd electron
call npm run build
if errorlevel 1 goto error
cd ..

echo.
echo ============================================
echo   Build complete!
echo   Installer is in the /build folder
echo ============================================
pause
goto end

:error
echo.
echo ERROR: Build failed. Check the output above.
pause
exit /b 1

:end
