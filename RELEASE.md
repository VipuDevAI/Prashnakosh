# PRASHNAKOSH — RELEASE v1.0.0

---

## Product Information

| Field | Value |
|-------|-------|
| **Product** | Prashnakosh (प्रश्नकोश) — Jignyasa |
| **Version** | 1.0.0 |
| **Release Date** | 25 June 2026 |
| **Release Type** | General Availability (GA) |
| **Developed By** | SmartGenEduX |
| **Deployment Model** | On-premise, self-hosted via Docker |
| **License** | Proprietary — no source code on production server |

---

## 1. System Requirements

### Server Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 50 GB SSD | 200 GB SSD |
| Network | 100 Mbps LAN | Gigabit LAN |

### Server Software

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Operating System** | Windows 10 Pro (64-bit) | Hyper-V / WSL2 capable |
| **Docker Desktop** | 4.37 or later | Only software installed on the host |

### Client Devices (Students / Teachers)

| Requirement | Details |
|-------------|---------|
| Browser | Chrome 90+, Firefox 90+, Edge 90+, Safari 15+ |
| Network | Connected to the same LAN as the server |
| Resolution | 1024x768 minimum, 1920x1080 recommended |

### What is NOT required on the server

Node.js, npm, yarn, PostgreSQL, Nginx, PM2, Python, Git, or any application runtime.
Everything runs inside Docker containers.

---

## 2. Installation Prerequisites

Complete these steps **before** running the installer.

### 2.1 Enable Hardware Virtualization (BIOS)

1. Restart the server
2. Enter BIOS/UEFI setup (F2, F10, or Del during boot — varies by manufacturer)
3. Navigate to: **Advanced → Processor Configuration**
4. Enable **Intel VT-x** (Intel) or **AMD-V** (AMD)
5. Save and exit BIOS

### 2.2 Enable Windows Features

Open **PowerShell as Administrator** and run:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

**Reboot the server.**

### 2.3 Install Docker Desktop

1. Download: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
2. Run the installer → select **"Use WSL 2 instead of Hyper-V"**
3. Complete installation → reboot
4. After reboot, Docker Desktop starts automatically
5. Open Command Prompt and verify:
   ```cmd
   docker --version
   docker compose version
   ```

### 2.4 Obtain a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new?scopes=read:packages
2. Token name: `prashnakosh-server`
3. Expiration: No expiration (recommended for server use)
4. Scope: check only **read:packages**
5. Click "Generate token" and copy the value immediately

### 2.5 Receive the Deployment Package

Obtain the `deploy` folder from SmartGenEduX. It contains:

```
deploy/
├── docker-compose.yml      Docker service definitions
├── .env.example             Configuration template
├── DEPLOYMENT.md            Detailed deployment guide
├── nginx/
│   └── nginx.conf           Reverse proxy configuration
└── scripts/
    ├── install.bat           First-time installation
    ├── update.bat            Pull latest version
    ├── rollback.bat          Revert to previous version
    ├── backup.bat            Database backup
    ├── restore.bat           Database restore
    ├── seed.bat              Re-seed database
    └── health.bat            System health check
```

**This package contains no application source code.**

---

## 3. Deployment Steps

### Step 1 — Place the deployment package

Copy the `deploy` folder to the server:

```
C:\Prashnakosh\
```

### Step 2 — Create the environment file

```cmd
cd C:\Prashnakosh
copy .env.example .env
notepad .env
```

Fill in every value:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GHCR_USER` | Yes | GitHub username with package access | `smartgenedux-admin` |
| `GHCR_TOKEN` | Yes | Personal Access Token (read:packages) | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `IMAGE_TAG` | No | Docker image version (default: `latest`) | `latest` |
| `DB_PASSWORD` | Yes | PostgreSQL password (choose a strong one) | `Prashna$K0sh2026!Db` |
| `SESSION_SECRET` | Yes | 64-character random string (see below) | *(auto-generated)* |
| `DATA_DIR` | No | Root path for all persistent data (default: `E:\PrashnakoshData`) | `E:\PrashnakoshData` |
| `SUPER_ADMIN_SCHOOL_CODE` | No | School code for Super Admin login (default: `SUPERADMIN`) | `SUPERADMIN` |
| `SUPER_ADMIN_SCHOOL_NAME` | No | Display name for Super Admin tenant (default: `Prashnakosh Central`) | `Prashnakosh Central` |
| `SUPER_ADMIN_EMAIL` | Yes | Email for the Super Admin account | `admin@school.edu` |
| `SUPER_ADMIN_PASSWORD` | Yes | Password for the Super Admin account | *(choose a strong password)* |
| `SUPER_ADMIN_NAME` | No | Display name for Super Admin user (default: `Super Admin`) | `Super Admin` |

Generate `SESSION_SECRET` in PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Step 3 — Run the installer

```cmd
scripts\install.bat
```

The installer will:

| Step | Action | Duration |
|------|--------|----------|
| 1 | Validate Docker and .env | Instant |
| 2 | Create data directories at DATA_DIR | Instant |
| 3 | Generate self-signed SSL certificate | ~5 seconds |
| 4 | Authenticate with GitHub Container Registry | ~2 seconds |
| 5 | Pull Docker images (app + PostgreSQL + Nginx) | 5–10 minutes |
| 6 | Start all containers and verify health | ~30 seconds |

### Step 4 — Verify installation

```cmd
scripts\health.bat
```

Expected output: three containers running, application healthy, database ready.

---

## 4. Default Credentials

The Super Admin account is created automatically on first startup using the values from `.env`. The account is **only created once** — subsequent restarts will never overwrite or recreate it.

| Field | Source |
|-------|--------|
| **School Code** | `SUPER_ADMIN_SCHOOL_CODE` in `.env` (default: `SUPERADMIN`) |
| **Email** | `SUPER_ADMIN_EMAIL` in `.env` (required — no default) |
| **Password** | `SUPER_ADMIN_PASSWORD` in `.env` (required — no default) |
| **Display Name** | `SUPER_ADMIN_NAME` in `.env` (default: `Super Admin`) |

> **There are no hardcoded credentials in the application.** Every deployment configures its own Super Admin through `.env` before first startup.

---

## 5. First Login Checklist

Perform these steps immediately after installation:

| # | Action | Where |
|---|--------|-------|
| 1 | Open `https://localhost` in a browser | Server |
| 2 | Accept the self-signed certificate warning (Advanced → Proceed) | Browser |
| 3 | Login with the School Code, Email, and Password you configured in `.env` | Login page |
| 4 | Verify the Super Admin dashboard loads | Dashboard |
| 5 | Navigate to **Schools** → Create a school (e.g., name: "Maharishi Vidya Mandir", code: "MVMCHN") | Schools page |
| 6 | Navigate to **Users** → Create an Admin user for the school | Users page |
| 7 | Navigate to **Storage** → Configure the storage path for the school | Storage page |
| 8 | Logout → Login as the school Admin → Create departments, teachers, HODs | School Admin dashboard |
| 9 | As a Teacher: Upload a question bank (DOCX) → Verify questions appear | Questions page |
| 10 | As an HOD: Create a blueprint → Generate a test paper → Download DOCX/PDF | Blueprints / Paper Gen |
| 11 | Access `https://<server-IP>` from a student device on the LAN | Any LAN device |
| 12 | Set up a daily backup schedule (Windows Task Scheduler → `scripts\backup.bat`) | Server |

Find the server IP:
```cmd
ipconfig
```
Look for the IPv4 address (e.g., `192.168.1.100`). Students access `https://192.168.1.100`.

---

## 6. Backup Procedure

### Manual Backup

```cmd
cd C:\Prashnakosh
scripts\backup.bat
```

Creates a timestamped PostgreSQL dump at:
```
E:\PrashnakoshData\backups\daily\prashnakosh_YYYYMMDD_HHMM.dump
```

Backups older than 7 days are automatically deleted.

### Scheduled Backup (Recommended)

Open **Windows Task Scheduler** and create a task:

| Setting | Value |
|---------|-------|
| Name | Prashnakosh Daily Backup |
| Trigger | Daily at 02:00 AM |
| Action | Start a program |
| Program | `C:\Prashnakosh\scripts\backup.bat` |
| Start in | `C:\Prashnakosh` |
| Run whether user is logged on or not | Yes |

### Full Data Backup

For a complete backup (database + files + exports), copy the entire data directory:
```
xcopy /E /I "E:\PrashnakoshData" "F:\Backups\PrashnakoshData_%date%"
```

---

## 7. Update Procedure

When SmartGenEduX releases a new version:

```cmd
cd C:\Prashnakosh
scripts\update.bat
```

This script:
1. Creates a pre-update database backup
2. Records the current image ID (for rollback)
3. Pulls the latest image from GHCR
4. Restarts services with the new version
5. Verifies application health

### Pinning a Specific Version

To run a specific version instead of `latest`, edit `.env`:
```
IMAGE_TAG=v1.1.0
```
Then:
```cmd
docker compose up -d
```

---

## 8. Rollback Procedure

If an update causes issues:

```cmd
cd C:\Prashnakosh
scripts\rollback.bat
```

This reverts to the image that was running before the last `update.bat` execution.

### Manual Version Rollback

Edit `.env`:
```
IMAGE_TAG=v1.0.0
```
Then:
```cmd
docker compose up -d
```

### Database Rollback

```cmd
scripts\restore.bat
```
Follow the interactive prompts to select a backup file.

---

## 9. Troubleshooting Guide

### Container Issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Docker won't start | BIOS virtualization disabled | Enable VT-x/AMD-V in BIOS, reboot |
| Docker won't start | WSL2 not enabled | Run the PowerShell dism commands from Section 2.2 |
| "unauthorized" during pull | GHCR token expired or incorrect | Regenerate token, update `GHCR_TOKEN` in `.env`, re-run install |
| Containers keep restarting | Application crash | `docker compose logs -f app` to view error |
| Database not starting | Corrupt data directory | Stop all, delete `E:\PrashnakoshData\postgres\data`, restart (data loss — restore from backup) |

### Network Issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Can't access from LAN | Firewall blocking ports | Open ports 80 and 443 in Windows Firewall |
| "Connection refused" | Containers not running | `docker compose ps` → `docker compose up -d` |
| Port 80 already in use | Another service on port 80 | Stop the conflicting service, or change nginx ports in `docker-compose.yml` |

### Application Issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Login fails | Wrong credentials | Use School Code + Email + Password (all three required) |
| Blank page after login | Frontend not loaded | `docker compose restart app`, wait 15 seconds |
| PDF export shows broken characters | Hindi/Devanagari text | Known limitation — see Section 11 |
| "Storage not configured" | Storage init failed | Check `DATA_DIR` in `.env`, restart app |
| Slow performance | Insufficient resources | Check `docker stats`, verify 16 GB RAM available |

### Log Locations

| Log | Command |
|-----|---------|
| All services | `docker compose logs -f` |
| App only | `docker compose logs -f app` |
| Database only | `docker compose logs -f db` |
| Nginx only | `docker compose logs -f nginx` |
| Nginx access log | `E:\PrashnakoshData\logs\nginx\access.log` |
| App log files | `E:\PrashnakoshData\logs\app\` |

---

## 10. Known Limitations (v1.0.0)

| # | Limitation | Severity | Workaround |
|---|-----------|----------|------------|
| 1 | Hindi/Devanagari text renders as broken characters in PDF exports | Medium | Use DOCX export for Hindi content; PDF works for English |
| 2 | Academic year references are hard-coded (2025–2026) | Low | Will be dynamic in a future release |
| 3 | Answer writing space in generated papers is not configurable | Low | Fixed spacing applied; configurable spacing planned |
| 4 | Image and diagram support in question parser is not implemented | Low | Upload images separately; text-only parsing for DOCX uploads |
| 5 | Mathematical formula rendering (LaTeX) is not supported | Low | Enter formulas as plain text |
| 6 | School logo cannot be embedded in exported papers | Low | Planned for future release |
| 7 | Blueprint versioning is not available | Low | Creating a new blueprint overwrites the previous one |
| 8 | Self-signed SSL certificate shows browser warning | Expected | Users click "Advanced → Proceed" once per browser |
| 9 | `chapter` column in the database has a legacy NOT NULL constraint | Internal | No user impact; cleanup scheduled |

---

## 11. Release Notes

### Features

**Authentication & Multi-Tenancy**
- Multi-tenant architecture with school-level data isolation
- Six user roles: Super Admin, Admin, HOD, Teacher, Exam Committee, Student
- School Code + Email + Password three-factor login
- Token-based session management with role-specific TTLs
- Rate-limited login endpoint (10 requests/minute per IP)

**Question Bank Management**
- Bulk question upload via DOCX file (Mammoth parser)
- Section-based categorization (A, B, C, D, E)
- Post-upload question editing (full CRUD)
- Duplicate detection via content hashing
- Pagination with server-side filtering

**Blueprint System**
- Blueprint creation with section-wise marks allocation
- Configurable question type distribution per section
- Blueprint-to-test paper generation engine
- Decoupled marks logic with repetition prevention

**Test Paper Generation**
- Section-wise grouped paper output
- DOCX export with formatted headers, marks distribution, and section breaks
- PDF export with structured layout
- Question shuffling with deterministic seeding

**Exam Engine**
- Online mock test delivery
- Server-side timer validation
- Resubmission prevention (one attempt per student per test)
- Copy/paste restrictions during exam
- Auto-submit on timer expiry

**Administration**
- School management (create, edit, deactivate)
- Department management (Class × Subject)
- User management with role assignment
- Storage configuration per school
- Coverage analytics dashboard

**Storage**
- Local server filesystem storage (no cloud dependencies)
- UUID-based file naming with database metadata mapping
- Configurable root path via `STORAGE_ROOT` environment variable
- Automatic directory initialization on first startup
- Subdirectories: uploads, exports, backups, logs

**Deployment**
- Docker-based containerized deployment (3 services: App, PostgreSQL, Nginx)
- Private registry (GHCR) image distribution — no source code on server
- GitHub Actions CI/CD pipeline for automated builds
- Version pinning via `IMAGE_TAG` environment variable
- Windows batch scripts for install, update, rollback, backup, restore, health check
- Nginx reverse proxy with SSL termination, rate limiting, and security headers
- PostgreSQL 16 with tuned production configuration

**UI/UX**
- Dark cosmic premium theme with glassmorphism effects
- Prashnakosh Jignyasa shield logo branding
- Responsive layout (desktop-first, mobile-aware)
- Shadcn/UI component library
- AppShell navigation with role-based sidebar

### Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Shadcn/UI, TailwindCSS |
| Backend | Node.js 20, Express.js, TypeScript |
| Database | PostgreSQL 16 (Drizzle ORM) |
| Reverse Proxy | Nginx Alpine |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions → GHCR |
| Storage | Local filesystem (UUID-mapped) |

### API Surface

246 route handlers across authentication, questions, blueprints, tests, exams, analytics, storage, and administration.

---

## 12. Production Acceptance Checklist

Complete every item before declaring the deployment production-ready.

### Infrastructure

- [ ] Server meets minimum hardware requirements (4 cores, 8 GB RAM, 50 GB SSD)
- [ ] BIOS virtualization (VT-x / AMD-V) is enabled
- [ ] WSL2 and Virtual Machine Platform Windows features are enabled
- [ ] Docker Desktop is installed, running, and verified (`docker --version`)
- [ ] Server has a static IP address on the school LAN
- [ ] Ports 80 and 443 are open in Windows Firewall

### Deployment

- [ ] `.env` file is configured with all required values
- [ ] `GHCR_USER` and `GHCR_TOKEN` are valid and can pull images
- [ ] `DB_PASSWORD` is a strong, unique password (not the example value)
- [ ] `SESSION_SECRET` is a randomly generated 64-character string
- [ ] `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` are set
- [ ] `DATA_DIR` points to a drive with adequate free space
- [ ] `scripts\install.bat` completed without errors
- [ ] All three containers are running (`docker compose ps`)
- [ ] `scripts\health.bat` reports healthy status

### Application

- [ ] `https://localhost` loads the login page
- [ ] Super Admin login succeeds with default credentials
- [ ] At least one school has been created
- [ ] At least one Admin user has been created for the school
- [ ] At least one department (Class + Subject) has been created
- [ ] At least one Teacher and one HOD have been created
- [ ] Question bank upload (DOCX) works and questions appear in the bank
- [ ] Blueprint creation works
- [ ] Test paper generation produces a valid paper
- [ ] DOCX export downloads successfully
- [ ] PDF export downloads successfully
- [ ] Student login works and can access assigned mock tests

### Security

- [ ] Super Admin credentials in `.env` use a strong, unique password
- [ ] SSL certificate is in place (self-signed or CA-signed)
- [ ] Server is not exposed to the public internet (LAN-only access)
- [ ] `.env` file permissions are restricted to the administrator account

### Operational Readiness

- [ ] `scripts\backup.bat` runs successfully and creates a .dump file
- [ ] Backup schedule is configured in Windows Task Scheduler
- [ ] `scripts\restore.bat` has been tested with a backup file
- [ ] `scripts\update.bat` process has been reviewed
- [ ] `scripts\rollback.bat` process has been reviewed
- [ ] LAN access verified from at least one student/teacher device
- [ ] IT administrator knows how to view logs (`docker compose logs -f`)
- [ ] IT administrator knows how to restart services (`docker compose restart`)
- [ ] Emergency contact for SmartGenEduX support is documented

---

**Document Version**: 1.0  
**Classification**: Internal — School IT Administration  
**Prepared By**: SmartGenEduX Engineering  
**Approved By**: ___________________________  
**Date**: ___________________________
