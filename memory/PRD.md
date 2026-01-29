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
- [x] Super Admin Dashboard (`/superadmin`) with three main cards
- [x] Schools Management (`/superadmin/schools`)
  - Create, Edit, Soft Delete schools
  - Fields: Name, Code, Address, Phone, Principal details
- [x] Admin Settings (`/superadmin/settings`)
  - School selection dropdown (persisted in localStorage)
  - Wing Management: Create, Edit, Delete wings per school
  - Exam Management: Create, Edit, Delete exams per wing
- [x] S3 Storage Configuration (`/superadmin/storage`)
  - Overview table of all schools' storage status
  - Configure S3 bucket name, folder path, max storage per school
- [x] Added routes to App.tsx for all superadmin pages
- [x] Implemented missing MemStorage methods:
  - softDeleteTenant
  - Wing CRUD: getWingsByTenant, getWing, createWing, updateWing, softDeleteWing
  - Exam CRUD: getSchoolExams, getSchoolExam, createSchoolExam, updateSchoolExam, softDeleteSchoolExam

## API Endpoints

### Super Admin APIs
- `GET, POST /api/superadmin/schools` - List and create schools
- `PATCH, DELETE /api/superadmin/schools/:id` - Update and delete schools
- `GET, POST /api/superadmin/wings` - List and create wings
- `PATCH, DELETE /api/superadmin/wings/:id` - Update and delete wings
- `GET, POST /api/superadmin/exams` - List and create exams
- `PATCH, DELETE /api/superadmin/exams/:id` - Update and delete exams
- `GET, POST /api/superadmin/storage` - Get and save storage config
- `GET /api/superadmin/storage/all` - Get all schools' storage configs

## Database Schema

### Key Tables
- `tenants` (schools): id, name, code, logo, active
- `users`: id, email, role, tenantId
- `school_wings`: id, tenantId, name, displayName, grades[], sortOrder, isActive
- `school_exams`: id, tenantId, wingId, examName, academicYear, totalMarks, durationMinutes, subjects[], pageSize
- `school_storage_configs`: id, tenantId, s3BucketName, s3FolderPath, maxStorageBytes

## Test Credentials
- **Super Admin:**
  - School Code: `SUPERADMIN`
  - Email: `superadmin@safal.com`
  - Password: `SuperAdmin@123`

## Upcoming Tasks (P1)
1. **Integrate Super Admin Exams into HOD Blueprint Flow**
   - Update HOD's blueprint creation page to fetch exams from Super Admin configuration
2. **Integrate Super Admin Exams into Student Mock Tests**
   - Display exams where "Allow Mock Test" is enabled

## Future Tasks (P2)
1. Database seed script for initial superadmin user
2. Clean up obsolete old admin pages (`/pages/admin/`)
3. Fix pre-existing TypeScript errors
4. Database migration for PostgreSQL (run `npm run db:push`)

## Known Limitations
- Currently using MemStorage (in-memory) for development - data resets on server restart
- S3 storage configuration is saved but actual S3 operations require AWS credentials

## Development Notes
- Frontend runs on port 3000 (Vite dev server)
- Backend runs on port 8001 (Express.js)
- Set `STORAGE_ENGINE=memory` for in-memory storage
- Use `STORAGE_ENGINE=postgres` with `DATABASE_URL` for PostgreSQL
