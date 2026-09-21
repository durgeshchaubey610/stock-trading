@echo off
cd /d "%~dp0"
echo ========================================================
echo Stopping Stock Trading AI Docker Containers
echo ========================================================
docker compose down
echo.
echo All containers stopped.
pause
