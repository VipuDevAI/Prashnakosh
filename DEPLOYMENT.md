# Prashnakosh — Final Installation Guide (RC1)
**Version**: 1.0 RC1  
**Target Environment**: Windows 10 Pro, HPE Server, 16 GB RAM  
**Date**: 2026-06-25

---

## 1. Software Required on the Windows Server

| # | Software | Version | Required? | Purpose |
|---|----------|---------|-----------|---------|
| 1 | **Docker Desktop** | 4.37+ (latest stable) | **MANDATORY** | Runs all services (App, PostgreSQL, Nginx) in containers |
| 2 | **Git for Windows** | 2.47+ (latest stable) | **MANDATORY** | Clones the repository to the server |

**Download Links:**
- Docker Desktop: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
- Git for Windows: https://github.com/git-for-windows/git/releases/latest (download the `64-bit.exe` installer)

### What you do NOT need to install

| Software | Why not needed |
|----------|---------------|
| Node.js | Runs inside the Docker container |
| npm / yarn | Runs inside the Docker container |
| PostgreSQL | Runs as a Docker container (`postgres:16-alpine`) |
| Nginx | Runs as a Docker container (`nginx:alpine`) |
| PM2 | Not used. Docker handles process management with `restart: always` |
| Python | Not required at any stage |
| Any cloud SDK | No AWS, Azure, or GCP dependencies exist |

**Confirmed: Only Docker Desktop and Git are installed on the host OS. Everything else runs inside Docker.**

---

## 2. Windows Features / Virtualization

### Does Docker Desktop handle WSL2 automatically?

**Partially.** Docker Desktop's installer will:
- Automatically install the WSL2 Linux kernel update
- Automatically set WSL2 as the default backend

**However, the following Windows features must be enabled BEFORE installing Docker Desktop:**

### Pre-requisite: Enable Virtualization

**Step A — Enable in BIOS (one-time, requires reboot):**
1. Restart the server → Enter BIOS/UEFI (usually `F2`, `F10`, or `Del` during boot)
2. Navigate to **Advanced** → **Processor Configuration** (or **CPU Configuration**)
3. Enable **Intel VT-x** (or **AMD-V** on AMD processors)
4. Save and exit BIOS

**Step B — Enable Windows Features (one-time, requires reboot):**

Open **PowerShell as Administrator** and run:
```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```
**Reboot the server after running these commands.**

After reboot, you can verify:
```powershell
wsl --status
```
This should show "Default Version: 2".

**Only after BIOS virtualization + Windows features are enabled, proceed to install Docker Desktop.**

---

## 3. Complete Installation Sequence

### Phase 1 — Install Software (one-time)

```
Step 1.1  Enable VT-x in BIOS (see Section 2, Step A)
Step 1.2  Enable WSL2 + Virtual Machine Platform (see Section 2, Step B)
Step 1.3  Reboot the server
Step 1.4  Install Git for Windows (accept all defaults during install)
Step 1.5  Install Docker Desktop (accept all defaults, select "Use WSL2")
Step 1.6  Reboot the server (Docker Desktop starts automatically after login)
Step 1.7  Verify Docker is running:
            Open Command Prompt → type: docker --version
            Expected output: Docker version 27.x.x (or similar)
```

### Phase 2 — Clone Repository & Configure

```
Step 2.1  Open Command Prompt as Administrator
Step 2.2  Navigate to the installation directory:
            cd C:\
Step 2.3  Clone the repository:
            git clone https://github.com/SmartGenEduX/prashnakosh.git
            cd prashnakosh
Step 2.4  Create environment file:
            copy .env.example .env
Step 2.5  Edit .env with Notepad:
            notepad .env
```

**Set these values in `.env`:**
```ini
DB_PASSWORD=<generate a strong password, e.g., Prashna$K0sh2026!Secure>
SESSION_SECRET=<generate a 64-character random string>
DATA_DIR=E:\PrashnakoshData
```

To generate a random SESSION_SECRET, run in PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Phase 3 — Run Installation

```
Step 3.1  From the project root (C:\prashnakosh), run:
            scripts\install.bat
```

**What `install.bat` does (automatically):**
1. Validates Docker is installed and running
2. Validates `.env` file exists
3. Creates all data directories at `E:\PrashnakoshData\`
4. Generates a self-signed SSL certificate (valid 10 years)
5. Builds the Prashnakosh Docker image locally (5-10 minutes on first run)
6. Pulls PostgreSQL 16 and Nginx Alpine images
7. Starts all three containers (app + db + nginx)
8. Waits for database to become healthy
9. Runs health check

**Expected output at the end:**
```
========================================
 INSTALLATION COMPLETE
========================================

 Application URL:  https://localhost
 Data Directory:   E:\PrashnakoshData
```

### Phase 4 — Verify Deployment

```
Step 4.1  Run the health check:
            scripts\health.bat

Step 4.2  Open a browser on the server:
            https://localhost

          (Accept the self-signed certificate warning — this is expected)

Step 4.3  Login with Super Admin credentials
          (Created automatically during first startup)

Step 4.4  Verify all services are running:
            docker compose -f docker-compose.prod.yml ps

          Expected: 3 containers running (prashnakosh-app, prashnakosh-db, prashnakosh-nginx)
```

---

## 4. Data Directory Structure (Created Automatically)

```
E:\PrashnakoshData\
├── postgres\data\     PostgreSQL database files
├── uploads\           Uploaded question images and documents
├── exports\           Generated DOCX and PDF papers
├── backups\           Database backup dumps
│   ├── daily\
│   ├── weekly\
│   └── monthly\
└── logs\              Application and web server logs
    ├── app\
    └── nginx\
```

**All school data lives in this single directory.** Back up `E:\PrashnakoshData\` to protect everything.

---

## 5. Available Management Scripts

All scripts are run from the project root (`C:\prashnakosh`):

| Script | Command | Purpose |
|--------|---------|---------|
| Health Check | `scripts\health.bat` | Shows container status, app health, DB status, resource usage |
| Backup | `scripts\backup.bat` | Creates PostgreSQL dump in `backups\daily\` (auto-deletes after 7 days) |
| Restore | `scripts\restore.bat` | Restores database from a `.dump` file (interactive, with confirmation) |
| Update | `scripts\update.bat` | Backs up → rebuilds image → restarts services → verifies health |
| Rollback | `scripts\rollback.bat` | Reverts to a previous Docker image version |

---

## 6. Network Access (for Student Devices)

After installation, the application is accessible at:
- **On the server itself**: `https://localhost`
- **From other devices on the school LAN**: `https://<server-IP-address>`

To find the server's IP address:
```cmd
ipconfig
```
Look for the IPv4 address under the active network adapter (e.g., `192.168.1.100`).

Students and teachers access: `https://192.168.1.100` from their devices.

**Note**: Browsers will show a certificate warning because of the self-signed certificate. This is normal for internal deployments. Users click "Advanced" → "Proceed" once.

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Docker is not installed" error | Install Docker Desktop and reboot |
| Docker Desktop won't start | Enable VT-x in BIOS + WSL2 Windows features (Section 2) |
| Containers keep restarting | Check logs: `docker compose -f docker-compose.prod.yml logs -f` |
| Database connection errors | Wait 30 seconds after startup, DB needs time to initialize |
| "Port 80 already in use" | Another service (SAFAL?) is using port 80. Stop it first, or change nginx port in docker-compose.prod.yml |
| Browser shows "connection refused" | Check if all 3 containers are running: `docker compose -f docker-compose.prod.yml ps` |
| SSL certificate expired | Delete `ssl\` folder and re-run `scripts\install.bat` |

---

## 8. Summary Checklist

- [ ] BIOS: VT-x / AMD-V enabled
- [ ] Windows Features: WSL2 + Virtual Machine Platform enabled
- [ ] Docker Desktop installed and running
- [ ] Git for Windows installed
- [ ] Repository cloned to `C:\prashnakosh`
- [ ] `.env` configured with DB_PASSWORD, SESSION_SECRET, DATA_DIR
- [ ] `scripts\install.bat` completed successfully
- [ ] `scripts\health.bat` shows all services healthy
- [ ] Browser access at `https://localhost` works
- [ ] Super Admin login successful
- [ ] Data directory created at `E:\PrashnakoshData`

**When all boxes are checked, the deployment is complete.**
