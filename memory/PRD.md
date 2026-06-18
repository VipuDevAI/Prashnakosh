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
- [x] Design System Components (PageTitle, StatusBadge, DataTable, EmptyState, ConfirmDialog, TabBar)
- [x] Global Shadcn component overrides (Card, Tabs, Dialog, Select) for dark theme
- [x] Blueprint Marks Decoupling (selection by Type+Difficulty+Lesson, blueprint assigns marks)
- [x] Memory Bottleneck Fix (SQL-level filtering, pagination, COUNT/DISTINCT aggregation)

## Architecture Decisions

### Marks Decoupling (June 2026)
- `questions.marks` = metadata only (teacher's original marks)
- Selection engine matches by questionType + difficulty + lesson (NOT marks)
- `questionMarksMap` stored in test.questionSets JSONB
- Question Bank survives any blueprint mark scheme change

### Memory Bottleneck Fix (June 2026)
**Before**: `getQuestionsByTenant()` loaded ALL questions into Node.js memory (OOM risk at 5000+)
**After**: Every hot path uses department-scoped queries or SQL aggregation:
- `getAnalytics()` → SQL `COUNT(*)`
- `getSubjectsByTenant()` → SQL `GROUP BY`
- `/api/questions` → `getQuestionsByDepartment()` or `getQuestionsPaginated()` with LIMIT/OFFSET
- `/api/teacher/questions` → `getQuestionsByCreator()` (SQL WHERE createdBy)
- All duplicate checks → department-scoped
- `getLessonQuestionStats()` → department-scoped
- `selectQuestionsUnified()` → already department-scoped (fixed in prior iteration)
- 2 legacy fallbacks remain (for blueprints/tests without departmentId) — acceptable

## Pending Issues
- **P0 BLOCKED**: S3 image upload — code complete, missing AWS credentials
- **P2**: `chapter` column NOT NULL constraint — needs proper Drizzle migration

## Upcoming Tasks (Priority Order)
1. **Blueprint Versioning UI** (P1) — Support multiple blueprint versions per department with explicit activation
2. **Design System Deep Application** — Apply dark cosmic theme consistently to ALL remaining pages
3. **Admin Maintenance** (Post-pilot) — Archive, Soft Delete, Hard Wipe, Syllabus Migration
4. **HTML Storage Migration** (Post-pilot)
5. **PDF Enhancements** (Post-pilot)

## Key API Endpoints
- POST /api/auth/login → { user, token, expiresAt }
- GET /api/questions?departmentId=X → array (department-scoped)
- GET /api/questions?page=1&limit=50 → { questions, pagination } (admin paginated)
- GET /api/teacher/questions → SQL-filtered by createdBy
- GET /api/analytics → SQL COUNT for totals
- GET /api/departments/:id/academic-coverage
- POST /api/tests/:id/generate-multiset → stores questionMarksMap
- POST /api/tests/:id/validate-multiset
- POST /api/mock/start
- POST /api/exam/submit

## DO NOT
- Do NOT refactor routes.ts until after pilot
- Do NOT implement JWT migration
- Do NOT start admin maintenance features until post-pilot
- Do NOT write new S3 code
- Do NOT auto-deactivate old blueprint versions
