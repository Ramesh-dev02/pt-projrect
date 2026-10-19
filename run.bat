@echo off
title LocalPulse Tamil Nadu - Local Services Marketplace & SQLite DB
echo =====================================================================
echo    LocalPulse - Tamil Nadu Local Services Marketplace
echo    Starting Python Backend Server & SQLite Database (marketplace.db)
echo =====================================================================
echo.

cd /d "%~dp0"

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Python 3 was not found in PATH.
    echo Opening application directly in browser (Local Storage mode)...
    start "" "%~dp0index.html"
    goto end
)

:: Start python server in background
echo [1/2] Starting Python REST API & SQLite Server on http://localhost:3000 ...
start /b "" python server.py

:: Wait a brief moment for server to bind port
timeout /t 2 /nobreak >nul

:: Open browser at http://localhost:3000
echo [2/2] Opening LocalPulse in your default browser...
start http://localhost:3000

echo.
echo =====================================================================
echo    LocalPulse is running!
echo    URL: http://localhost:3000
echo    Database: marketplace.db (SQLite 3)
echo =====================================================================
echo.
echo Leave this window open while using the application.
echo To stop the server, press Ctrl+C or close this window.
echo.
pause

:end
