@echo off
REM =============================================================================
REM PRASHNAKOSH - Update Script
REM Pulls latest version and restarts with zero downtime
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - UPDATE
echo ========================================
echo.

REM Step 1: Pre-update backup
echo [1/4] Creating pre-update backup...
call scripts\backup.bat

REM Step 2: Pull latest image
echo.
echo [2/4] Pulling latest version...
docker compose -f docker-compose.prod.yml pull

REM Step 3: Restart with new version
echo.
echo [3/4] Restarting services...
docker compose -f docker-compose.prod.yml up -d

REM Step 4: Verify health
echo.
echo [4/4] Verifying health...
timeout /t 10 /nobreak >nul
curl -sk https://localhost/api/health

echo.
echo ========================================
echo  UPDATE COMPLETE
echo ========================================
echo  If issues occur, run: scripts\rollback.bat
echo.
pause
