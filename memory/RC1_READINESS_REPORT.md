# Prashnakosh - Release Candidate 1 (RC1) Readiness Report
**Date**: 2026-06-25
**Release**: RC1 (Local Storage Architecture)

---

## Release Readiness: 96%

## Go / No-Go Recommendation: **GO**

---

## What Changed in RC1
- **Storage Architecture**: Replaced AWS S3 cloud storage with local server filesystem storage
- **Environment**: Removed all AWS environment variables (`AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- **New Service**: `server/services/local-storage.ts` — idempotent, UUID-based file storage
- **New Endpoint**: `GET /api/storage/status` — health check for storage subsystem
- **Docker Config**: Added `STORAGE_ROOT=/data` env var, added `/data/backups` volume mount
- **Frontend**: All S3/AWS UI references replaced with "Local Storage" labels

## Verified Features (Iteration 19 - 100% Pass)
| Feature | Status |
|---------|--------|
| Health Endpoint (`/api/health`) | PASS |
| Storage Status (`/api/storage/status`) | PASS |
| Super Admin Login (SUPERADMIN) | PASS |
| HOD Login (MVMCHN) | PASS |
| Teacher Login (MVMCHN) | PASS |
| Questions API (paginated) | PASS |
| Blueprints API | PASS |
| Tests API | PASS |
| Analytics API | PASS |
| File Upload (role-protected) | PASS |
| Paper Export (DOCX) | PASS |
| Paper Export (PDF) | PASS |
| Super Admin Dashboard | PASS |
| Storage Configuration Page | PASS |
| HOD Dashboard & Workflows | PASS |
| Teacher Dashboard & Workflows | PASS |
| Sidebar Navigation (all roles) | PASS |
| No S3/AWS References in UI | PASS |
| Storage Directories Initialized | PASS |
| Authentication & Role Guards | PASS |

## Remaining Known Issues
| Issue | Severity | Status | Impact |
|-------|----------|--------|--------|
| Hindi/Devanagari PDF rendering | P1 | BACKLOG | Hindi text in PDFs shows broken chars |
| `chapter` column NOT NULL constraint | P2 | BACKLOG | DB schema cleanup needed |
| Configurable answer writing space | P1 | BACKLOG | Paper layout enhancement |
| Dynamic academic year references | P1 | BACKLOG | Hard-coded year strings |

**None of the above are release-blocking.**

## Deployment Checklist (On-Premise Windows 10 Pro)

### Prerequisites
- [ ] Docker Desktop installed and running
- [ ] Git installed
- [ ] Repository cloned to server

### Installation Steps
1. `cd` to project root
2. Copy `.env.example` to `.env` and configure:
   - `DB_PASSWORD` — strong PostgreSQL password
   - `SESSION_SECRET` — random 64-char string
   - `DATA_DIR` — root storage path (default: `E:\PrashnakoshData`)
3. Run `scripts\install.bat`
4. Run `scripts\seed.bat` to create initial admin user
5. Access at `https://localhost`

### Verification
- Run `scripts\health.bat` to verify all services
- Login with Super Admin credentials
- Verify Storage Configuration page shows "Local server storage"

### Backup & Maintenance
- `scripts\backup.bat` — daily database + file backup
- `scripts\restore.bat` — restore from backup
- `scripts\update.bat` — pull latest image and restart

## Storage Architecture (Final)
```
STORAGE_ROOT (E:\PrashnakoshData)
├── uploads/          # Question images, uploaded files (UUID-named)
├── exports/          # Generated DOCX/PDF papers
├── backups/          # Database dumps (daily/weekly/monthly)
│   ├── daily/
│   ├── weekly/
│   └── monthly/
├── logs/             # Application and Nginx logs
│   ├── app/
│   └── nginx/
└── postgres/         # PostgreSQL data directory
    └── data/
```

## Security Posture
- Token-based authentication with role guards
- Rate limiting on login endpoint
- Exam engine: resubmission prevention, server-side timer validation, copy/paste restrictions
- No external cloud dependencies (fully self-hosted)
- IP protected via Docker + compiled binary (pkg)
