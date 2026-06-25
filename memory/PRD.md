# PRASHNAKOSH V1 - Product Requirements Document

## Problem Statement
Prashnakosh is a Question Bank + Blueprint + Mock Test platform operating under a strict Department Model for schools. V1 targets teacher workflow for quarterly paper generation.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (Neon DB) + Drizzle ORM
- **Auth**: Token-based with role-based session TTLs (no JWT)
- **UI Theme**: Dark cosmic gradient, Glassmorphism, AppShell (Sidebar + Topbar)

## Branding
- **Logo**: Shield shape with circuit-pattern "P" (Prashnakosh Jignyasa)
- **Text**: PRASHNAKOSH / JIGNYASA (no Sanskrit/Hindi)
- **Footer**: "Powered by SmartGenEduX © [year]"
- **Component**: `/app/client/src/components/BrandLogo.tsx`
- **Assets**: `/app/client/public/assets/logo/`

## All Completed Features
- [x] Multi-tenant school system with department isolation
- [x] Word document upload + parsing into question bank
- [x] Blueprint creation and management
- [x] Question approval workflow (Teacher -> HOD -> Principal)
- [x] Academic Coverage Dashboard
- [x] Multi-Set Paper Generation with lesson balancing
- [x] Mock Test E2E (start -> attempt -> submit -> auto-grade -> results)
- [x] Single Source of Truth: Mock Tests & Offline Papers share selectQuestionsUnified()
- [x] Premium Dark Cosmic UI (Glassmorphism, AppShell sidebar)
- [x] Token Expiry (Teacher/HOD 24h, Student 3h)
- [x] Blueprint Marks Decoupling (Type+Difficulty+Lesson selection, blueprint assigns marks)
- [x] Memory Bottleneck Fix (SQL-level filtering, pagination, COUNT/DISTINCT)
- [x] Rate Limiting + Connection Pool + Health Endpoint
- [x] Load Testing (1000 concurrent users verified)
- [x] **Branding V1 (June 19)**: Circular logo, BrandLogo.tsx, all pages updated
- [x] **Branding V2 (June 25)**: New shield logo, PRASHNAKOSH/JIGNYASA, no Sanskrit
- [x] **Login Page Redesign (June 25)**: Modern enterprise design, gold CTA, feature pills
- [x] **Question Editing (June 25)**: Full edit dialog (Section, Lesson, Topic, Subject, Content, Type, Difficulty, Marks, Options, Answer)
- [x] **Paper Export V2 (June 25)**: Section-grouped DOCX/PDF with marks distribution, instructions, answer space, proper formatting
- [x] **Year Fix (June 25)**: All hardcoded "2025" replaced with dynamic year

## Production Deployment (Planned)
- Target: HPE ProLiant ML110 Gen10, Xeon 4208, 16GB, Windows 10 Pro
- Architecture: Docker + compiled binary (IP protection)
- 3 containers: App, PostgreSQL 16, Nginx
- Phase 1: Class XII (12 departments, ~600 students)
- Phase 2: Class X expansion (before quarterly exam)

## Pending Issues
- **BLOCKED**: S3 image upload — code complete, missing AWS credentials
- **P2**: `chapter` column NOT NULL constraint cleanup

## Upcoming Tasks (Priority Order)
1. **UI/UX Polish** — Complete audit of all screens for consistency
2. **Production Deployment Package** — Dockerfile, docker-compose, GitHub Actions, scripts
3. **Exam Engine Hardening** — Resubmission prevention, server-side timer validation, copy/paste restrictions
4. **Hindi PDF Font** — Add Noto Sans Devanagari for PDF export
5. **Blueprint Versioning UI** — Activate/deactivate versions

## Post-Pilot
- Admin Maintenance (Soft Delete, Hard Wipe, Syllabus Migration, Archive)
- Image/Diagram handling (requires S3)
- Math formula rendering (LaTeX/KaTeX)
- HTML Storage Migration
- PDF Enhancements

## DO NOT
- Do NOT refactor routes.ts until after pilot
- Do NOT implement JWT migration
- Do NOT start admin maintenance features until post-pilot
