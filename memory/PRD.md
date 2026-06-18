# PRASHNAKOSH V1 - Product Requirements Document

## Problem Statement
Prashnakosh is a Question Bank + Blueprint + Mock Test platform operating under a strict Department Model for schools. The system supports the full academic workflow: Upload → Blueprint → Approval → Coverage → Set Generation → Mock Test → Auto Grading.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (Neon DB) + Drizzle ORM
- **Auth**: Token-based with role-based session TTLs (no JWT)
- **UI Theme**: Dark cosmic gradient, Glassmorphism, AppShell (Sidebar + Topbar)

## Core Features (COMPLETED)
- [x] Multi-tenant school system with department isolation
- [x] Word document upload + parsing into question bank
- [x] Blueprint creation and management
- [x] Question approval workflow (Teacher → HOD → Principal)
- [x] Academic Coverage Dashboard
- [x] Multi-Set Paper Generation with lesson balancing
- [x] Mock Test E2E (start → attempt → submit → auto-grade → results)
- [x] Single Source of Truth: Mock Tests & Offline Papers share selectQuestionsUnified()
- [x] Premium Dark Cosmic UI (Glassmorphism, AppShell sidebar navigation)
- [x] Token Expiry / Session Timeout (Teacher/HOD/Admin: 24h, Student: 3h)
- [x] Design System Components (PageTitle, StatusBadge, DataTable, EmptyState, ConfirmDialog, TabBar, SearchInput)
- [x] Global Shadcn component overrides (Card, Tabs, Dialog, Select) for dark theme consistency
- [x] **Blueprint Marks Decoupling** — Selection engine matches by Type+Difficulty+Lesson only. Blueprint assigns marks at paper generation time. questionMarksMap stored in test.questionSets. Mock test grading + PDF/Word export all use blueprint marks.

## Architecture Decision: Marks Decoupling (2024-06-18)
- `questions.marks` is now **metadata only** (teacher's original/suggested marks)
- Selection engine removed `q.marks !== section.marks` filter from 3 locations
- Blueprint's `section.marks` is ASSIGNED to each selected question
- `questionMarksMap` (Record<questionId, blueprintMarks>) stored in test.questionSets JSONB
- Mock test grading reads from questionMarksMap → blueprint marks
- PDF/Word export uses `applyBlueprintMarks()` helper
- **Result**: Question Bank survives any blueprint version change (2026, 2027, 2028...)

## Pending Issues
- **P0 BLOCKED**: S3 image upload — code complete, missing AWS_S3_BUCKET, AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- **P1**: Memory bottleneck in getQuestionsByTenant() — SAFE for pilot (<2000 questions), HIGH RISK at scale (5000+)
- **P2**: `chapter` column NOT NULL constraint — needs proper Drizzle migration

## Upcoming Tasks (Priority Order)
1. **Blueprint Versioning UI** (P1) — Support multiple blueprint versions per department. New version does NOT auto-deactivate old. Historical papers stay linked to historical blueprints. Backend marks decoupling is DONE.
2. **Memory Bottleneck Fix** — Add departmentId parameter to getQuestionsByTenant callers, add pagination to /api/questions route
3. **Design System Application** — Apply dark cosmic design system consistently to remaining pages (Questions, Reports, Settings)
4. **Admin Maintenance** (Post-pilot) — Archive, Soft Delete, Hard Wipe, Syllabus Migration (single tabbed "Admin Maintenance" page)
5. **HTML Storage Migration** (Post-pilot)
6. **PDF Enhancements** (Post-pilot)

## Key API Endpoints
- POST /api/auth/login → returns { user, token, expiresAt }
- GET /api/departments/:id/academic-coverage
- POST /api/tests/generate
- POST /api/tests/:id/generate-multiset → stores questionMarksMap
- POST /api/tests/:id/select-by-blueprint
- POST /api/tests/:id/validate-multiset
- POST /api/mock/start
- POST /api/exam/submit
- GET /api/blueprints

## Key Files
- /app/server/middleware/auth.ts — Token expiry middleware
- /app/server/lib/session-config.ts — Role-based TTL constants
- /app/server/lib/question-selection-engine.ts — Paper generation logic (marks decoupled)
- /app/server/routes.ts — applyBlueprintMarks() helper for PDF/Word export
- /app/server/pg-storage.ts — submitExam uses questionMarksMap, startMockExam overrides marks
- /app/client/src/components/design-system.tsx — Reusable UI components
- /app/client/src/index.css — Global dark cosmic CSS
- /app/client/src/components/app-shell.tsx — Sidebar layout

## DO NOT (Explicit Instructions)
- Do NOT refactor routes.ts until after pilot
- Do NOT implement JWT migration
- Do NOT start admin maintenance features (Soft Delete, Hard Wipe, Syllabus Migration) until post-pilot
- Do NOT write new S3 code — existing implementation is complete
- Do NOT auto-deactivate old blueprint versions when creating new ones
