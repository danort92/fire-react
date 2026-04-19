@echo off
title FIRE App

echo Installing backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt -q

echo Starting backend...
start "FIRE Backend" cmd /k "cd /d \"%~dp0backend\" && python -m uvicorn main:app --reload --port 8000"

echo Starting frontend...
start "FIRE Frontend" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

echo Opening browser in 20 seconds...
ping -n 21 127.0.0.1 > nul
start "" "http://localhost:5173"
