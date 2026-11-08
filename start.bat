@echo off
title Multi-Material FGM Nanostructure Generator
echo ==============================================================
echo    Multi-Material FGM Nanostructure Generator (LAMMPS MD)
echo ==============================================================
echo.

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not detected on your PC.
    echo Please download and install Node.js from: https://nodejs.org
    echo After installing, double-click start.bat again.
    echo.
    pause
    exit /b
)

if not exist node_modules (
    echo [1/2] First time setup: Installing dependencies (takes ~30 seconds)...
    call npm install
    echo.
)

echo [2/2] Launching FGM Nanostructure Generator...
echo Opening browser at http://localhost:3000
start http://localhost:3000
call npm run dev
pause
