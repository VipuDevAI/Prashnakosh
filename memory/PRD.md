# Prashnakosh - Education Governance Platform

## Original Problem Statement
Build a comprehensive education governance application with question bank management, blueprint-driven exam paper generation, multi-school/tenant support with role-based access (Principal, HOD, Teacher, Student).

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Render

## What's Been Implemented

### Core Platform (Dec 2024)
- [x] Multi-tenant school management with role-based access
- [x] Question bank with bulk DOCX upload + manual entry
- [x] Blueprint creation with sections, marks, chapters
- [x] PDF/DOCX paper generation with school logo
- [x] HOD approval workflow → Principal review

### Architecture Standardization (Apr 2026 - P0)
- [x] **Duplicate Detection**: Exact hash blocking + fuzzy >85% warnings on ALL upload flows
- [x] **Unified Generation Engine**: Single `selectQuestionsUnified()` for online + offline
- [x] **Option Randomization**: Shuffled options per student attempt (online mode)
- [x] **Frontend Duplicate UX**: Inline warnings + modal for similar matches

### Multi-Set Generation (Apr 2026 - P0)
- [x] **Zero-overlap** question sets via fair partitioning algorithm
- [x] **Difficulty parity** across sets (proportional allocation per difficulty bucket)
- [x] **Marks consistency** (identical total marks per set)
- [x] **Failure handling**: Validation endpoint with remediation options (Reduce Sets / Allow Overlap)
- [x] **questionSets** stored in test record; PDF/DOCX/Answer Key use stored sets

### Set Comparison View (Apr 2026 - P0)
- [x] **Side-by-side table**: Total Qs, marks, difficulty %, chapter coverage, type distribution per set
- [x] **Deviation highlighting**: Green (balanced), Yellow (slight <30%), Red (significant >30%)
- [x] **Approval control**: "Approve Sets" button gates all downloads (403 until approved)
- [x] **Regenerate option**: Resets approval, preserves ability to re-roll sets
- [x] **Download gating**: paper-pdf, paper-docx, answer-key-pdf, answer-key-docx all check `setsApproved`
- [x] **Per-section breakdown**: Expandable details for each set

## Key API Endpoints
- `POST /api/tests/:id/validate-multiset` - Pre-generation pool validation
- `POST /api/tests/:id/generate-multiset` - Generate N non-overlapping sets
- `POST /api/tests/:id/approve-sets` - HOD approves sets for download/exam use
- `GET /api/tests/:id/paper-pdf?set=N` - Download PDF (requires approval)
- `GET /api/tests/:id/paper-docx?set=N` - Download DOCX (requires approval)
- `GET /api/tests/:id/answer-key-pdf?set=N` - Answer key (requires approval)
- `POST /api/questions/check-duplicate` - Single question duplicate check
- `POST /api/questions/check-duplicates-bulk` - Batch duplicate check

## Key Files
- `/app/server/lib/question-selection-engine.ts` - Unified engine + multi-set fair partitioning
- `/app/server/lib/duplicate-detection.ts` - Duplicate detection service
- `/app/server/routes.ts` - ALL API endpoints
- `/app/server/pg-storage.ts` - Database operations
- `/app/client/src/pages/hod/paper-generator.tsx` - Multi-set generation + Set Comparison View
- `/app/client/src/pages/teacher/manual-entry.tsx` - Manual entry with duplicate UX
- `/app/client/src/pages/teacher/word-upload.tsx` - DOCX upload with duplicate preview
- `/app/shared/schema.ts` - Database schema

## Prioritized Backlog

### P1 (High Priority) - NEXT
- [ ] Teacher bulk duplicate resolution UI (preview + edit before save)
- [ ] Auto-triage / confidence scoring for parsed questions
- [ ] Create remaining ~295 student accounts

### P2 (Medium Priority)
- [ ] Principal Analytics with materialized views
- [ ] AWS S3 actual persistence (currently mocked locally)
- [ ] Centralized logging (Winston/Sentry)
- [ ] Refactor routes.ts (6000+ lines) into modular route files
- [ ] Fix pre-existing TypeScript errors

## Credentials
- **Super Admin**: SUPERADMIN / superadmin@safal.com / SuperAdmin@123
- **Test HOD**: TESTSCH / hod@test.com / Hod@12345
- **Test Teacher**: TESTSCH / teacher@test.com / Teacher@123
