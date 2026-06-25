@echo off
REM =============================================================================
REM PRASHNAKOSH - First-time Installation
REM Prerequisites: Docker Desktop installed and running
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - INSTALLATION
echo ========================================
echo.

REM --- Preflight checks ---

docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Docker is not installed.
    echo        Download from: https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe
    pause
    exit /b 1
)

docker compose version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Docker Compose not available. Update Docker Desktop.
    pause
    exit /b 1
)

if not exist ".env" (
    echo [FAIL] .env file not found.
    echo.
    echo   1. copy .env.example .env
    echo   2. Edit .env and fill in all values
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)

REM --- Read configuration ---

for /f "tokens=2 delims==" %%a in ('findstr /i "^DATA_DIR" .env') do set DATA_DIR=%%a
if "%DATA_DIR%"=="" set DATA_DIR=E:\PrashnakoshData

for /f "tokens=2 delims==" %%a in ('findstr /i "^GHCR_USER" .env') do set GHCR_USER=%%a
for /f "tokens=2 delims==" %%a in ('findstr /i "^GHCR_TOKEN" .env') do set GHCR_TOKEN=%%a

if "%GHCR_USER%"=="" (
    echo [FAIL] GHCR_USER is not set in .env
    echo        Set your GitHub username in .env
    pause
    exit /b 1
)
if "%GHCR_TOKEN%"=="" (
    echo [FAIL] GHCR_TOKEN is not set in .env
    echo        Generate a token at: https://github.com/settings/tokens/new?scopes=read:packages
    pause
    exit /b 1
)

REM --- Step 1: Create data directories ---

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

REM --- Step 2: Generate SSL certificate ---

echo.
echo [2/6] Generating SSL certificate...
mkdir ssl 2>nul
if not exist "ssl\cert.pem" (
    docker run --rm -v "%cd%\ssl:/ssl" alpine/openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /ssl/key.pem -out /ssl/cert.pem -subj "/CN=prashnakosh.local/O=SmartGenEduX"
    echo       Certificate created (valid 10 years^).
) else (
    echo       Certificate already exists, skipping.
)

REM --- Step 3: Authenticate with GHCR ---

echo.
echo [3/6] Authenticating with GitHub Container Registry...
echo %GHCR_TOKEN%| docker login ghcr.io -u %GHCR_USER% --password-stdin
if %ERRORLEVEL% neq 0 (
    echo [FAIL] GHCR authentication failed. Check GHCR_USER and GHCR_TOKEN in .env
    pause
    exit /b 1
)
echo       Authenticated.

REM --- Step 4: Pull images ---

echo.
echo [4/6] Pulling Docker images (first run may take 5-10 minutes)...
docker compose pull
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Image pull failed. Check your internet connection and GHCR credentials.
    pause
    exit /b 1
)
echo       All images pulled.

REM --- Step 5: Start services ---

echo.
echo [5/6] Starting Prashnakosh...
docker compose up -d
echo       Containers started.

REM --- Step 6: Wait and verify ---

echo.
echo [6/6] Waiting for services to become healthy...
timeout /t 20 /nobreak >nul

echo.
echo Verifying...
curl -sk https://localhost/api/health 2>nul
echo.

docker compose ps

echo.
echo ========================================
echo  INSTALLATION COMPLETE
echo ========================================
echo.
echo  URL:            https://localhost
echo  Data:           %DATA_DIR%
echo.
echo  Commands:
echo    Status:       docker compose ps
echo    Logs:         docker compose logs -f
echo    Stop:         docker compose down
echo    Health:       scripts\health.bat
echo    Backup:       scripts\backup.bat
echo.
pause
