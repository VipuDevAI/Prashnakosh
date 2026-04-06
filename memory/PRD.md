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
- Multiple sets (Set 1, 2, 3) with shuffled questions
- School logo support
- Test name, marks, duration display
- Answer key generation

### 5. Architecture Standardization (P0)
- **Single unified question pool** - One pool, all modes
- **Duplicate Detection** - Exact match blocked, fuzzy >85% warned with UX
- **Unified Generation Engine** - `selectQuestionsUnified()` for both online and offline
- **Mode Behaviors:**
  - Online: Shuffle questions + options, timer/resume
  - Offline: Fixed order, section headers, PDF/Word export, answer key

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

### April 2026 - Architecture Standardization
- [x] **Duplicate Detection Service** (duplicate-detection.ts) - exact hash + n-gram + Jaccard similarity
- [x] **Unified Question Selection Engine** (question-selection-engine.ts) - single engine for online/offline
- [x] **contentHash field** added to questions schema
- [x] **Backend: Duplicate check on ALL upload paths:**
  - POST /api/teacher/questions (manual) - blocks exact dupes, warns on similar
  - POST /api/teacher/upload/word/preview - includes per-question duplicate status
  - POST /api/teacher/upload/word/confirm - auto-filters exact duplicates
  - POST /api/upload/word (direct) - filters exact duplicates
  - POST /api/questions/bulk - filters exact duplicates
- [x] **Backend: Unified Engine replaces ALL legacy selection:**
  - POST /api/tests/:id/generate-paper - uses offline mode unified engine
  - POST /api/tests/:id/select-by-blueprint - uses unified engine with mode param
  - startExam() - uses online mode unified engine with question + option shuffling
  - POST /api/blueprints/:id/generate-preview - uses unified engine
- [x] **Option Randomization** for online mode (shuffleOptions in engine + startExam)
- [x] **Frontend: Duplicate Detection UX:**
  - Manual Entry: inline warning below content field, modal for >85% similar
  - Word Upload: duplicate summary in preview, per-question status badges, exclude/include toggles
- [x] **API Endpoints for duplicate checking:**
  - POST /api/questions/check-duplicate (single)
  - POST /api/questions/check-duplicates-bulk (batch)
  - GET /api/questions/find-duplicates (admin cleanup)

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Duplicate Detection integrated into all upload flows
- [x] Unified Selection Engine replaces all legacy selection
- [x] Option Randomization for online mode
- [x] Frontend Duplicate UX

### P0 (Next)
- [ ] Multi-Set Generation (Set A/B/C) with no overlap + fair distribution
  - Engine already supports setCount parameter
  - Needs frontend UI and testing

### P1 (High Priority)
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
- `/app/server/lib/question-selection-engine.ts` - Unified selection engine
- `/app/server/routes.ts` - ALL API endpoints
- `/app/server/pg-storage.ts` - Database operations with unified engine
- `/app/client/src/pages/teacher/manual-entry.tsx` - Manual question entry with duplicate UX
- `/app/client/src/pages/teacher/word-upload.tsx` - DOCX upload with duplicate preview
- `/app/shared/schema.ts` - Database schema

## Credentials
- **Super Admin**: SUPERADMIN / superadmin@safal.com / SuperAdmin@123
- **Test Teacher**: TESTSCH / teacher@test.com / Teacher@123
