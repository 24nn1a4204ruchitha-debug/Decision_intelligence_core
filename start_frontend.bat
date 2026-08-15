@echo off
echo ========================================================
echo Starting Adaptive Decision System Frontend (Vite/React)...
echo ========================================================
cd /d "%~dp0artifacts\adaptive-decision-system"
npx vite --host 127.0.0.1 --port 5173
pause
