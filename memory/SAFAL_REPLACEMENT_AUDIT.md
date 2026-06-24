# PRASHNAKOSH EXAM ENGINE — SAFAL REPLACEMENT AUDIT
## Date: June 19, 2026

---

## P0 — MANDATORY ITEMS

### 1. Exam Timeout Handling

| Requirement | Status | Detail |
|---|---|---|
| Auto submit when timer reaches zero | ✅ Implemented | `exam-engine.tsx` L153-167: Timer decrements every second via `setInterval`. When `prev <= 1`, auto-calls `submitMutation.mutate()` |
| No data loss on timeout | ✅ Implemented | Auto-save runs every 30 seconds (`saveStateMutation`, L174-183). `beforeunload` handler (L186-193) triggers final save on close. The auto-submit sends the current in-memory `answers` state, so any answer given before timeout IS included |

**Code References:**
- Timer: `exam-engine.tsx` L153-171
- Auto-save: `exam-engine.tsx` L173-183
- Before unload save: `exam-engine.tsx` L185-194
- Backend save: `pg-storage.ts` L814-816 (`saveExamState`)
- Backend submit: `pg-storage.ts` L818-869 (`submitExam`)

**5-minute warning:** ✅ Shows AlertDialog at 300 seconds remaining (L162-165)

---

### 2. Exam Resume Capability

| Scenario | Status | Detail |
|---|---|---|
| Browser refresh | ✅ Implemented | `startExam()` (pg-storage.ts L690-696) calls `getActiveAttempt()` first. If in_progress attempt exists, returns same attempt with all saved state (answers, questionStatuses, markedForReview, timeRemaining) |
| Browser close and reopen | ✅ Implemented | Same as above. 30-second auto-save ensures state is persisted. Student logs in again, starts exam → gets same attempt back |
| Network interruption | ⚠️ Partial | During interruption: answers stay in browser memory, auto-save fails silently. When network returns: next 30-sec interval saves successfully. Risk: if student CLOSES browser during network outage, `beforeunload` save also fails → last 0-30 seconds of work could be lost |
| Server restart during exam | ⚠️ Partial | All state up to last successful `saveExamState` is in PostgreSQL. On reconnect, student gets same attempt. Risk: if restart happens DURING a save-state write, that particular save is lost |
| Student reconnect during active exam | ✅ Implemented | `startExam()` always checks `getActiveAttempt(testId, studentId)` first (L690). Returns existing attempt with full state |

**Code References:**
- Active attempt check: `pg-storage.ts` L555-562 (`getActiveAttempt`)
- Resume flow: `pg-storage.ts` L690-697
- Frontend restore: `mock.tsx` L119-128 (passes `initialData` to ExamEngine)
- ExamEngine accepts: `initialAnswers`, `initialStatuses`, `initialMarkedForReview`, `initialTimeRemaining`

**Resume data preserved:**
- ✅ Answers (jsonb `answers` column)
- ✅ Question statuses (jsonb `questionStatuses` column)  
- ✅ Marked for review (jsonb `markedForReview` column)
- ✅ Time remaining (integer `timeRemaining` column)
- ✅ Assigned question IDs (jsonb `assignedQuestionIds` column)

---

### 3. Random Question Assignment Locking

| Requirement | Status | Detail |
|---|---|---|
| Student receives one assigned paper | ✅ Implemented | Questions selected during first `startExam()` call. Stored in `assignedQuestionIds` on attempt record (pg-storage.ts L802). Options shuffled per student (L790-795) |
| Refresh does not generate new paper | ✅ Implemented | `getActiveAttempt()` returns existing attempt with same `assignedQuestionIds`. No re-selection occurs |
| Re-login does not generate new paper | ✅ Implemented | Same logic. Attempt lookup is by `testId + studentId + status='in_progress'` |

**Code References:**
- Question selection: `pg-storage.ts` L704-769
- Assignment storage: `pg-storage.ts` L797-808 (`createAttempt` with `assignedQuestionIds`)
- Option shuffling: `pg-storage.ts` L784-795

**Question selection paths:**
1. Batch-assigned set (L710-730) — student gets pre-assigned Set A/B/C
2. Pre-selected questionIds (L731-735) — test has fixed questions
3. Blueprint-based selection (L736-756) — uses `selectQuestionsUnified`
4. Fallback (L758-769) — random from department questions

---

### 4. Attempt Protection

| Requirement | Status | Detail |
|---|---|---|
| Prevent duplicate attempts | ✅ Implemented | `hasCompletedAttempt()` (pg-storage.ts L1239-1248) checks for submitted/marked attempts. Throws error if found (L700-702) |
| Prevent multiple active attempts | ✅ Implemented | `getActiveAttempt()` returns existing in_progress attempt. New attempt created only if none exists |
| Concurrent tab behavior | ⚠️ Partial | Both tabs get same attempt (good). Both tabs save independently every 30 seconds — last save wins. Tab-switch detection fires on the other tab. No server-side mutual exclusion |

**Code References:**
- Completion check: `pg-storage.ts` L1239-1248
- Active attempt check: `pg-storage.ts` L555-562
- Attempt creation guard: `pg-storage.ts` L690-702

---

### 5. Answer Persistence

| Requirement | Status | Detail |
|---|---|---|
| Answers saved correctly | ✅ Implemented | `saveExamState` (pg-storage.ts L814-816) saves full `answers` map to PostgreSQL jsonb column |
| Mark-for-review status saved | ✅ Implemented | `markedForReview` string array saved in same call |
| Question status restored after resume | ✅ Implemented | `questionStatuses` map saved and passed back as `initialStatuses` on resume |

**Code References:**
- Save state API: `routes.ts` L1023-1041
- Backend save: `pg-storage.ts` L814-816
- Schema columns: `schema.ts` L384-386 (answers, questionStatuses, markedForReview)

---

### 6. Submission Workflow

| Requirement | Status | Detail |
|---|---|---|
| Manual submit | ✅ Implemented | Submit button → AlertDialog confirmation → `submitMutation.mutate()` |
| Auto submit | ✅ Implemented | Timer reaches 0 → auto-submit (exam-engine.tsx L156-159) |
| Submission confirmation | ✅ Implemented | AlertDialog shows answered/unanswered/review counts with warning for unanswered (L563-601) |
| Prevention of resubmission | ❌ **MISSING** | **CRITICAL GAP.** `submitExam()` does NOT check `attempt.status === 'submitted'`. A crafted HTTP request could resubmit with different answers. Frontend disables button only during `isSubmitting` state, not permanently after success |

**Recommended Fix for Resubmission Prevention:**
```typescript
// In pg-storage.ts submitExam():
if (attempt.status === "submitted" || attempt.status === "marked") {
  throw new Error("This exam has already been submitted.");
}
```

**Code References:**
- Submit button: `exam-engine.tsx` L435-443
- Confirmation dialog: `exam-engine.tsx` L563-601
- Auto-submit: `exam-engine.tsx` L156-159
- Backend submit: `pg-storage.ts` L818-869

---

### 7. Result Calculation

| Requirement | Status | Detail |
|---|---|---|
| Correct scoring | ✅ Implemented | Compares `answers[q.id].toLowerCase().trim()` with `q.correctAnswer.toLowerCase().trim()`. Blueprint-assigned marks used via `questionMarksMap` |
| Unanswered handling | ✅ Implemented | Unanswered questions get 0 marks. No negative marking |
| Percentage calculation | ✅ Implemented | `(autoScore / totalMarks) * 100`, stored with 2 decimal precision |
| Ranking/summary | ⚠️ Partial | Individual scores and trend analysis (up/down/stable) via `getReportData`. No class-level ranking or leaderboard |

**Code References:**
- Scoring logic: `pg-storage.ts` L838-856
- Report data: `pg-storage.ts` L900-920
- Manual marking: `pg-storage.ts` L871-898

---

## P1 — STRONGLY RECOMMENDED

### 8. Anti-Cheating Controls

| Requirement | Status | Detail |
|---|---|---|
| Multiple tab detection | ✅ Implemented | `visibilitychange` event (exam-engine.tsx L196-230). Logs to backend via `/api/exam/log-tab-switch`. Creates risk alerts (routes.ts L4631-4680). Shows warning toast to student |
| Copy/paste restrictions | ❌ **MISSING** | No `oncopy`, `onpaste`, `oncut`, or `contextmenu` event prevention in exam-engine.tsx |
| Full-screen support | ❌ **MISSING** | No `requestFullscreen()` API usage. No detection of exiting fullscreen |
| Focus loss detection | ✅ Implemented | Handled via same `visibilitychange` listener as tab detection |

**Risk Alert System:** ✅ Backend creates risk alerts with severity levels (medium for single switch, high for multiple). Risk alerts visible to admins via `/api/risk-alerts` and Principal Risk Alerts dashboard.

---

### 9. Exam Integrity Validation

| Requirement | Status | Detail |
|---|---|---|
| Student cannot access another student's attempt | ✅ Implemented | `save-state` route checks `attempt.studentId !== req.user!.id` (routes.ts L1033). Submit route does same check (L1053). Tenant isolation also enforced |
| Student cannot modify assigned question IDs | ✅ Implemented | `assignedQuestionIds` stored server-side on attempt. Frontend receives read-only. Submit endpoint uses server-stored IDs for scoring, not client-sent IDs |
| Student cannot manipulate timer | ❌ **MISSING** | Timer runs entirely client-side via `setInterval`. Server stores `timeRemaining` from client saves but does NOT validate against wall clock (`startedAt + duration`). Student could modify JS variable in DevTools to extend time |

**Recommended Fix for Timer Validation:**
```typescript
// In routes.ts exam/save-state and exam/submit:
const test = await storage.getTest(attempt.testId);
const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
const maxDuration = (test.duration || 60) * 60;
if (elapsedSeconds > maxDuration + 30) { // 30 sec grace
  // Auto-submit immediately, ignore client timer
  return storage.submitExam(attemptId, answers);
}
```

---

### 10. Performance Testing

| Requirement | Status | Detail |
|---|---|---|
| 1000 concurrent users load test | ✅ Done | Locust test completed. 0.01% error rate at 1000 users |
| Login bottleneck | ✅ Verified | P50: 197ms at 1000 users |
| Exam start bottleneck | ⚠️ Not individually tested | `startExam()` involves multiple DB queries (getTest, getActiveAttempt, hasCompletedAttempt, getQuestionsByIds, createAttempt). Needs specific load test |
| Answer save bottleneck | ⚠️ Not individually tested | `saveExamState` is a single UPDATE query — should be fast, but 1000 students saving every 30 seconds = 33 saves/second sustained |
| Submission bottleneck | ⚠️ Not individually tested | `submitExam()` involves multiple queries (getAttempt, getQuestionsByIds, getTest, updateAttempt). All 1000 students submitting within last 30 seconds = spike |
| Result generation | ⚠️ Not individually tested | Part of submit flow |

**Load Test Metrics (from iteration_15):**

| Metric | 1000 Users |
|---|---|
| Error Rate | 0.01% |
| Throughput | 240 req/s |
| P95 Response | 79ms |
| P99 Response | 320ms |
| DB Pool Used | 8/20 |

---

### 11. End-to-End Verification

| Step | Status | Detail |
|---|---|---|
| Question Upload | ✅ Verified | Word doc parsing, manual entry, bulk CSV |
| Approval | ✅ Verified | Teacher → HOD → Principal workflow with state machine |
| Blueprint | ✅ Verified | Section-based with marks decoupling |
| Paper Generation | ✅ Verified | Multi-set (A/B/C) with lesson balancing |
| Mock Test Creation | ✅ Verified | From generated paper or blueprint |
| Student Attempt | ✅ Verified | Start → answer → navigate → submit |
| Result Processing | ✅ Verified | Auto-scoring + manual marking + finalization |

---

## SUMMARY MATRIX

| # | Item | Status | Priority |
|---|---|---|---|
| 1 | Exam timeout + auto submit | ✅ Implemented | — |
| 2a | Resume: browser refresh | ✅ Implemented | — |
| 2b | Resume: browser close/reopen | ✅ Implemented | — |
| 2c | Resume: network interruption | ⚠️ Partial (30s data loss risk) | LOW |
| 2d | Resume: server restart | ⚠️ Partial (same as 2c) | LOW |
| 2e | Resume: student reconnect | ✅ Implemented | — |
| 3 | Question assignment locking | ✅ Implemented | — |
| 4a | Prevent duplicate attempts | ✅ Implemented | — |
| 4b | Prevent multiple active | ✅ Implemented | — |
| 4c | Concurrent tab behavior | ⚠️ Last-save-wins | LOW |
| 5 | Answer persistence | ✅ Implemented | — |
| 6a | Manual submit | ✅ Implemented | — |
| 6b | Auto submit | ✅ Implemented | — |
| 6c | Submission confirmation | ✅ Implemented | — |
| 6d | Resubmission prevention | ❌ **MISSING** | **HIGH** |
| 7a | Correct scoring | ✅ Implemented | — |
| 7b | Unanswered handling | ✅ Implemented | — |
| 7c | Percentage calculation | ✅ Implemented | — |
| 7d | Ranking/leaderboard | ⚠️ No ranking | MEDIUM |
| 8a | Tab switch detection | ✅ Implemented | — |
| 8b | Copy/paste restriction | ❌ **MISSING** | **HIGH** |
| 8c | Full-screen enforcement | ❌ **MISSING** | **MEDIUM** |
| 8d | Focus loss detection | ✅ Implemented | — |
| 9a | Cross-student access block | ✅ Implemented | — |
| 9b | Question ID tampering block | ✅ Implemented | — |
| 9c | Server-side timer validation | ❌ **MISSING** | **HIGH** |
| 10 | Exam-specific load testing | ⚠️ Not individually tested | MEDIUM |
| 11 | E2E workflow | ✅ Verified | — |

---

## CRITICAL FIXES REQUIRED (Before SAFAL Replacement)

### FIX 1: Resubmission Prevention (P0)
**File:** `pg-storage.ts` → `submitExam()`
**Issue:** No check for already-submitted attempt
**Impact:** Student could craft HTTP request to resubmit with different answers

### FIX 2: Server-Side Timer Validation (P0)
**File:** `routes.ts` → `/api/exam/submit` and `/api/exam/save-state`
**Issue:** Client controls timer entirely. DevTools can extend time indefinitely
**Impact:** Student gets unlimited exam time

### FIX 3: Copy/Paste Prevention (P1)
**File:** `exam-engine.tsx`
**Issue:** No restrictions on copy, paste, cut, or right-click
**Impact:** Student can copy questions to external sources

### FIX 4: Fullscreen Enforcement (P1)
**File:** `exam-engine.tsx`
**Issue:** No fullscreen mode or exit detection
**Impact:** Student can freely use other apps during exam

---

## VERDICT

**Can Prashnakosh replace SAFAL today?** Almost.

The core exam flow (start → attempt → resume → submit → score) is production-ready with proper state management and question locking.

**3 blockers must be fixed before production deployment:**
1. Resubmission prevention (server-side guard)
2. Server-side timer validation
3. Copy/paste restrictions

After these fixes: **Yes, Prashnakosh can fully replace SAFAL.**
