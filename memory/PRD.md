# Prashnakosh - Education Governance Platform

## Original Problem Statement
Build a comprehensive education governance application with:
- Super Admin dashboard to manage schools, users, and settings
- Question bank management with bulk upload from Word documents
- Blueprint-driven exam paper generation
- Multi-school/tenant support with role-based access (Principal, HOD, Teacher, Student)

## Core Requirements

### 1. User Management
- Multi-tenant architecture (schools as tenants)
- Roles: Super Admin, Principal, HOD, Teacher, Student
- School code-based login

### 2. Question Management  
- Bulk upload from .docx files
- Question types: MCQ, Short Answer, Long Answer, True/False, Fill-in-blank
- Blueprint-based paper generation
- **Duplicate Detection** (exact hash + fuzzy similarity >85%)

### 3. Exam Workflow
- Blueprint creation with sections, marks, chapters
- HOD approval workflow
- Principal review
- Paper generation with multiple sets

### 4. Paper Generation Features
- PDF and DOCX export
- **Multi-Set Generation (Set A/B/C)** with zero overlap, difficulty parity, equal marks
- School logo support
- Test name, marks, duration display
- Answer key generation per set

### 5. Architecture Standardization (P0 - COMPLETED)
- **Single unified question pool** - One pool, all modes
- **Duplicate Detection** - Exact match blocked, fuzzy >85% warned with UX
- **Unified Generation Engine** - `selectQuestionsUnified()` for both online and offline
- **Mode Behaviors:**
  - Online: Shuffle questions + options, timer/resume
  - Offline: Fixed order, section headers, PDF/Word export, answer key

### 6. Multi-Set Generation (P0 - COMPLETED)
- **Zero question overlap** across sets (non-negotiable)
- **Difficulty parity** across all sets (proportional allocation)
- **Chapter coverage consistency** across sets
- **Marks consistency** (identical total marks per set)
- **Failure handling**: Clear validation with remediation options (Reduce Sets, Allow Overlap)
- **Validation summary UI** before generating
- Uses unified engine for both online/offline multi-set

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Render

## What's Been Implemented

### December 2024
- [x] Full-stack React/Node.js application deployed on Render
- [x] PostgreSQL database with Drizzle ORM
- [x] Multi-tenant school management
- [x] User CRUD operations with role-based access
- [x] Question bank with 1,492+ questions uploaded
- [x] Blueprint creation with wing/exam/chapter selection
- [x] Test creation linked to blueprints
- [x] PDF/DOCX paper generation with multiple sets
- [x] School logo support in paper generation

### April 2026 - Architecture Standardization (P0)
- [x] Duplicate Detection Service (duplicate-detection.ts)
- [x] Unified Question Selection Engine (question-selection-engine.ts)
- [x] contentHash field added to questions schema
- [x] Backend: Duplicate check on ALL upload paths
- [x] Backend: Unified Engine replaces ALL legacy selection
- [x] Option Randomization for online mode
- [x] Frontend: Duplicate Detection UX (inline + modal)
- [x] API Endpoints for duplicate checking

### April 2026 - Multi-Set Generation (P0)
- [x] `questionSets` field added to tests schema (stores per-set question IDs)
- [x] `POST /api/tests/:id/validate-multiset` - Pre-generation pool validation
- [x] `POST /api/tests/:id/generate-multiset` - Fair multi-set generation engine
- [x] `selectMultiSetFair()` algorithm with difficulty-based partitioning
- [x] `calculateDifficultyTargets()` for proportional allocation
- [x] `validateBlueprintCapacity()` with remediation options
- [x] Paper PDF/DOCX/Answer Key endpoints updated to use stored `questionSets`
- [x] Frontend: `/hod/generate-paper` page with full multi-set UI
- [x] Frontend: Validation summary with section analysis table
- [x] Frontend: Remediation options (Reduce Sets, Allow Overlap)
- [x] Frontend: Per-set download (PDF, DOCX, Answer Key)
- [x] Frontend: Difficulty parity visualization across sets
- [x] All tests passed: 14/14 backend, 100% frontend

## Prioritized Backlog

### P0 (Critical) - ALL COMPLETED
- [x] Duplicate Detection integrated into all upload flows
- [x] Unified Selection Engine replaces all legacy selection
- [x] Option Randomization for online mode
- [x] Frontend Duplicate UX
- [x] Multi-Set Generation (Set A/B/C) with zero overlap + fair distribution

### P1 (High Priority) - NEXT
- [ ] Teacher bulk duplicate resolution UI (preview + edit before save)
- [ ] Auto-triage / confidence scoring for parsed questions
- [ ] Create remaining ~295 student accounts

### P2 (Medium Priority)
- [ ] Principal Analytics with materialized views
- [ ] AWS S3 actual persistence (currently mocked locally)
- [ ] Centralized logging (Winston/Sentry)
- [ ] Fix pre-existing TypeScript errors
- [ ] Refactor routes.ts (5500+ lines) into modular route files

## Key Files
- `/app/server/lib/duplicate-detection.ts` - Duplicate detection service
- `/app/server/lib/question-selection-engine.ts` - Unified selection engine + multi-set fair partitioning
- `/app/server/routes.ts` - ALL API endpoints
- `/app/server/pg-storage.ts` - Database operations with unified engine
- `/app/client/src/pages/teacher/manual-entry.tsx` - Manual question entry with duplicate UX
- `/app/client/src/pages/teacher/word-upload.tsx` - DOCX upload with duplicate preview
- `/app/client/src/pages/hod/paper-generator.tsx` - Multi-set generation UI
- `/app/client/src/pages/dashboard.tsx` - Main dashboard (HOD tab with Generate Paper)
- `/app/shared/schema.ts` - Database schema (includes questionSets)

## Key API Endpoints
- `POST /api/tests/:id/validate-multiset` - Validate pool capacity for N sets
- `POST /api/tests/:id/generate-multiset` - Generate N non-overlapping sets
- `GET /api/tests/:id/paper-pdf?set=N` - Download PDF for set N
- `GET /api/tests/:id/paper-docx?set=N` - Download DOCX for set N
- `GET /api/tests/:id/answer-key-pdf?set=N` - Download answer key for set N
- `POST /api/questions/check-duplicate` - Single question duplicate check
- `POST /api/questions/check-duplicates-bulk` - Batch duplicate check

## Credentials
- **Super Admin**: SUPERADMIN / superadmin@safal.com / SuperAdmin@123
- **Test HOD**: TESTSCH / hod@test.com / Hod@12345
- **Test Teacher**: TESTSCH / teacher@test.com / Teacher@123
