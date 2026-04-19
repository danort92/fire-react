@echo off
title FIRE App

:: Start backend
start "FIRE Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --port 8000"

:: Wait a moment, then start frontend
timeout /t 3 /nobreak >nul
start "FIRE Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Open browser after another short wait
timeout /t 5 /nobreak >nul
start http://localhost:5173
