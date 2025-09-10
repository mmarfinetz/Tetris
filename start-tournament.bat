@echo off
REM Tetris AI Tournament System Startup Script for Windows

echo ======================================
echo Tetris AI Tournament System Launcher
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo Node.js detected: 
node -v
echo npm detected: 
npm -v
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
) else (
    echo Dependencies already installed
)

echo.
echo Starting tournament server...
echo ======================================

REM Start the server
start /B node server.js

REM Wait for server to start
timeout /t 3 /nobreak >nul

echo.
echo TOURNAMENT SYSTEM READY!
echo ======================================
echo.
echo Access Points:
echo   - Game: http://localhost:3000/tetris-tournament.html
echo   - Admin: http://localhost:3000/admin-dashboard.html
echo   - Status: http://localhost:3000/tournament-loader.html
echo.
echo Keyboard Shortcuts:
echo   - Ctrl+T: Open tournament panel
echo   - Ctrl+W: Toggle weight visualizer
echo   - Ctrl+S: Submit to tournament
echo.
echo Press any key to open the game in your browser...
pause >nul

REM Open browser
start http://localhost:3000/tournament-loader.html

echo.
echo Server is running. Close this window to stop the server.
pause >nul
