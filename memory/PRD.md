# Prashnakosh - Product Requirements Document
**Version**: RC1
**Last Updated**: 2026-07-07

## Product Overview
Prashnakosh is a Question Bank + Blueprint + Mock Test platform operating under a Department Model. Designed for school deployment (on-premise, self-hosted via Docker on Windows 10 Pro).

## Core Architecture
- **Frontend**: React + Vite + Shadcn/UI (dark cosmic theme)
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (Drizzle ORM)
- **Storage**: Local server filesystem (configurable via STORAGE_ROOT)
- **Deployment**: Docker image from GHCR (private registry pull, no source code on server)
- **CI/CD**: GitHub Actions builds and pushes to `ghcr.io/smartgenedux/prashnakosh`

## Completed Features
- [x] Premium UI/UX with Prashnakosh Jignyasa shield logo branding
- [x] Enterprise login page (schoolCode + email + password)
- [x] Multi-role authentication (Super Admin, Admin, HOD, Teacher, Exam Committee, Student)
- [x] Department-based isolation (Class + Subject)
- [x] Question bank management with full CRUD + post-upload editing
- [x] Blueprint creation and management
- [x] Mock test generation with exam engine
- [x] Section-wise grouped DOCX and PDF paper exports
- [x] Exam engine hardening (anti-cheating, server-side timer, resubmission prevention)
- [x] Local server storage architecture (replaced S3)
- [x] Docker production deployment (Dockerfile, docker-compose.yml, Nginx)
- [x] GHCR private registry deployment (no source code on server)
- [x] Windows management scripts (install, update, rollback, backup, restore, health, seed)
- [x] Storage status health endpoint
- [x] Configurable Super Admin credentials via .env
- [x] Drizzle ORM database migrations (auto-run on startup, idempotent)
- [x] Idempotent seed (creates Super Admin only on first boot)
- [x] GitHub Actions CI/CD for automated image builds
- [x] Question editing dialog
- [x] Coverage analytics

## Key Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/health | GET | System health check |
| /api/storage/status | GET | Storage subsystem health |
| /api/auth/login | POST | Authentication |
| /api/questions | GET | Question bank (paginated) |
| /api/questions/:id | PATCH | Edit question |
| /api/blueprints | GET/POST | Blueprint CRUD |
| /api/tests | GET/POST | Test management |
| /api/tests/:id/paper-docx | GET | Word export |
| /api/tests/:id/paper-pdf | GET | PDF export |
| /api/mock/submit | POST | Exam submission |
| /api/storage/upload | POST | File upload |

## Database Schema (Key Tables)
- departments, questions, blueprints, tests, attempts
- schoolStorageConfigs, fileMetadata, referenceMaterials

## Recent Fixes (2026-07-07)
- [x] Wing blocker fix: Settings link added to SuperAdmin sidebar
- [x] Admin user form enhanced with wing/subjects/grade selection
- [x] Auto-seed default wings (Primary, Middle, Secondary, Senior Secondary) on school creation
- [x] Seeded default wings for existing schools (MVMCHN, SCH001)

## Backlog (P1/P2 — NOT release-blocking)
- P1: Master Blueprint CMS (Centralized blueprint library for CBSE templates)
- P1: Configurable answer writing space in papers
- P1: Dynamic academic year references
- P1: Admin maintenance features (soft delete, hard wipe, archive)
- P2: Image/diagram support in parser
- P2: Math formula rendering
- P2: School logo in exported documents
- P2: `chapter` column NOT NULL constraint cleanup
