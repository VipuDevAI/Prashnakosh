# PRASHNAKOSH V1 - Product Requirements Document

## Original Problem Statement
Build a Question Bank + Blueprint + Question Paper Generation + Online Mock Test platform for schools. The system is Department-driven (Class + Subject combinations), where all entities (Questions, Blueprints, Papers, Mocks) belong to a specific Department.

## Core Architecture (V1 Lock)
- **Department Model**: Core data filtered by Department. Users (Teachers/HODs) access only assigned departments.
- **Context Selector**: Frontend dropdown to switch active "Current Department" - scopes all views automatically.
- **Blueprint-Driven**: Department Head creates Blueprint Template first, then teachers upload questions according to blueprint sections.
- **Word Parser**: Support plain text markers (SECTION, LESSON:, TOPIC:) without special formatting.
- **Coverage Dashboard**: Track counts of approved questions by Dept -> Section -> Lesson -> Topic.
- **HTML Storage**: Use `contentFormat: 'html'` via `mammoth.convertToHtml()`.
- **S3-Compatible Storage**: Abstraction layer for file/image uploads.

## Tech Stack
- Frontend: React + TypeScript + Vite + Shadcn/UI + TanStack Query
- Backend: Node.js + Express + TypeScript + Drizzle ORM
- Database: PostgreSQL (local)
- Auth: Simple token-based (NO JWT refactor per user directive)

## What's Been Implemented

### Phase 1: Foundation (DONE)
- Multi-tenant architecture with school codes
- Role-based access (super_admin, admin, HOD, teacher, student)
- Student & Teacher CSV bulk onboarding with rollNumber
- Batch logic for test start routing

### Phase 2: Department CMS (DONE)
- Schema: `schoolClasses`, `schoolSubjects`, `departments`, `userDepartments`
- Admin UI for generating departments (Class x Subject matrix)
- Department member management (assign/remove users)
- Codebase-wide rename: `chapter` -> `lesson`
- Added `departmentId` and `contentFormat` to questions schema

### Phase 3: Department Permissions & Context Selector (DONE - June 18, 2026)
- **Backend**:
  - `validateDepartmentAccess()` helper function at module level
  - Login response enriched with `departmentIds[]` and `activeDepartmentId`
  - Auth middleware fetches user departments for every request
  - `GET /api/my-departments` - enriched endpoint with className, subjectName, role
  - `GET /api/questions?departmentId=` - filtered by department
  - `GET /api/blueprints?departmentId=` - filtered by department
  - `GET /api/tests?departmentId=` - filtered by department
  - `GET /api/hod/questions/pending?departmentId=` - filtered by department
  - `POST /api/questions` - requires `departmentId` (400 if missing)
  - `POST /api/blueprints` - requires `departmentId` (400 if missing)
  - `POST /api/tests/generate` - requires `departmentId` (400 if missing)
  - `POST /api/questions/bulk` - accepts and passes `departmentId`
  - `POST /api/upload/word` - accepts and passes `departmentId`
  - Admin/super_admin bypass department access checks
  - Security: 403 returned when user accesses unauthorized department
- **Frontend**:
  - `DepartmentProvider` context (fetches departments, persists active selection in localStorage)
  - `DepartmentSelector` dropdown component in navigation header
  - All data-fetching pages pass `departmentId` query param: dashboard, questions, blueprints, tests, paper-generator
  - `authFetch()` utility for safe API calls with error handling
  - Welcome message shows current department name
- **Testing**: 14/14 tests passed (11 backend + 3 frontend)

## Prioritized Backlog

### P0 (Next)
- [ ] Word Parser Enhancement: Detect SECTION, LESSON:, TOPIC: markers in plain text
- [ ] Blueprint-Driven Upload Flow: Teachers upload into specific blueprint sections
- [ ] Coverage Dashboard: Approved question counts by Section -> Lesson -> Topic

### P1
- [ ] HTML Storage Migration: `mammoth.convertToHtml()` for rich content
- [ ] S3-Compatible Storage Setup: Abstraction layer for file uploads

### P2
- [ ] Lesson Weightage Engine: Strict lesson distribution in paper generation
- [ ] Auto-Reapproval: Editing approved question reverts to `pending_approval`
- [ ] PDF Enhancements: Tables, images, HTML formatting in output

### Technical Debt
- [ ] `routes.ts` is ~6600 lines - refactor into modular route files (user deferred)
