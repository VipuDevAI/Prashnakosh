@echo off
REM =============================================================================
REM PRASHNAKOSH - First-time Installation Script
REM Run this once on a fresh server after Docker Desktop is installed
REM =============================================================================

echo.
echo ========================================
echo  PRASHNAKOSH - INSTALLATION
echo ========================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check Docker Compose
docker compose version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker Compose is not available. Ensure Docker Desktop is updated.
    pause
    exit /b 1
)

REM Check .env exists
if not exist ".env" (
    echo ERROR: .env file not found.
    echo.
    echo  Step 1: Copy .env.example to .env
    echo  Step 2: Edit .env and set DB_PASSWORD and SESSION_SECRET
    echo  Step 3: Run this script again
    echo.
    pause
    exit /b 1
)

REM Read DATA_DIR from .env or use default
for /f "tokens=2 delims==" %%a in ('findstr /i "DATA_DIR" .env') do set DATA_DIR=%%a
if "%DATA_DIR%"=="" set DATA_DIR=E:\PrashnakoshData

echo [1/6] Creating data directories at %DATA_DIR%...
mkdir "%DATA_DIR%\postgres\data" 2>nul
mkdir "%DATA_DIR%\uploads" 2>nul
mkdir "%DATA_DIR%\exports" 2>nul
mkdir "%DATA_DIR%\backups\daily" 2>nul
mkdir "%DATA_DIR%\backups\weekly" 2>nul
mkdir "%DATA_DIR%\backups\monthly" 2>nul
mkdir "%DATA_DIR%\logs\app" 2>nul
mkdir "%DATA_DIR%\logs\nginx" 2>nul
echo    Done.

REM Generate self-signed SSL certificate
echo.
echo [2/6] Generating SSL certificate...
mkdir ssl 2>nul
if not exist "ssl\cert.pem" (
    docker run --rm -v "%cd%\ssl:/ssl" alpine/openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /ssl/key.pem -out /ssl/cert.pem -subj "/CN=prashnakosh.local/O=SmartGenEduX"
    echo    SSL certificate created (valid for 10 years^).
) else (
    echo    SSL certificate already exists, skipping.
)

REM Build the application image locally
echo.
echo [3/6] Building Prashnakosh Docker image (this takes 5-10 minutes on first run)...
docker build -t ghcr.io/smartgenedux/prashnakosh:latest .
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker build failed. Check the output above for errors.
    pause
    exit /b 1
)
echo    Image built successfully.

REM Pull supporting images
echo.
echo [4/6] Pulling PostgreSQL and Nginx images...
docker pull postgres:16-alpine
docker pull nginx:alpine
echo    Done.

REM Start services
echo.
echo [5/6] Starting Prashnakosh services...
docker compose -f docker-compose.prod.yml up -d

REM Wait for database
echo.
echo [6/6] Waiting for database to become healthy...
timeout /t 20 /nobreak >nul

REM Verify health
echo.
echo Verifying application health...
curl -sk https://localhost/api/health
echo.

echo.
echo ========================================
echo  INSTALLATION COMPLETE
echo ========================================
echo.
echo  Application URL:  https://localhost
echo  Data Directory:   %DATA_DIR%
echo.
echo  Management Commands:
echo    Status:   docker compose -f docker-compose.prod.yml ps
echo    Logs:     docker compose -f docker-compose.prod.yml logs -f
echo    Stop:     docker compose -f docker-compose.prod.yml down
echo    Restart:  docker compose -f docker-compose.prod.yml restart
echo.
echo  Next Step:
echo    The Super Admin account is created automatically on first startup.
echo    Login with your configured Super Admin credentials.
echo.
echo  Maintenance Scripts:
echo    scripts\health.bat   - Check system health
echo    scripts\backup.bat   - Create database backup
echo    scripts\restore.bat  - Restore from backup
echo    scripts\update.bat   - Update to latest version
echo.
pause
