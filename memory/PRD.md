# Prashnakosh - Product Requirements Document

## Vision
Prashnakosh is a **Question Bank + Blueprint + Question Paper Generation + Online Mock Test** platform. NOT an ERP. NOT general exam software.

## Core Workflow
```
HOD → Creates Blueprint → Teachers Upload Questions → Question Bank → HOD Review & Approval → Generate Set A/B/C → Offline Paper OR Online Mock → Analytics
```

## School Model
One School = One Deployment. Multi-tenant layer (tenantId) retained for future-proofing but not exposed in UI.

---

## Architecture

### Tech Stack
- React + TypeScript + Vite (Frontend)
- Node.js + Express.js (Backend)
- PostgreSQL (Neon on prod, local in dev)
- Drizzle ORM
- Tailwind CSS + Shadcn/UI

### Key Files
- `/app/shared/schema.ts` - All DB schema + types
- `/app/server/routes.ts` - All API endpoints (~6000+ lines, needs splitting)
- `/app/server/pg-storage.ts` - Database operations
- `/app/server/storage.ts` - IStorage interface
- `/app/server/lib/question-selection-engine.ts` - Unified paper generation engine
- `/app/server/lib/duplicate-detection.ts` - Hash + fuzzy matching
- `/app/client/src/pages/admin/department-cms.tsx` - Department Management CMS

---

## What's Been Implemented

### Phase 1: Architecture Standardization ✅
- Unified Selection Engine (single `selectQuestionsForBlueprint` for both online/offline)
- Duplicate Detection (exact hash + fuzzy similarity with warning-only UX)
- Option Randomization for online mode
- Frontend Duplicate UX (modals with Use Existing / Edit / Upload Anyway)

### Phase 2: Multi-Set Generation ✅
- Zero-overlap Set A/B/C generation with difficulty/marks parity
- Set Comparison View for HOD
- Approval gating (only HOD-approved sets can be downloaded)

### Phase 3: Department Model ✅ (June 2026)
- **Department CMS** - Admin creates Classes, Subjects, auto-generates Departments
  - `school_classes` table (IX, X, XI, XII)
  - `school_subjects` table (Science, Mathematics, etc.)
  - `departments` table (auto from Class × Subject)
  - `user_departments` junction table
- **Department-based ownership** - `departmentId` added to questions, tests, blueprints
- **Configurable HOD role** - headRoleLabel field (HOD, Dept Coordinator, etc.)
- **chapter → lesson rename** throughout codebase
- **`contentFormat` field** added to questions (prep for HTML migration)
- **`rollNumber` field** added to users table
- **Batch management** - batches table, CRUD APIs, student assignment
- **DB indexes** on attempts table for performance

### Batch Logic (Partial)
- `batches` table created, CRUD API endpoints working
- `batchId` field on users
- startExam logic updated to check batch → set assignment
- Frontend batch manager page created at /hod/batches/:testId

---

## Pending Tasks (Priority Order)

### P1: Department-based Permissions (Filtering)
- All data queries (questions, tests, blueprints) must filter by departmentId
- HOD sees ONLY their assigned departments' data
- Teacher sees ONLY their departments' data

### P2: Word Parser Enhancement
- Detect SECTION A/B/C markers
- Detect LESSON: and TOPIC: markers
- Pass detected metadata into parsed questions
- Blueprint-driven upload flow (teacher uploads per section)

### P3: HTML Storage Migration
- Switch mammoth from extractRawText → convertToHtml
- New questions stored as HTML
- Display components render HTML safely

### P4: Lesson Weightage Engine
- Add lesson weightage to blueprints
- Selection engine respects lesson distribution
- Never randomly pick all questions from one lesson

### P5: Auto-Reapproval
- Editing an approved question auto-reverts to "pending_approval"

### P6: PDF Enhancements
- Embed images/tables in generated PDFs
- Better equation support via HTML content

### P7: Batch Logic Completion
- Full E2E batch → set → student test flow

## Backlog
- Refactor routes.ts into modular route files
- Principal Analytics materialized views
- AWS S3 actual persistence
- Centralized Winston/Sentry logging
- JWT authentication (currently in-memory tokens)
- Login audit trail
- Super Admin impersonation
