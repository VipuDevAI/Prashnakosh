# PRASHNAKOSH V1 - Product Requirements Document

## Original Problem Statement
Build a Question Bank + Blueprint + Question Paper Generation + Online Mock Test platform for schools. Department-driven (Class + Subject), Blueprint-controlled upload flow.

## Tech Stack
React + TypeScript + Vite + Shadcn/UI | Node.js + Express + Drizzle ORM | PostgreSQL | Simple token auth

## What's Been Implemented

### Phase 1: Foundation (DONE)
- Multi-tenant architecture, role-based access, CSV onboarding, batch logic

### Phase 2: Department CMS (DONE)
- Schema: schoolClasses, schoolSubjects, departments, userDepartments
- Admin UI for department generation (Class x Subject matrix)

### Phase 3: Department Permissions & Context Selector (DONE - June 18)
- Backend: validateDepartmentAccess(), API filtering by departmentId, 403 security
- Frontend: DepartmentProvider, DepartmentSelector dropdown, all pages scoped
- Tested: 14/14 (iteration_7.json)

### Phase 4: Word Parser Enhancement (DONE - June 18)
- Parser detects SECTION A/B/C, LESSON: <name>, TOPIC: <name> from plain text
- Context switching (new SECTION resets lesson+topic, new LESSON resets topic)
- Validation warnings for missing context, passage support, Unicode/Sanskrit support
- Preview shows hierarchy summary + per-question section/lesson/topic
- Tested: 22/22 (iteration_8.json)

### Phase 5: Blueprint-Driven Upload (DONE - June 18)
- **Blueprint Upload Dashboard** (`/teacher/upload/blueprint`):
  - Teacher selects blueprint → sees only its sections
  - Each section shows: Required, Approved, Pending, Coverage %, Upload button
  - Lesson/Topic breakdown expandable per section
  - No free-form section creation allowed
- **Coverage API** (`GET /api/blueprints/:id/coverage`):
  - Returns section-wise coverage with lessonBreakdown (approved/pending per topic)
  - Overall coverage percentage
- **Section Lock Validation**:
  - `targetSection` param in preview endpoint
  - Questions from other sections reassigned to target with warnings
  - Upload page shows "Uploading for Section X" banner
- **Schema update**: `section` column added to questions table
- **Teacher Dashboard**: Blueprint Upload card prominently displayed
- Tested: 22/22 (iteration_9.json) - 10 backend + 12 frontend

## Prioritized Backlog

### P0 (Next)
- [ ] Coverage Dashboard: HOD-level approved question counts by Dept → Section → Lesson → Topic
- [ ] Blueprint Health View: Required vs Available (approved) per section with coverage %

### P1 (After Phase 2)
- [ ] HTML Storage Migration: mammoth.convertToHtml()
- [ ] S3-Compatible Storage Setup

### P2
- [ ] Lesson Weightage Engine
- [ ] Auto-Reapproval
- [ ] PDF Enhancements

## Key API Endpoints
- `GET /api/my-departments` - User's departments with enriched data
- `GET /api/questions?departmentId=` - Department-filtered questions
- `GET /api/blueprints?departmentId=` - Department-filtered blueprints
- `GET /api/blueprints/:id/coverage` - Section-wise coverage with lesson breakdown
- `POST /api/teacher/upload/word/preview` - Parse .docx with hierarchy + section lock
- `POST /api/teacher/upload/word/confirm` - Save parsed questions with departmentId

## Database Schema (Key Tables)
- `departments`: id, tenantId, classId, subjectId, name, headId
- `userDepartments`: userId, departmentId, role
- `questions`: id, departmentId, **section**, lesson, topic, contentFormat, contentHash
- `blueprints`: id, departmentId, sections (jsonb with name, marks, questionType, questionCount)
- `tests`: id, departmentId, blueprint
