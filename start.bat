@echo off
title FIRE App

set ROOT=%~dp0

echo Installing backend dependencies...
pip install -r "%ROOT%backend\requirements.txt" -q

echo Starting backend...
start "FIRE Backend" cmd /k "cd /d %ROOT%backend && python -m uvicorn main:app --reload --port 8000"

echo Starting frontend...
start "FIRE Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo Opening browser in 10 seconds...
ping -n 11 127.0.0.1 > nul
start "" "http://localhost:5173"
