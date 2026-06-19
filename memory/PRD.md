# PRASHNAKOSH V1 - Product Requirements Document

## Problem Statement
Prashnakosh is a Question Bank + Blueprint + Mock Test platform operating under a strict Department Model for schools.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (Neon DB) + Drizzle ORM
- **Auth**: Token-based with role-based session TTLs (no JWT)
- **UI Theme**: Dark cosmic gradient, Glassmorphism, AppShell (Sidebar + Topbar)

## All Completed Features
- [x] Multi-tenant school system with department isolation
- [x] Word document upload + parsing into question bank
- [x] Blueprint creation and management
- [x] Question approval workflow (Teacher -> HOD -> Principal)
- [x] Academic Coverage Dashboard
- [x] Multi-Set Paper Generation with lesson balancing
- [x] Mock Test E2E (start -> attempt -> submit -> auto-grade -> results)
- [x] Single Source of Truth: Mock Tests & Offline Papers share selectQuestionsUnified()
- [x] Premium Dark Cosmic UI (Glassmorphism, AppShell sidebar)
- [x] Token Expiry (Teacher/HOD 24h, Student 3h)
- [x] Blueprint Marks Decoupling (Type+Difficulty+Lesson selection, blueprint assigns marks)
- [x] Memory Bottleneck Fix (SQL-level filtering, pagination, COUNT/DISTINCT)
- [x] Rate Limiting (login 10/min, exam submit 5/min, paper gen 3/min, general 120/min)
- [x] Connection Pool Configuration (max=20, idle timeout=30s, connection timeout=10s)
- [x] Health Check Endpoint (GET /api/health)
- [x] **Branding Correction (June 19, 2026)**: Official Prashnakosh logo across all pages via BrandLogo.tsx. Favicon, manifest, apple-touch-icon updated. Browser tab = "Prashnakosh Beta". Footer = "Powered by SmartGenEduX @ 2026 / Prashnakosh Beta".

## Branding Assets
- Logo: `/app/client/public/assets/logo/logo.png` (1024x1024, official emblem)
- Favicon: `/app/client/public/favicon.png` + `/app/client/public/favicon.ico`
- Apple Touch Icon: `/app/client/public/apple-touch-icon.png`
- PWA Manifest: `/app/client/public/manifest.json`
- Component: `/app/client/src/components/BrandLogo.tsx` (BrandLogo, BrandMark, BrandFooter)
- Constants: `/app/client/src/lib/brand.ts`

## Load Test Results (June 2026)

| Metric | 100 Users | 500 Users | 1000 Users |
|--------|-----------|-----------|------------|
| Error Rate | 0% | 0% | 0.01% |
| Throughput | 25 req/s | 120 req/s | 240 req/s |
| P50 Response | 8ms | 7ms | 10ms |
| P95 Response | 26ms | 40ms | 79ms |
| P99 Response | 120ms | 130ms | 320ms |
| Login P50 | 104ms | 122ms | 197ms |
| DB Pool Used | 8/20 | 8/20 | 8/20 |
| Heap Memory | 80MB | 80MB | 80MB |
| RSS Memory | 215MB | 215MB | 215MB |

## Pending Issues
- **P0 BLOCKED**: S3 image upload -- code complete, missing AWS credentials
- **P2**: `chapter` column NOT NULL constraint cleanup

## Upcoming Tasks
1. Blueprint Versioning UI (P0)
2. Admin Maintenance (P1, post-pilot): Soft Delete, Hard Wipe, Syllabus Migration, Archive Department
3. HTML Storage Migration (P2, post-pilot)
4. PDF Enhancements (P2, post-pilot)

## DO NOT
- Do NOT refactor routes.ts until after pilot
- Do NOT implement JWT migration
- Do NOT start admin maintenance features until post-pilot
