@echo off
REM =============================================================================
REM PRASHNAKOSH - Health Check
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - HEALTH CHECK
echo ========================================
echo.

echo --- Container Status ---
docker compose ps
echo.

echo --- Application Health ---
curl -sk https://localhost/api/health 2>nul
echo.
echo.

echo --- Database ---
docker exec prashnakosh-db pg_isready -U prashnakosh
echo.

echo --- Storage ---
curl -sk https://localhost/api/health 2>nul | findstr "healthy" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Application is healthy
) else (
    echo [WARN] Application may not be responding
)
echo.

echo --- Resource Usage ---
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" prashnakosh-app prashnakosh-db prashnakosh-nginx
echo.
pause
