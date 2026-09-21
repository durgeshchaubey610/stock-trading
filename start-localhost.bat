@echo off
cd /d "%~dp0"
echo ========================================================
echo Starting Stock Trading AI Application on Localhost
echo ========================================================

REM Use virtual environment if present
if exist "openhands-env\Scripts\python.exe" (
    set PYTHON_CMD=openhands-env\Scripts\python.exe
) else (
    set PYTHON_CMD=python
)

echo [1/2] Launching Backend API (FastAPI at http://localhost:8000)...
start "Stock Trading Backend" cmd /k "%PYTHON_CMD% run.py"

echo [2/2] Launching Frontend (Vite at http://localhost:5173)...
start "Stock Trading Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo Both services launched in separate windows!
echo - Backend API: http://localhost:8000
echo - Swagger Docs: http://localhost:8000/docs
echo - Frontend Web: http://localhost:5173
echo ========================================================
