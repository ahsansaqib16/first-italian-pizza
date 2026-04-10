@echo off
echo ============================================
echo   First Italian Pizza POS - Setup
echo ============================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 goto error

echo.
echo [2/4] Setting up database (migrations + seed)...
call npx prisma migrate dev --name init
call node src/utils/seed.js
if errorlevel 1 goto error
cd ..

echo.
echo [3/4] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 goto error
cd ..

echo.
echo [4/4] Installing Electron dependencies...
cd electron
call npm install
if errorlevel 1 goto error
cd ..

echo.
echo ============================================
echo   Setup complete!
echo.
echo   To run in development mode:
echo     npm run dev:backend   (in one terminal)
echo     npm run dev:frontend  (in another terminal)
echo.
echo   To build Windows .exe:
echo     npm run build:exe
echo.
echo   Default accounts:
echo     Admin:   admin@pizza.com   / admin123
echo     Cashier: cashier@pizza.com / cashier123
echo ============================================
pause
goto end

:error
echo.
echo ERROR: Setup failed. Check the output above.
pause
exit /b 1

:end
