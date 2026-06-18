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
- **Unified Dashboard** at `/hod/academic-coverage`:
  - 4-level hierarchy: Department → Section → Lesson → Topic
  - Department Overview card: Total Questions, Approved, Pending, Required, Coverage %
  - Attention Required card: Weak sections/lessons/topics sorted by severity
  - Blueprint drill-down with expand/collapse panels
  - Section panels: Required, Approved, Pending, Coverage %, Status (green/yellow/red), Need indicator
  - Lesson cards: Required, Approved, Coverage %, Need count, expand for topics
  - Topic rows: Required, Approved, Coverage %, Need indicator
- **Backend API** `GET /api/departments/:id/academic-coverage`:
  - Returns complete hierarchical coverage aggregation
  - Uses ONLY `status === 'approved'` for coverage calculations
  - Calculates weakSections, weakLessons, weakTopics
  - Department access validation (403 for unauthorized)
- **Schema Extension**: `BlueprintSection.lessonWeightage` field added for Lesson Weightage Engine
- **Navigation**: "Academic Coverage" card added to HOD dashboard
- **Tested**: 30/30 (16 backend + 14 frontend, iteration_10.json)

## Prioritized Backlog

### P0 (Next)
- [ ] Lesson Weightage Engine: Paper generation must obey lesson distribution from blueprints
- [ ] Full E2E Test: Create Blueprint → Upload → Approve → View Coverage → Generate Paper → Mock Test

### P1 (After E2E)
- [ ] HTML Storage Migration: mammoth.convertToHtml()
- [ ] S3-Compatible Storage Setup

### P2
- [ ] Auto-Reapproval: Editing approved question reverts to pending_approval
- [ ] PDF Enhancements

## Key API Endpoints
- `GET /api/my-departments` - User's departments with enriched data
- `GET /api/questions?departmentId=` - Department-filtered questions
- `GET /api/blueprints?departmentId=` - Department-filtered blueprints
- `GET /api/blueprints/:id/coverage` - Section-wise coverage with lesson breakdown
- `GET /api/departments/:id/academic-coverage` - Full hierarchical coverage dashboard
- `POST /api/teacher/upload/word/preview` - Parse .docx with hierarchy + section lock
- `POST /api/teacher/upload/word/confirm` - Save parsed questions with departmentId

## Database Schema (Key Tables)
- `departments`: id, tenantId, classId, subjectId, name, headId
- `userDepartments`: userId, departmentId, role
- `questions`: id, departmentId, section, lesson, topic, contentFormat, contentHash, status
- `blueprints`: id, departmentId, sections (jsonb with name/marks/questionType/questionCount/lessonWeightage)
- `tests`: id, departmentId, blueprint

## BlueprintSection Type (with Lesson Weightage prep)
```typescript
type BlueprintSection = {
  name: string;
  marks: number;
  questionCount: number;
  questionType: QuestionType;
  difficulty?: DifficultyLevel;
  lessons?: string[];
  instructions?: string;
  lessonWeightage?: Record<string, {
    questionCount: number;
    topicWeightage?: Record<string, number>;
  }>;
};
```
