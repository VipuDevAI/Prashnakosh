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

REM Check .env exists
if not exist ".env" (
    echo ERROR: .env file not found. Copy .env.example to .env and configure it.
    pause
    exit /b 1
)

REM Read DATA_DIR from .env or use default
for /f "tokens=2 delims==" %%a in ('findstr /i "DATA_DIR" .env') do set DATA_DIR=%%a
if "%DATA_DIR%"=="" set DATA_DIR=E:\PrashnakoshData

echo Creating data directories at %DATA_DIR%...
mkdir "%DATA_DIR%\postgres\data" 2>nul
mkdir "%DATA_DIR%\uploads" 2>nul
mkdir "%DATA_DIR%\exports" 2>nul
mkdir "%DATA_DIR%\backups\daily" 2>nul
mkdir "%DATA_DIR%\backups\weekly" 2>nul
mkdir "%DATA_DIR%\backups\monthly" 2>nul
mkdir "%DATA_DIR%\logs\app" 2>nul
mkdir "%DATA_DIR%\logs\nginx" 2>nul

REM Generate self-signed SSL certificate
echo Generating SSL certificate...
mkdir ssl 2>nul
docker run --rm -v "%cd%\ssl:/ssl" alpine/openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /ssl/key.pem -out /ssl/cert.pem -subj "/CN=prashnakosh.local/O=SmartGenEduX"

REM Pull images
echo.
echo Pulling Docker images (this may take 5-10 minutes)...
docker compose -f docker-compose.prod.yml pull

REM Start services
echo.
echo Starting Prashnakosh...
docker compose -f docker-compose.prod.yml up -d

REM Wait for database
echo Waiting for database to be ready...
timeout /t 15 /nobreak >nul

REM Run database migrations
echo Running database setup...
docker exec prashnakosh-app node -e "require('./dist/server.js')" 2>nul

echo.
echo ========================================
echo  INSTALLATION COMPLETE
echo ========================================
echo.
echo  Application: https://localhost
echo  Status:      docker compose -f docker-compose.prod.yml ps
echo  Logs:        docker compose -f docker-compose.prod.yml logs -f
echo.
echo  Next: Run scripts\seed.bat to create initial data
echo.
pause
