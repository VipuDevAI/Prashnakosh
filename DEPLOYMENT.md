# PRASHNAKOSH — Production Deployment Guide

## Prerequisites
- Windows 10 Pro with Docker Desktop installed
- Git for Windows installed
- Internet access (for initial Docker image pull)

## Quick Start

### 1. Clone Deployment Config
```powershell
cd C:\
git clone https://github.com/SmartGenEduX/prashnakosh.git Prashnakosh
cd Prashnakosh
```

### 2. Configure Environment
```powershell
copy .env.example .env
notepad .env
```
Fill in:
- `DB_PASSWORD` — generate with: `openssl rand -hex 32`
- `SESSION_SECRET` — generate with: `openssl rand -hex 64`
- `DATA_DIR` — path to data directory (default: `E:\PrashnakoshData`)

### 3. Login to Docker Registry
```powershell
docker login ghcr.io -u YOUR_GITHUB_USERNAME -p YOUR_PAT
```

### 4. Install
```powershell
scripts\install.bat
```

### 5. Verify
Open browser: https://localhost

## Daily Operations

| Task | Command |
|------|---------|
| Check health | `scripts\health.bat` |
| Manual backup | `scripts\backup.bat` |
| Update to latest | `scripts\update.bat` |
| Rollback | `scripts\rollback.bat` |
| Restore from backup | `scripts\restore.bat` |
| View logs | `docker compose -f docker-compose.prod.yml logs -f` |
| Restart | `docker compose -f docker-compose.prod.yml restart` |
| Stop | `docker compose -f docker-compose.prod.yml down` |
| Start | `docker compose -f docker-compose.prod.yml up -d` |

## Backup Schedule
Set up Windows Task Scheduler to run `C:\Prashnakosh\scripts\backup.bat` daily at 2 AM.

## Ports
| Port | Service | Access |
|------|---------|--------|
| 80 | HTTP (redirects to HTTPS) | LAN |
| 443 | HTTPS (main application) | LAN |
| 5432 | PostgreSQL | localhost only |

## Support
Contact SmartGenEduX for technical support.
