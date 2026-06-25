@echo off
REM =============================================================================
REM PRASHNAKOSH - Database Backup
REM Creates a timestamped PostgreSQL dump in the backups directory
REM =============================================================================

for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set DATESTAMP=%%c%%a%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIMESTAMP=%%a%%b
set FILENAME=prashnakosh_%DATESTAMP%_%TIMESTAMP%.dump

for /f "tokens=2 delims==" %%a in ('findstr /i "^DATA_DIR" .env 2^>nul') do set DATA_DIR=%%a
if "%DATA_DIR%"=="" set DATA_DIR=E:\PrashnakoshData
set BACKUP_DIR=%DATA_DIR%\backups\daily

echo Creating backup: %FILENAME%...
docker exec prashnakosh-db pg_dump -U prashnakosh -Fc prashnakosh > "%BACKUP_DIR%\%FILENAME%"

if %ERRORLEVEL% equ 0 (
    echo [OK] Backup saved: %BACKUP_DIR%\%FILENAME%
    REM Cleanup backups older than 7 days
    forfiles /p "%BACKUP_DIR%" /m *.dump /d -7 /c "cmd /c del @path" 2>nul
) else (
    echo [FAIL] Backup failed. Is prashnakosh-db running?
)
