@echo off
REM =============================================================================
REM PRASHNAKOSH v1.0 - First-time Installation
REM Prerequisites: Docker Desktop installed and running
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH v1.0 - INSTALLATION
echo ========================================
echo.

REM ===== Preflight: Docker =====

docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Docker is not installed.
    echo        Download: https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe
    pause
    exit /b 1
)
echo [ OK ] Docker is installed.

docker compose version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Docker Compose not available. Update Docker Desktop.
    pause
    exit /b 1
)
echo [ OK ] Docker Compose is available.

REM ===== Preflight: .env =====

if not exist ".env" (
    echo.
    echo [FAIL] .env file not found.
    echo.
    echo   1. copy .env.example .env
    echo   2. Open .env in Notepad and fill in every value
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)
echo [ OK ] .env file found.

REM ===== Read and validate every required variable =====

set MISSING=0

for /f "tokens=1,* delims==" %%a in ('findstr /i "^GHCR_USER=" .env') do set GHCR_USER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr /i "^GHCR_TOKEN=" .env') do set GHCR_TOKEN=%%b
for /f "tokens=1,* delims==" %%a in ('findstr /i "^IMAGE_TAG=" .env') do set IMAGE_TAG=%%b
for /f "tokens=1,* delims==" %%a in ('findstr /i "^DB_PASSWORD=" .env') do set DB_PASSWORD=%%b
for /f "tokens=1,* delims==" %%a in ('findstr /i "^SESSION_SECRET=" .env') do set SESSION_SECRET=%%b
for /f "tokens=1,* delims==" %%a in ('findstr /i "^DATA_DIR=" .env') do set DATA_DIR=%%b
for /f "tokens=1,* delims==" %%a in ('findstr /i "^SUPER_ADMIN_EMAIL=" .env') do set SA_EMAIL=%%b
for /f "tokens=1,* delims==" %%a in ('findstr /i "^SUPER_ADMIN_PASSWORD=" .env') do set SA_PASSWORD=%%b

echo.
echo --- Validating .env configuration ---

if "%GHCR_USER%"=="" (
    echo [FAIL] GHCR_USER is empty. Set your GitHub username.
    set MISSING=1
) else (
    echo [ OK ] GHCR_USER = %GHCR_USER%
)

if "%GHCR_TOKEN%"=="" (
    echo [FAIL] GHCR_TOKEN is empty. Generate at: https://github.com/settings/tokens/new?scopes=read:packages
    set MISSING=1
) else (
    echo [ OK ] GHCR_TOKEN = ****%GHCR_TOKEN:~-4%
)

if "%DB_PASSWORD%"=="" (
    echo [FAIL] DB_PASSWORD is empty. Set a strong database password.
    set MISSING=1
) else (
    echo [ OK ] DB_PASSWORD = ****
)

if "%SESSION_SECRET%"=="" (
    echo [FAIL] SESSION_SECRET is empty. Generate a 64-char random string.
    echo        PowerShell: -join ((48..57)+(65..90)+(97..122)^|Get-Random -Count 64^|%%{[char]$_})
    set MISSING=1
) else (
    echo [ OK ] SESSION_SECRET = ****%SESSION_SECRET:~-4%
)

if "%SA_EMAIL%"=="" (
    echo [FAIL] SUPER_ADMIN_EMAIL is empty. Set the Super Admin login email.
    set MISSING=1
) else (
    echo [ OK ] SUPER_ADMIN_EMAIL = %SA_EMAIL%
)

if "%SA_PASSWORD%"=="" (
    echo [FAIL] SUPER_ADMIN_PASSWORD is empty. Set the Super Admin login password.
    set MISSING=1
) else (
    echo [ OK ] SUPER_ADMIN_PASSWORD = ****
)

if "%DATA_DIR%"=="" set DATA_DIR=E:\PrashnakoshData
echo [ OK ] DATA_DIR = %DATA_DIR%

if "%IMAGE_TAG%"=="" set IMAGE_TAG=latest
echo [ OK ] IMAGE_TAG = %IMAGE_TAG%

echo.
if %MISSING% equ 1 (
    echo ========================================
    echo  CONFIGURATION INCOMPLETE
    echo ========================================
    echo.
    echo  Open .env in Notepad and fill in the values marked [FAIL] above.
    echo  Then run this script again.
    echo.
    pause
    exit /b 1
)

echo All required variables are set.
echo.

REM ===== Step 1: Create data directories =====

echo [1/6] Creating data directories at %DATA_DIR%...
mkdir "%DATA_DIR%\postgres\data" 2>nul
mkdir "%DATA_DIR%\uploads" 2>nul
mkdir "%DATA_DIR%\exports" 2>nul
mkdir "%DATA_DIR%\backups\daily" 2>nul
mkdir "%DATA_DIR%\backups\weekly" 2>nul
mkdir "%DATA_DIR%\backups\monthly" 2>nul
mkdir "%DATA_DIR%\logs\app" 2>nul
mkdir "%DATA_DIR%\logs\nginx" 2>nul
echo       Done.

REM ===== Step 2: Generate SSL certificate =====

echo.
echo [2/6] Generating SSL certificate...
mkdir ssl 2>nul
if not exist "ssl\cert.pem" (
    docker run --rm -v "%cd%\ssl:/ssl" alpine/openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /ssl/key.pem -out /ssl/cert.pem -subj "/CN=prashnakosh.local/O=SmartGenEduX"
    echo       Certificate created (valid 10 years^).
) else (
    echo       Certificate already exists, skipping.
)

REM ===== Step 3: Authenticate with GHCR =====

echo.
echo [3/6] Authenticating with GitHub Container Registry...
echo %GHCR_TOKEN%| docker login ghcr.io -u %GHCR_USER% --password-stdin
if %ERRORLEVEL% neq 0 (
    echo [FAIL] GHCR authentication failed.
    echo        Check GHCR_USER and GHCR_TOKEN in .env
    pause
    exit /b 1
)
echo       Authenticated.

REM ===== Step 4: Pull images =====

echo.
echo [4/6] Pulling Docker images (first run may take 5-10 minutes)...
docker compose pull
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Image pull failed. Check internet connection and GHCR credentials.
    pause
    exit /b 1
)
echo       All images pulled.

REM ===== Step 5: Start services =====

echo.
echo [5/6] Starting Prashnakosh...
docker compose up -d
echo       Containers started.

REM ===== Step 6: Wait and verify =====

echo.
echo [6/6] Waiting for services to become healthy (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo --- Health Check ---
curl -sk https://localhost/api/health 2>nul
echo.
echo.
docker compose ps
echo.

echo ========================================
echo  INSTALLATION COMPLETE
echo ========================================
echo.
echo  Application:    https://localhost
echo  Data Directory: %DATA_DIR%
echo.
echo  Login with:
echo    School Code:  (value of SUPER_ADMIN_SCHOOL_CODE in .env)
echo    Email:        %SA_EMAIL%
echo    Password:     (value of SUPER_ADMIN_PASSWORD in .env)
echo.
echo  Management:
echo    Health check:   scripts\health.bat
echo    Backup:         scripts\backup.bat
echo    Update:         scripts\update.bat
echo    Logs:           docker compose logs -f
echo.
pause
