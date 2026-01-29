# Prashnakosh - Education Governance Platform

## Overview
Prashnakosh is an education governance application for exam configuration and assessment management. The platform supports multiple roles including Super Admin, Principal, HOD, Teachers, Students, and Parents.

## Original Problem Statement
Build a brand-new Super Admin Dashboard from scratch with:
1. Landing page with three primary buttons: Add School, Admin Settings, S3 Storage
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
- **Database:** PostgreSQL (via Drizzle ORM), with MemStorage for development
- **Authentication:** JWT-based

## Architecture
```
/app
├── client/                # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── admin/        # Old admin pages (obsolete)
│   │   │   └── superadmin/   # NEW Super Admin pages
│   │   │       ├── dashboard.tsx
│   │   │       ├── schools.tsx
│   │   │       ├── settings.tsx
│   │   │       ├── storage.tsx
│   │   │       ├── users.tsx
│   │   │       └── reference-materials.tsx  # NEW
│   │   ├── App.tsx           # Main router
│   │   └── main.tsx
├── server/                # Express.js backend
│   ├── routes.ts          # API definitions
│   ├── storage.ts         # Storage interface + MemStorage
│   └── pg-storage.ts      # PostgreSQL storage
├── shared/                # Drizzle schema
│   └── schema.ts
└── vite.config.ts
```

## What's Been Implemented

### Phase 1: Super Admin Dashboard (COMPLETED - Jan 29, 2026)
- [x] Fixed CSS/styling issue by configuring Vite proxy and supervisor
- [x] Super Admin login redirects to `/superadmin`
- [x] Premium gradient header and colorful cards design
- [x] Schools Management - Create, Edit, Soft Delete
- [x] Admin Settings - Wings and Exams management
- [x] S3 Storage Configuration

### Phase 2: Teacher & Student Onboarding (COMPLETED - Jan 29, 2026)
- [x] **Teacher onboarding with:**
  - Wing assignment (mandatory, single wing)
  - Subject assignment (mandatory, multiple subjects)
  - Bulk upload with CSV template
- [x] **Student onboarding with:**
  - Class/Grade assignment (mandatory)
  - Section assignment (optional)
  - Bulk upload with CSV template
- [x] Updated database schema with new fields: `wingId`, `subjects`, `section`
- [x] Updated Users Management UI with new fields

### Phase 3: Design Improvements (COMPLETED - Jan 29, 2026)
- [x] **Theme Provider** with dark/light/system toggle
- [x] Theme preference persisted in localStorage
- [x] **Multi-color gradients** on:
  - Header (purple-pink gradient)
  - Action cards (emerald, orange, blue, purple)
  - Stats section (glassmorphism)
- [x] Smooth hover animations and transitions
- [x] Premium modern look

### Phase 4: Principal Dashboard Fix (COMPLETED - Jan 29, 2026)
- [x] **CRITICAL FIX**: Removed ALL hardcoded demo data (Mr. Sharma, Ms. Gupta, fake percentages)
- [x] Principal Dashboard now uses REAL PostgreSQL APIs:
  - `/api/principal/snapshot` - School snapshot (total students, tests, avg score, at-risk count)
  - `/api/principal/grade-performance` - Grade-wise performance from actual exams
  - `/api/principal/subject-health` - Subject-wise health analysis
  - `/api/principal/at-risk-students` - Students with 2+ low scores
  - `/api/principal/risk-alerts` - Tab switches, absences, score drops
- [x] New UI tabs: Overview, Grade Performance, Subject Health, At-Risk Students, Risk Alerts
- [x] Empty states display when no data (instead of fake data)
- [x] Header message confirms: "All data shown is from your PostgreSQL database - no demo or mock data"

### Phase 5: Reference Materials Library (COMPLETED - Jan 29, 2026)
- [x] **Super Admin Dashboard** updated with 5th card: "Reference Library"
- [x] **Reference Materials page** with:
  - Stats cards (Total, Class 10, Class 12, Question Papers)
  - Filter by Grade (10, 12) and Category
  - Search functionality
  - Full CRUD operations
- [x] **Backend APIs:**
  - `GET /api/superadmin/reference-materials` - List materials
  - `POST /api/superadmin/reference-materials` - Create material
  - `PATCH /api/superadmin/reference-materials/:id` - Update
  - `DELETE /api/superadmin/reference-materials/:id` - Soft delete
- [x] **Categories supported:** question_paper, reference_notes, answer_key, syllabus
- [x] **Grades restricted to:** Class 10 and Class 12 only
- [x] **Academic years:** Last 10 years (2024-25 to 2015-16)
- [x] Schema includes: title, description, grade, subject, category, academicYear, fileName, s3Key

## Database Schema

### Reference Materials Table (NEW)
```sql
reference_materials (
  id, title, description, grade, subject, category,
  academicYear, fileUrl, fileName, fileSize, mimeType,
  s3Key, isActive, isDeleted, createdAt, createdBy, updatedAt
)
```

### Users Table (Updated)
```sql
users (
  id, tenantId, userCode, email, password, name, role,
  grade,        -- For students: class 1-12
  section,      -- For students: A, B, C, etc.
  wingId,       -- For teachers: assigned wing ID
  subjects,     -- For teachers: array of subjects
  avatar, parentOf, active, ...
)
```

## API Endpoints

### Super Admin APIs
- `GET, POST /api/superadmin/schools` - List and create schools
- `PATCH, DELETE /api/superadmin/schools/:id` - Update and delete schools
- `GET, POST /api/superadmin/wings` - List and create wings
- `PATCH, DELETE /api/superadmin/wings/:id` - Update and delete wings
- `GET, POST /api/superadmin/exams` - List and create exams
- `PATCH, DELETE /api/superadmin/exams/:id` - Update and delete exams
- `GET, POST /api/superadmin/users` - List and create users
- `PATCH, DELETE /api/superadmin/users/:id` - Update and delete users
- `POST /api/superadmin/users/bulk` - Bulk upload users (teachers/students)
- `GET, POST /api/superadmin/storage` - Storage configuration
- `GET, POST /api/superadmin/reference-materials` - Reference materials CRUD
- `PATCH, DELETE /api/superadmin/reference-materials/:id` - Update/delete materials

### Principal APIs
- `GET /api/principal/snapshot` - School metrics snapshot
- `GET /api/principal/grade-performance` - Grade-wise performance
- `GET /api/principal/subject-health` - Subject health analysis
- `GET /api/principal/at-risk-students` - At-risk student list
- `GET /api/principal/risk-alerts` - Behavioral alerts

### Student APIs
- `GET /api/student/reference-materials` - View reference materials (Class 10/12 only, read-only)

## Test Credentials
- **Super Admin:**
  - School Code: `SUPERADMIN`
  - Email: `superadmin@safal.com`
  - Password: `SuperAdmin@123`
- **Test Principal:**
  - School Code: `TESTSCHOOL`
  - Email: `principal@testschool.com`
  - Password: `Principal@123`

## Upcoming Tasks (P1)
1. **Build Full Principal Analytics Dashboard** - PowerBI-style interactive dashboard with:
   - Student performance trends (charts)
   - Subject-wise analysis (bar charts)
   - Teacher performance metrics
   - Exam completion rates
   - Class/Section comparisons
2. **Integrate Super Admin Exams into HOD Blueprint Flow**
3. **Integrate Super Admin Exams into Student Mock Tests**

## Future Tasks (P2)
1. **Phase B:** Full PostgreSQL migration - remove MemStorage fallback
2. **Phase C:** AWS S3 integration for actual file uploads
3. Database seed script for initial superadmin user
4. Clean up obsolete old admin pages (`/pages/admin/`)
5. Fix pre-existing TypeScript errors in original codebase

## Important Notes for Future Development
1. **Database Migration Reminder:** After schema changes, run `npm run db:push` on Render shell
2. **Storage Parity:** Always implement new storage methods in BOTH `MemStorage` AND `PgStorage`
3. **No Demo Data Policy:** All dashboards must show real data or proper empty states - no hardcoded/mock data
4. **Authentication:** Use localStorage token for API calls from frontend components
