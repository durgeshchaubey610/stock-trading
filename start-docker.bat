@echo off
cd /d "%~dp0"
echo ========================================================
echo Starting Stock Trading AI Application with Docker
echo ========================================================

REM Check if docker command is available
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker command was not found on your system PATH.
    echo.
    echo If Docker Desktop is not installed yet:
    echo 1. Run the installer located at:
    echo    "C:\Users\durgeshchaubey\Downloads\Docker Desktop Installer.exe"
    echo 2. Open Docker Desktop and let it start up.
    echo 3. Re-run this script (start-docker.bat).
    echo ========================================================
    pause
    exit /b 1
)

REM Check if Docker daemon is running
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Docker Desktop is not currently running.
    echo Please start Docker Desktop from your Start Menu and wait for the engine to start.
    echo Then run this script again.
    echo ========================================================
    pause
    exit /b 1
)

echo [1/2] Building and launching containers in background (docker compose up -d --build)...
docker compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo Application Containers Successfully Started!
    echo ========================================================
    echo - Web Application:  http://localhost
    echo - Backend API:      http://localhost:8000
    echo - Swagger Docs:     http://localhost:8000/docs
    echo - MySQL Database:   localhost:3306
    echo ========================================================
) else (
    echo.
    echo [ERROR] Failed to start Docker containers.
)

pause
