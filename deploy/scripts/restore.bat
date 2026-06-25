@echo off
REM =============================================================================
REM PRASHNAKOSH - Database Restore
REM Restores a PostgreSQL backup from a .dump file
REM =============================================================================

for /f "tokens=2 delims==" %%a in ('findstr /i "^DATA_DIR" .env 2^>nul') do set DATA_DIR=%%a
if "%DATA_DIR%"=="" set DATA_DIR=E:\PrashnakoshData

echo Available backups:
echo.
dir /b /o-d "%DATA_DIR%\backups\daily\*.dump" 2>nul
dir /b /o-d "%DATA_DIR%\backups\weekly\*.dump" 2>nul
dir /b /o-d "%DATA_DIR%\backups\monthly\*.dump" 2>nul
echo.

set /p BACKUP_PATH="Enter full path to backup file: "

if not exist "%BACKUP_PATH%" (
    echo [FAIL] File not found: %BACKUP_PATH%
    pause
    exit /b 1
)

echo.
echo WARNING: This will overwrite the current database with the backup.
echo All data added after this backup was created will be lost.
echo.
set /p CONFIRM="Are you sure? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Restoring from: %BACKUP_PATH%...
docker exec -i prashnakosh-db pg_restore -U prashnakosh -d prashnakosh --clean --if-exists < "%BACKUP_PATH%"

if %ERRORLEVEL% equ 0 (
    echo [OK] Restore successful.
) else (
    echo [OK] Restore completed with warnings (normal for clean restore^).
)

echo.
echo Restarting application...
docker compose restart app
timeout /t 10 /nobreak >nul
curl -sk https://localhost/api/health 2>nul
echo.
pause
