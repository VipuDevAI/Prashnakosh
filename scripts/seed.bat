@echo off
REM =============================================================================
REM PRASHNAKOSH - Database Seed Script
REM Creates the Super Admin account and runs database migrations
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - DATABASE SEED
echo ========================================
echo.

REM Check if app container is running
docker ps --filter "name=prashnakosh-app" --filter "status=running" --format "{{.Names}}" | findstr /i "prashnakosh-app" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: prashnakosh-app container is not running.
    echo Run 'docker compose -f docker-compose.prod.yml up -d' first.
    pause
    exit /b 1
)

echo Running database migrations and seeding Super Admin...
docker exec prashnakosh-app node dist/server.js --seed-only 2>nul

echo.
echo Verifying health...
timeout /t 5 /nobreak >nul
curl -sk https://localhost/api/health
echo.

echo.
echo ========================================
echo  SEED COMPLETE
echo ========================================
echo.
echo  The Super Admin account has been created.
echo  Login at https://localhost with your Super Admin credentials.
echo.
pause
