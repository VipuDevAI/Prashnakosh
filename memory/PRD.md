# PRASHNAKOSH V1 - Product Requirements Document

## Original Problem Statement
Build a Question Bank + Blueprint + Question Paper Generation + Online Mock Test platform for schools. Department-driven (Class + Subject), Blueprint-controlled upload flow.

## Tech Stack
React + TypeScript + Vite + Shadcn/UI | Node.js + Express + Drizzle ORM | PostgreSQL (Neon) | Simple token auth

## What's Been Implemented

### Phase 1: Foundation (DONE)
- Multi-tenant architecture, role-based access, CSV onboarding, batch logic

### Phase 2: Department CMS (DONE)
- Schema: schoolClasses, schoolSubjects, departments, userDepartments
- Admin UI for department generation (Class x Subject matrix)

### Phase 3: Department Permissions & Context Selector (DONE)
- Backend: validateDepartmentAccess(), API filtering by departmentId, 403 security
- Frontend: DepartmentProvider, DepartmentSelector dropdown, all pages scoped

### Phase 4: Word Parser Enhancement (DONE)
- Parser detects SECTION A/B/C, LESSON: <name>, TOPIC: <name> from plain text
- Context switching, validation warnings, passage support, Unicode/Sanskrit support

### Phase 5: Blueprint-Driven Upload (DONE)
- Teacher selects blueprint → sees only its sections
- Coverage API, Section Lock Validation, Schema update: section column

### Phase 6: Academic Coverage Dashboard (DONE - June 18, 2026)
- Unified Dashboard at /hod/academic-coverage: 4-level hierarchy
- Backend API GET /api/departments/:id/academic-coverage
- Schema: BlueprintSection.lessonWeightage field for future engine
- Tested: 30/30 (iteration_10.json)

### Phase 7: Blocker Resolution (DONE - June 18, 2026)
- **BLOCKER 1 FIXED**: Paper generation now filters by departmentId (zero cross-department leakage)
- **BLOCKER 4 FIXED**: Lesson balancing via round-robin spread + interleaving
- **BLOCKER 5 FIXED**: submitExam correctly sets status='submitted' for tests with manual grading
- **E2E TEST PASSED**: All 12 steps verified (Department → Blueprint → Upload → Approve → Coverage → Generate → Mock → Student → Submit → Results)
- **S3 AUDITED**: Code complete, only environment variables missing
- Tested: 90% backend (19/21), 100% frontend (iteration_11.json)

## Prioritized Backlog

### P0 (Pilot Readiness)
- [x] Fix departmentId filter in paper generation (DONE)
- [x] Lesson balancing (DONE)  
- [x] Full E2E test (DONE)
- [ ] S3 Configuration: Provide AWS_S3_BUCKET, AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

### P1 (Post-Pilot)
- [ ] HTML Storage Migration: mammoth.convertToHtml()
- [ ] Lesson Weightage Engine UI: HOD defines per-lesson question targets
- [ ] Session timeout (token expiry)

### P2
- [ ] Auto-Reapproval: Editing approved question reverts to pending_approval
- [ ] PDF Enhancements
- [ ] Performance optimization for 5K+ questions

## Key API Endpoints
- `GET /api/departments/:id/academic-coverage` - Full hierarchical coverage dashboard
- `POST /api/blueprints/:id/generate-preview` - Paper generation (now with departmentId filter)
- `POST /api/tests/generate` - Create mock test from blueprint
- `POST /api/exam/start` - Student starts exam (returns attempt + questions)
- `POST /api/exam/submit` - Student submits (auto-grades MCQs, marks status='submitted')
- `GET /api/student/results` - Student results (requires HOD reveal)
- `POST /api/tests/:id/reveal-results` - HOD reveals results to students

## Database Schema (Key Tables)
- departments, userDepartments, questions, blueprints, tests, attempts

## Pilot Readiness: 78/100 (CONDITIONAL GO)
- Text-only pilot: READY
- Image-based pilot: Needs S3 keys
- 3 unique sets: Needs 40+ approved questions per section
