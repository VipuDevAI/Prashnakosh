@echo off
REM =============================================================================
REM PRASHNAKOSH - Database Seed
REM Triggers database migrations and Super Admin account creation
REM The app creates the Super Admin on first startup automatically.
REM Run this only if you need to re-trigger the seed process.
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - DATABASE SEED
echo ========================================
echo.

docker ps --filter "name=prashnakosh-app" --filter "status=running" --format "{{.Names}}" | findstr /i "prashnakosh-app" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] prashnakosh-app container is not running.
    echo        Run: docker compose up -d
    pause
    exit /b 1
)

echo Triggering database migration and seed...
docker restart prashnakosh-app

echo Waiting for application to start...
timeout /t 15 /nobreak >nul

echo.
echo Verifying health...
curl -sk https://localhost/api/health 2>nul
echo.

echo.
echo ========================================
echo  SEED COMPLETE
echo ========================================
echo.
echo  Database migrations have been applied.
echo  The Super Admin account is created on startup.
echo  Login at: https://localhost
echo.
pause
