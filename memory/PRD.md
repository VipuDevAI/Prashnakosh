# Prashnakosh - Education Governance Platform

## Overview
Prashnakosh is an education governance application for exam configuration and assessment management. The platform supports multiple roles including Super Admin, Principal, HOD, Teachers, Students, and Parents.

## Original Problem Statement
Build a brand-new Super Admin Dashboard from scratch with:
1. Landing page with primary management cards
2. Add School Module with full CRUD for schools
3. Admin Settings Module with school selection, Wing Management, and Exam Management
4. S3 Storage Module for allocating S3 buckets per school
5. Users Module with bulk upload for Teachers and Students
6. Premium design with dark/light toggle and multi-color gradients
7. Principal Analytics Dashboard with PowerBI-style insights
8. Global Reference Materials Library for Class 10 & 12 students

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (via Drizzle ORM) - **ONLY source of truth**
- **Authentication:** JWT-based

## Critical Architecture Decisions

### 1. PostgreSQL-Only Storage (MemStorage REMOVED)
- MemStorage has been **completely removed** from the codebase
- PostgreSQL is the **only source of truth** for all business data
- No in-memory fallback exists - database failure = application failure
- This ensures data integrity for sensitive student records and exam governance

### 2. Exam Configuration Authority (Single Source of Truth)
- **Super Admin creates all exams** via Admin Settings → Wing → Exams
- **school_exams** table is the single authoritative definition
- All roles consume from this same source:
  - **HOD Blueprint Flow**: Uses `getActiveExamsForBlueprint()` → queries `school_exams`
  - **Student Mock Tests**: Uses `getMockTestExams()` → queries `school_exams` where `allowMockTest=true`
  - **Principal Analytics**: References same exam structure
- **NO independent exam definitions** in any dashboard

### 3. Schema Stability
- All schema changes must be backward compatible
- Run `npm run db:push` ONCE after schema is finalized
- No repeated schema churn

## Database Schema

### Core Tables
```sql
-- Super Admin configures schools
tenants (id, name, code, active, ...)

-- Wings under each school
school_wings (id, tenantId, name, displayName, grades, ...)

-- Exams under each wing (SINGLE SOURCE OF TRUTH)
school_exams (
  id, tenantId, wingId, examName, academicYear,
  totalMarks, durationMinutes, examDate, subjects,
  allowMockTest,  -- When true, appears in Student Mock Tests
  watermarkText, logoUrl, pageSize, isActive, ...
)

-- Users with role-based access
users (id, tenantId, email, role, wingId, subjects, section, ...)

-- Reference materials for Class 10 & 12
reference_materials (id, title, grade, subject, category, fileName, ...)
```

## What's Been Implemented

### Phase 1: Super Admin Dashboard (COMPLETED)
- [x] Schools Management - CRUD operations
- [x] Wings Management - Per-school wing configuration
- [x] Exams Management - Per-wing exam configuration with allowMockTest toggle
- [x] S3 Storage Configuration UI
- [x] Users Management with bulk upload

### Phase 2: Teacher & Student Onboarding (COMPLETED)
- [x] Teacher onboarding with wing and subjects
- [x] Student onboarding with class and section
- [x] CSV bulk upload with templates

### Phase 3: Design Improvements (COMPLETED)
- [x] Dark/Light theme toggle
- [x] Multi-color gradient cards
- [x] Prashnakosh logo and footer
- [x] Premium UI with glassmorphism

### Phase 4: Principal Dashboard Fix (COMPLETED)
- [x] Removed ALL hardcoded demo data
- [x] Connected to real PostgreSQL APIs
- [x] Shows actual student/exam metrics

### Phase 5: Reference Materials Library (COMPLETED)
- [x] Super Admin CRUD for reference materials
- [x] Filter by grade (10/12) and category
- [x] Student read-only access

### Phase 6: PostgreSQL-Only Storage (COMPLETED - Jan 29, 2026)
- [x] **Removed MemStorage class entirely**
- [x] **PostgreSQL is now the ONLY storage engine**
- [x] **Seed script creates Super Admin on startup**
- [x] **No fallback logic - database is mandatory**

### Phase 7: Exam Authority Consolidation (COMPLETED - Jan 29, 2026)
- [x] **school_exams is the single source of truth**
- [x] **getActiveExamsForBlueprint() now queries school_exams**
- [x] **getMockTestExams() now queries school_exams with allowMockTest=true**
- [x] **Admin Settings UI shows Mock Test column**
- [x] **Add Exam form includes allowMockTest checkbox**

## API Endpoints

### Super Admin APIs
- `POST /api/auth/login` - Authentication
- `GET, POST /api/tenants` - Schools CRUD
- `GET, POST /api/superadmin/wings` - Wings CRUD
- `GET, POST /api/superadmin/exams` - Exams CRUD (includes allowMockTest)
- `GET, POST /api/superadmin/users` - Users CRUD
- `POST /api/superadmin/users/bulk` - Bulk upload
- `GET, POST /api/superadmin/reference-materials` - Reference materials CRUD

### Role-based APIs
- `GET /api/exams/for-blueprint` - HOD gets active exams (from school_exams)
- `GET /api/exams/mock-tests` - Students get mock test exams (where allowMockTest=true)
- `GET /api/principal/snapshot` - Principal analytics

## Test Credentials
- **Super Admin:** SUPERADMIN / superadmin@safal.com / SuperAdmin@123

## Environment Configuration
```env
DATABASE_URL=postgresql://user:password@host:5432/prashnakosh
NODE_ENV=development
PORT=8001
```

## Deployment Notes
1. PostgreSQL is **REQUIRED** - application will not start without it
2. Run `npm run db:push` ONCE after deployment to sync schema
3. Super Admin user is seeded automatically on first startup

## Upcoming Tasks (P1)
1. **Build Full Principal Analytics Dashboard** - PowerBI-style with charts
2. **Verify HOD Blueprint consumes school_exams correctly**
3. **Verify Student Mock Tests consume school_exams correctly**

## Future Tasks (P2)
1. AWS S3 integration for file uploads
2. Clean up obsolete `/pages/admin/` pages
3. Fix pre-existing TypeScript errors
