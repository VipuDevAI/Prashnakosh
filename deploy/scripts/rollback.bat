@echo off
REM =============================================================================
REM PRASHNAKOSH - Rollback to Previous Version
REM Reverts the app container to the image that was running before the last update
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - ROLLBACK
echo ========================================
echo.

if not exist ".last_image_id" (
    echo [FAIL] No rollback information found.
    echo        Rollback is only available after running scripts\update.bat
    echo.
    echo        To manually rollback, edit .env and set IMAGE_TAG to a specific
    echo        version (e.g., v1.0.0^), then run: docker compose up -d
    pause
    exit /b 1
)

set /p PREVIOUS_IMAGE=<.last_image_id
echo Previous image ID: %PREVIOUS_IMAGE%
echo.

set /p CONFIRM="Rollback to the previous version? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [1/3] Stopping current services...
docker compose down

echo.
echo [2/3] Starting with previous image...
docker compose up -d

echo.
echo [3/3] Verifying health...
timeout /t 15 /nobreak >nul
curl -sk https://localhost/api/health 2>nul
echo.

echo.
echo ========================================
echo  ROLLBACK COMPLETE
echo ========================================
echo.
echo  Verify at: https://localhost
echo.
pause
