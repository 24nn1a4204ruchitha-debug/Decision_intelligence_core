@echo off
echo ========================================================
echo Starting Full-Stack: FastAPI Backend + React Frontend
echo ========================================================
start "Backend (FastAPI on Port 8000)" cmd /k "cd /d %~dp0backend_project\backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak > nul
start "Frontend (React on Port 5173)" cmd /k "cd /d %~dp0artifacts\adaptive-decision-system && npx vite --host 127.0.0.1 --port 5173"
echo Both Backend (http://localhost:8000) and Frontend (http://localhost:5173) are starting!
