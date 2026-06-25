# Prashnakosh — Deployment Guide
**Architecture**: Private Registry (GHCR) + Docker Compose  
**Target**: Windows 10 Pro Server  
**No source code exists on this server.**

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **OS** | Windows 10 Pro (64-bit) with Hyper-V/WSL2 support |
| **RAM** | 16 GB minimum |
| **Disk** | 100 GB free (SSD recommended) |
| **Software** | Docker Desktop 4.37+ |
| **Network** | Internet access for initial image pull; LAN for student access |
| **Credentials** | GitHub account with access to the SmartGenEduX/prashnakosh package |

### Software Download

| Software | Download |
|----------|----------|
| Docker Desktop | https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe |

**Git is NOT required on the production server.** This deployment package is delivered separately.

---

## One-Time Server Setup

### Step 1 — Enable Virtualization

**BIOS** (reboot required):
1. Enter BIOS (F2/F10/Del during boot)
2. Enable Intel VT-x (or AMD-V)
3. Save and exit

**Windows Features** (PowerShell as Admin, reboot required):
```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```
Reboot the server.

### Step 2 — Install Docker Desktop

1. Run the Docker Desktop installer
2. Select "Use WSL 2 instead of Hyper-V" when prompted
3. Complete installation and reboot
4. After reboot, Docker Desktop starts automatically
5. Verify: open Command Prompt → `docker --version`

### Step 3 — Get a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new?scopes=read:packages
2. Set expiration (recommend: no expiration for server use)
3. Check only: `read:packages`
4. Generate and copy the token

---

## Installation

### Step 4 — Deploy the Package

Copy this entire `deploy` folder to the server. Recommended location: `C:\Prashnakosh`

The folder contains:
```
C:\Prashnakosh\
├── docker-compose.yml
├── .env.example
├── nginx\
│   └── nginx.conf
├── scripts\
│   ├── install.bat
│   ├── update.bat
│   ├── rollback.bat
│   ├── backup.bat
│   ├── restore.bat
│   ├── seed.bat
│   └── health.bat
└── DEPLOYMENT.md        (this file)
```

### Step 5 — Configure Environment

```cmd
cd C:\Prashnakosh
copy .env.example .env
notepad .env
```

Fill in all values:

| Variable | What to enter |
|----------|---------------|
| `GHCR_USER` | Your GitHub username |
| `GHCR_TOKEN` | The Personal Access Token from Step 3 |
| `IMAGE_TAG` | `latest` (or a specific version like `v1.0.0`) |
| `DB_PASSWORD` | A strong password (e.g., `Prashna$K0sh2026!Db`) |
| `SESSION_SECRET` | A 64-character random string (see below) |
| `DATA_DIR` | `E:\PrashnakoshData` (or another drive with space) |

Generate SESSION_SECRET in PowerShell:
```powershell
-join ((48..57)+(65..90)+(97..122)|Get-Random -Count 64|%{[char]$_})
```

### Step 6 — Run Installation

```cmd
scripts\install.bat
```

This will:
1. Validate Docker and `.env` configuration
2. Create all data directories on the specified drive
3. Generate a self-signed SSL certificate
4. Authenticate with GitHub Container Registry
5. Pull the Prashnakosh image, PostgreSQL, and Nginx
6. Start all three containers
7. Wait for health check

**Expected result**: "INSTALLATION COMPLETE" with healthy status.

### Step 7 — Verify

```cmd
scripts\health.bat
```

Then open in a browser: **https://localhost**

Accept the self-signed certificate warning (click Advanced → Proceed). This is expected for internal deployments.

---

## Daily Operations

| Task | Command |
|------|---------|
| Check health | `scripts\health.bat` |
| View logs | `docker compose logs -f` |
| View app logs only | `docker compose logs -f app` |
| Backup database | `scripts\backup.bat` |
| Restore database | `scripts\restore.bat` |
| Stop all services | `docker compose down` |
| Start all services | `docker compose up -d` |
| Restart app only | `docker compose restart app` |

---

## Updating Prashnakosh

When a new version is released:

```cmd
scripts\update.bat
```

This automatically:
1. Creates a pre-update backup
2. Records the current image for rollback
3. Pulls the latest image from GHCR
4. Restarts services
5. Verifies health

### Rolling Back

If an update causes issues:

```cmd
scripts\rollback.bat
```

### Pinning a Specific Version

Edit `.env` and change:
```
IMAGE_TAG=v1.2.0
```
Then: `docker compose up -d`

---

## Data Directory Layout

```
E:\PrashnakoshData\
├── postgres\data\     PostgreSQL database files
├── uploads\           Question images and documents (UUID-named)
├── exports\           Generated DOCX and PDF papers
├── backups\           Database dumps
│   ├── daily\         Auto-cleaned after 7 days
│   ├── weekly\
│   └── monthly\
└── logs\
    ├── app\           Application logs
    └── nginx\         Web server access/error logs
```

**Back up `E:\PrashnakoshData\` regularly.** This single directory contains all school data.

---

## Network Access

| From | URL |
|------|-----|
| Server itself | `https://localhost` |
| LAN devices | `https://<server-IP>` (find IP with `ipconfig`) |

Students and teachers connect to `https://192.168.x.x` from their devices.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Docker won't start | Enable VT-x in BIOS + WSL2 Windows features |
| "unauthorized" on pull | Check GHCR_USER and GHCR_TOKEN in `.env`, regenerate token if expired |
| Containers keep restarting | `docker compose logs -f` to see error details |
| Port 80 in use | Stop conflicting service, or change nginx ports in `docker-compose.yml` |
| DB connection errors | Wait 30s after first start; DB needs initialization time |
| Certificate warning | Expected with self-signed cert. Users click "Advanced → Proceed" once |
| Forgot admin password | Re-seed: `scripts\seed.bat` (recreates default Super Admin) |
