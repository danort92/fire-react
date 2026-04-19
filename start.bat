@echo off
title FIRE App

:: Install backend dependencies (skips if already installed)
echo [1/4] Checking backend dependencies...
cd /d %~dp0backend
pip install -r requirements.txt -q
if errorlevel 1 (
    echo ERROR: pip install failed. Make sure Python is installed.
    pause
    exit /b 1
)

:: Start backend
echo [2/4] Starting backend...
start "FIRE Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

:: Install frontend dependencies if node_modules is missing
echo [3/4] Checking frontend dependencies...
if not exist "%~dp0frontend\node_modules" (
    echo Installing npm packages (first run only)...
    cd /d %~dp0frontend
    npm install
)

:: Start frontend
echo [4/4] Starting frontend...
start "FIRE Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Open browser
timeout /t 6 /nobreak >nul
start http://localhost:5173
