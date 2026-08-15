@echo off
echo ========================================================
echo Starting Adaptive Decision System Backend (FastAPI)...
echo ========================================================
cd /d "%~dp0backend_project\backend"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
