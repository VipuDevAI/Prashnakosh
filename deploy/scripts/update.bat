@echo off
REM =============================================================================
REM PRASHNAKOSH - Update to Latest Version
REM Pulls the latest image from GHCR and restarts services
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - UPDATE
echo ========================================
echo.

REM --- Read GHCR credentials ---

for /f "tokens=2 delims==" %%a in ('findstr /i "^GHCR_USER" .env') do set GHCR_USER=%%a
for /f "tokens=2 delims==" %%a in ('findstr /i "^GHCR_TOKEN" .env') do set GHCR_TOKEN=%%a

REM --- Step 1: Pre-update backup ---

echo [1/5] Creating pre-update backup...
call scripts\backup.bat

REM --- Step 2: Record current image for rollback ---

echo.
echo [2/5] Recording current version for rollback...
for /f "tokens=*" %%i in ('docker inspect --format "{{.Image}}" prashnakosh-app 2^>nul') do set CURRENT_IMAGE=%%i
echo       Current: %CURRENT_IMAGE%
echo %CURRENT_IMAGE%> .last_image_id

REM --- Step 3: Authenticate and pull ---

echo.
echo [3/5] Pulling latest image from GHCR...
echo %GHCR_TOKEN%| docker login ghcr.io -u %GHCR_USER% --password-stdin >nul 2>&1
docker compose pull app
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Pull failed. Check internet connection and GHCR credentials.
    pause
    exit /b 1
)

REM --- Step 4: Restart with new image ---

echo.
echo [4/5] Restarting services...
docker compose up -d

REM --- Step 5: Verify ---

echo.
echo [5/5] Verifying health...
timeout /t 15 /nobreak >nul
curl -sk https://localhost/api/health 2>nul
echo.

echo.
echo ========================================
echo  UPDATE COMPLETE
echo ========================================
echo.
echo  If issues occur, run: scripts\rollback.bat
echo.
pause
