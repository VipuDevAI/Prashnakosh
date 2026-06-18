# PRASHNAKOSH V1 - Product Requirements Document

## Original Problem Statement
Build a Question Bank + Blueprint + Question Paper Generation + Online Mock Test platform for schools. The system is Department-driven (Class + Subject combinations), where all entities (Questions, Blueprints, Papers, Mocks) belong to a specific Department.

## Core Architecture (V1 Lock)
- **Department Model**: Core data filtered by Department. Users (Teachers/HODs) access only assigned departments.
- **Context Selector**: Frontend dropdown to switch active "Current Department" - scopes all views automatically.
- **Blueprint-Driven**: Department Head creates Blueprint Template first, then teachers upload questions according to blueprint sections.
- **Word Parser**: Support plain text markers (SECTION, LESSON:, TOPIC:) without special formatting.
- **Question Hierarchy**: Department -> Section -> Lesson -> Topic -> Question (never flatten into a single pool).

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
- Backend: `validateDepartmentAccess()`, enriched login, API filtering by departmentId
- Frontend: DepartmentProvider, DepartmentSelector dropdown, all pages scoped by department
- Security: 403 for unauthorized department access. Admin/super_admin bypass.
- Tested: 14/14 (iteration_7.json)

### Phase 4: Word Parser Enhancement (DONE - June 18, 2026)
- **Parser rewrite**: Detects SECTION A/B/C, LESSON: <name>, TOPIC: <name> from plain text
- **Context hierarchy**: Each question inherits section/lesson/topic from latest context
- **Context switching**: New SECTION resets lesson+topic. New LESSON resets topic.
- **Validation warnings**: Generated for questions before any SECTION, LESSON, or TOPIC marker
- **Passage support**: Parser doesn't crash on passages, stores as passage-type content
- **Unicode/Sanskrit**: Full support for रामायणम्, व्याकरणम्, शब्दकोशः etc.
- **Preview hierarchy**: API returns `hierarchySummary[]` showing Section -> Lesson -> Topic -> count
- **Per-question metadata**: Each question in preview includes section, lesson, topic fields
- **Frontend preview**: Document Structure card shows hierarchical tree with color-coded badges
- **Auto-populated fields**: Subject/Grade auto-filled from active department context
- **Format guide**: Updated upload page with SECTION/LESSON/TOPIC example
- Tested: 22/22 (iteration_8.json) - 10 backend + 12 frontend

## Prioritized Backlog

### P0 (Next - Phase 2 priorities)
- [ ] Blueprint-Driven Upload Flow: Teachers select blueprint -> upload into specific sections
- [ ] Coverage Dashboard: Approved question counts by Section -> Lesson -> Topic with low coverage warnings
- [ ] Blueprint Health View: Required vs Available (approved) per section with coverage %

### P1 (After Phase 2)
- [ ] HTML Storage Migration: `mammoth.convertToHtml()` for rich content
- [ ] S3-Compatible Storage Setup: Abstraction layer for file uploads

### P2
- [ ] Lesson Weightage Engine: Strict lesson distribution in paper generation
- [ ] Auto-Reapproval: Editing approved question reverts to `pending_approval`
- [ ] PDF Enhancements: Tables, images, HTML formatting in output

### Technical Debt
- [ ] `routes.ts` is ~6700 lines - refactor into modular route files (user deferred)

## Key API Endpoints
- `GET /api/my-departments` - User's departments with enriched data
- `GET /api/questions?departmentId=` - Department-filtered questions
- `GET /api/blueprints?departmentId=` - Department-filtered blueprints
- `GET /api/tests?departmentId=` - Department-filtered tests
- `POST /api/teacher/upload/word/preview` - Parse .docx with hierarchy detection
- `POST /api/teacher/upload/word/confirm` - Save parsed questions with departmentId

## Database Schema (Key Tables)
- `departments`: id, tenantId, classId, subjectId, name, headId
- `userDepartments`: userId, departmentId, role
- `questions`: id, departmentId, section, lesson, topic, contentFormat, contentHash
- `blueprints`: id, departmentId, sections
- `tests`: id, departmentId, blueprint
