@echo off
REM =============================================================================
REM PRASHNAKOSH - Restore Script
REM Restores a PostgreSQL backup
REM =============================================================================

REM Read DATA_DIR from .env or use default
for /f "tokens=2 delims==" %%a in ('findstr /i "DATA_DIR" .env 2^>nul') do set DATA_DIR=%%a
if "%DATA_DIR%"=="" set DATA_DIR=E:\PrashnakoshData

echo Available backups:
echo.
dir /b "%DATA_DIR%\backups\daily\*.dump" 2>nul
dir /b "%DATA_DIR%\backups\weekly\*.dump" 2>nul
echo.

set /p BACKUP_PATH="Enter full path to backup file: "

if not exist "%BACKUP_PATH%" (
    echo ERROR: File not found: %BACKUP_PATH%
    pause
    exit /b 1
)

echo.
echo WARNING: This will overwrite the current database.
set /p CONFIRM="Are you sure? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo Cancelled.
    pause
    exit /b 0
)

echo Restoring from: %BACKUP_PATH%...
docker exec -i prashnakosh-db pg_restore -U prashnakosh -d prashnakosh --clean --if-exists < "%BACKUP_PATH%"

if %ERRORLEVEL% equ 0 (
    echo Restore successful.
) else (
    echo Restore completed with warnings (this is normal for clean restore).
)
pause
