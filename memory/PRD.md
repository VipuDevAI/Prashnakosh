# PRASHNAKOSH V1 - Product Requirements Document

## Original Problem Statement
Build a Question Bank + Blueprint + Question Paper Generation + Online Mock Test platform for schools. Department-driven (Class + Subject), Blueprint-controlled upload flow.

## Tech Stack
React + TypeScript + Vite + Shadcn/UI | Node.js + Express + Drizzle ORM | PostgreSQL (Neon) | Simple token auth

## Design System
- **Theme**: Dark cosmic (forced dark mode, no light mode)
- **Colors**: Royal Blue (#4F46E5), Indigo, Deep Purple (#9333EA), Gold (#D4AF37)
- **Background**: Gradient (#0B0A1F → #16113A → #0A0518)
- **Glassmorphism**: rgba(255,255,255,0.05) + blur(24px) + border rgba(255,255,255,0.1)
- **Typography**: Outfit (headings), Manrope (body)
- **Sidebar**: 240px dark panel with icon+label nav, gold active indicator
- **Branding**: "Prashnakosh" in gold, "Powered by SmartGenEduX @ 2026"
- **Reference**: /app/design_guidelines.json

## What's Been Implemented

### Phase 1-5: Foundation through Blueprint Upload (DONE)
- Multi-tenant, role-based access, department CMS, word parser, blueprint-driven upload

### Phase 6: Academic Coverage Dashboard (DONE)
- 4-level hierarchy: Department → Section → Lesson → Topic
- Only approved questions count for coverage

### Phase 7: Blocker Resolution (DONE - June 18, 2026)
- BLOCKER 1: Paper generation departmentId filter (zero cross-dept leakage)
- BLOCKER 4: Lesson balancing via round-robin spread
- BLOCKER 5: submitExam status fix
- E2E Test: All 12 steps verified

### Phase 8: UI/UX Premium Redesign (DONE - June 18, 2026)
- **Global CSS**: Dark cosmic theme, glassmorphism utilities, CSS variables
- **Login Page**: Glass card, cosmic gradient background, gold branding, feature cards
- **AppShell**: Premium sidebar (icon+label, role-filtered, gold active state) + top bar (dept selector, user avatar)
- **Dashboard**: Simplified, renders inside AppShell
- **Coverage Page**: Updated to dark theme with glass stat cards
- **All Pages**: Inherit dark theme automatically via CSS variables
- Tested: 100% backend + 100% frontend (iteration_12.json)

## Prioritized Backlog

### P0 (Pilot Readiness) - ALL DONE
- [x] Fix departmentId filter in paper generation
- [x] Lesson balancing
- [x] Full E2E test
- [x] Premium UI/UX redesign

### P1 (Post-Pilot)
- [ ] S3 Configuration: AWS_S3_BUCKET, AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- [ ] HTML Storage Migration: mammoth.convertToHtml()
- [ ] Session timeout (token expiry)
- [ ] Admin Maintenance: Archive/SoftDelete/HardWipe question banks
- [ ] Blueprint Versioning: academicYear + version fields

### P2
- [ ] Auto-Reapproval: Edit approved → revert to pending
- [ ] PDF Enhancements
- [ ] Performance optimization for 5K+ questions
- [ ] Syllabus Migration tools

## Key API Endpoints
- `GET /api/departments/:id/academic-coverage` - Full hierarchical coverage
- `POST /api/blueprints/:id/generate-preview` - Paper generation (departmentId filtered)
- `POST /api/tests/generate` - Create mock test
- `POST /api/exam/start` / `POST /api/exam/submit` - Student exam flow
- `GET /api/student/results` - Student results (requires HOD reveal)

## Pilot Readiness: 78/100 (CONDITIONAL GO)
- Text-only pilot: READY
- Image-based pilot: Needs S3 keys
- 3 unique sets: Needs 40+ approved questions per section
