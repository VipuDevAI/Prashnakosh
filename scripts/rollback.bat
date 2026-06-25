@echo off
REM =============================================================================
REM PRASHNAKOSH - Rollback Script
REM Reverts to the previous Docker image version
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - ROLLBACK
echo ========================================
echo.

echo Available image versions:
docker image ls ghcr.io/smartgenedux/prashnakosh --format "{{.Tag}}  {{.CreatedAt}}  {{.Size}}"

echo.
set /p VERSION="Enter version tag to rollback to (e.g., v1.0.0 or sha): "

if "%VERSION%"=="" (
    echo ERROR: Version required.
    pause
    exit /b 1
)

echo.
echo Rolling back to version: %VERSION%
echo.

REM Update image tag in compose and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

echo.
echo Waiting for health check...
timeout /t 10 /nobreak >nul
curl -sk https://localhost/api/health

echo.
echo Rollback complete. Verify at https://localhost
pause
