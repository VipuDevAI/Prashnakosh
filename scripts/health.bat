@echo off
REM =============================================================================
REM PRASHNAKOSH - Health Check Script
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - HEALTH CHECK
echo ========================================
echo.

echo [Containers]
docker compose -f docker-compose.prod.yml ps
echo.

echo [Application Health]
curl -sk https://localhost/api/health 2>nul
echo.
echo.

echo [Database]
docker exec prashnakosh-db pg_isready -U prashnakosh
echo.

echo [Resource Usage]
docker stats --no-stream prashnakosh-app prashnakosh-db prashnakosh-nginx
echo.
pause
