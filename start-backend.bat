@echo off
cd /d "%~dp0"
echo Starting Stock Trading Backend (FastAPI)...
if exist "openhands-env\Scripts\python.exe" (
    openhands-env\Scripts\python.exe run.py
) else (
    python run.py
)
pause
