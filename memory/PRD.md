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
- [x] Question approval workflow (Teacher → HOD → Principal)
- [x] Academic Coverage Dashboard
- [x] Multi-Set Paper Generation with lesson balancing
- [x] Mock Test E2E (start → attempt → submit → auto-grade → results)
- [x] Single Source of Truth: Mock Tests & Offline Papers share selectQuestionsUnified()
- [x] Premium Dark Cosmic UI (Glassmorphism, AppShell sidebar)
- [x] Token Expiry (Teacher/HOD 24h, Student 3h)
- [x] Blueprint Marks Decoupling (Type+Difficulty+Lesson selection, blueprint assigns marks)
- [x] Memory Bottleneck Fix (SQL-level filtering, pagination, COUNT/DISTINCT)
- [x] Rate Limiting (login 10/min, exam submit 5/min, paper gen 3/min, general 120/min)
- [x] Connection Pool Configuration (max=20, idle timeout=30s, connection timeout=10s)
- [x] Health Check Endpoint (GET /api/health — DB latency, pool stats, memory usage)

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

## Recommended Server Specifications

### 500 Students (School Wing)
- CPU: 2 vCPU
- RAM: 4 GB
- Storage: 20 GB SSD
- PostgreSQL: 15+
- Node.js: 20+
- OS: Ubuntu 22.04 LTS

### 1000 Students (Full School)
- CPU: 4 vCPU
- RAM: 8 GB
- Storage: 50 GB SSD
- PostgreSQL: 15+ (max_connections=100)
- Node.js: 20+ (DB_POOL_MAX=30)

### 7000 Students (Multi-School / District)
- CPU: 8 vCPU
- RAM: 16 GB
- Storage: 100 GB SSD (NVMe preferred)
- PostgreSQL: 15+ (max_connections=200, shared_buffers=4GB)
- Node.js: 20+ (DB_POOL_MAX=50, consider PM2 cluster mode with 4 workers)
- Reverse proxy: Nginx with rate limiting per-IP

## Production Rate Limits (per IP)
- Login: 10 req/min
- Exam submit: 5 req/min
- Paper generation: 3 req/min
- General API: 120 req/min

## Pending Issues
- **P0 BLOCKED**: S3 image upload — code complete, missing AWS credentials
- **P2**: `chapter` column NOT NULL constraint

## Upcoming Tasks
1. Blueprint Versioning UI
2. Design System deep application to all pages
3. Admin Maintenance (post-pilot)
4. HTML Storage Migration (post-pilot)
5. PDF Enhancements (post-pilot)

## DO NOT
- Do NOT refactor routes.ts until after pilot
- Do NOT implement JWT migration
- Do NOT start admin maintenance features until post-pilot
