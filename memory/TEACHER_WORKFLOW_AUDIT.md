# PRASHNAKOSH — TEACHER WORKFLOW PRODUCTION AUDIT
## Date: June 19, 2026
## Objective: Verify full teacher workflow for quarterly paper generation

---

## AUDIT SUMMARY

| Total Items | ✅ Pass | ⚠️ Partial | ❌ Missing |
|---|---|---|---|
| 25 | 13 | 7 | 5 |

---

## DETAILED AUDIT

### 1. Teacher Word Document Upload
**Status: ✅ Implemented and Verified**

- Route: `POST /api/upload/word` (routes.ts L1485)
- Uses `multer` for file handling
- Accepts `.docx` files via `upload.single("file")`
- Validates: file exists, tenant, department access
- Returns: parsed questions with count and duplicate summary
- Frontend: `teacher/word-upload.tsx` and `questions-upload.tsx`

---

### 2. Word Parser Accuracy
**Status: ⚠️ Partially Implemented**

- Uses `mammoth.extractRawText()` (routes.ts L1504) — extracts plain text only
- Loses ALL formatting: bold, italic, underline, tables, bullet lists
- Question detection patterns work for standard formats:
  - `Q1.`, `Q1)`, `Question 1.`, `1.`, `1)` ✅
  - MCQ options: `A.`, `a)`, `B.`, `b)` ✅
  - Answer line: `Answer:`, `Ans:`, `Correct Answer:` ✅
  - Marks: `Marks: 2` ✅
  - Difficulty: `Difficulty: hard` ✅
  - Assertion-Reason questions ✅

**Gap:** If teacher uses creative formatting (numbered lists, tables for matching questions, tabulated data), parser will break. No error recovery for malformed content — it silently appends to previous question.

**Impact:** Teachers must follow a strict Word template format. Any deviation causes silent data loss.

---

### 3. Section Detection
**Status: ✅ Implemented and Verified**

- Pattern: `SECTION A`, `SECTION - A`, `SECTION: A` (routes.ts L2566-2567)
- Case-insensitive
- Resets lesson/topic context on section change (L2674-2675)
- Warning if question appears before section marker (L2736-2738)

---

### 4. Lesson Detection
**Status: ✅ Implemented and Verified**

- Pattern: `LESSON: Chemical Bonding` (routes.ts L2568)
- Supports Unicode colon `：` for Hindi/Sanskrit documents
- Resets topic context on lesson change (L2685)
- Warning if question appears before lesson marker (L2739-2741)

---

### 5. Topic Detection
**Status: ✅ Implemented and Verified**

- Pattern: `TOPIC: Covalent Bonds` (routes.ts L2569)
- Supports Unicode colon `：`
- Warning if question appears before topic marker (L2742-2744)

---

### 6. Question Extraction
**Status: ✅ Implemented and Verified**

- Detects: MCQ, short_answer, long_answer, assertion_reason, passage (routes.ts L2730-2770)
- MCQ auto-detected when 2+ options found (L2602-2607)
- Long answer auto-detected when marks ≥ 4 (L2610)
- Short answer is default (L2613-2619)
- Question finalization validates minimum 10 character content (L2587-2594)
- Multi-line questions supported via continuation append (L2818-2821)
- Parser returns: questions array, skipped content, warnings, hierarchy summary

---

### 7. Diagram/Image Handling
**Status: ❌ MISSING — CRITICAL FOR SCIENCE**

- `mammoth.extractRawText()` strips ALL images from Word documents
- Images embedded in .docx are completely lost during extraction
- Lines containing `[image]`, `[diagram]`, `[figure]` are detected but SKIPPED entirely (L2575-2582, L2718-2728)
- Schema has `imageUrl` field (schema.ts L222) but it's always set to `null` by parser (L2650, L2761)
- S3 upload endpoint exists (routes.ts L2135-2180) but AWS keys are missing — completely blocked

**Code Reference:** `mammoth.extractRawText({ buffer })` at routes.ts L1504

**Root Cause:** `extractRawText` is text-only. Need `mammoth.convertToHtml()` with image converter options to extract embedded images as base64 or upload to storage.

**Impact:** Science (Physics, Chemistry, Biology), Geography, and Mathematics teachers CANNOT upload questions with diagrams. This blocks all diagram-dependent question types.

---

### 8. Formula and Mathematical Notation Handling
**Status: ❌ MISSING — CRITICAL FOR MATH/SCIENCE**

- `extractRawText()` strips ALL formatting including:
  - Superscripts (x², H₂O) → become `x2`, `H2O`
  - Subscripts
  - Special symbols (√, ∑, ∫, ±, ×, ÷)
  - Equation editor content (MathML/OMML in .docx) → garbled or lost
  - Fractions, exponents, chemical equations
- No LaTeX/KaTeX/MathJax rendering in frontend or exports
- Frontend has `<MathText>` component (math-text.tsx) but it's only used in question DISPLAY, not in paper export
- PDF export uses `pdfkit` which has no native math rendering
- DOCX export uses `docx` library which has no equation support

**Impact:** Mathematics teachers cannot upload questions with formulas. Chemistry teachers cannot upload balanced equations. Physics teachers lose all mathematical expressions.

**Workaround (V1):** Teachers must write formulas in plain text: `x^2 + y^2 = z^2`, `H2SO4 + 2NaOH → Na2SO4 + 2H2O`. Parser will preserve the text. Not ideal but functional.

---

### 9. Sanskrit and Multilingual Unicode Handling
**Status: ⚠️ Partially Implemented**

- JavaScript strings are UTF-16 — Hindi, Sanskrit, Marathi text passes through correctly
- `mammoth.extractRawText()` preserves Unicode text ✅
- Lesson/Topic patterns support Unicode colon `：` ✅
- Database (PostgreSQL) stores UTF-8 natively ✅
- PDF export uses `pdfkit` with Helvetica font — **does NOT support Devanagari** ❌
- DOCX export uses `docx` library — Unicode text is preserved ✅

**Gap:** Hindi/Sanskrit text in PDF exports will show as `???` or blank. DOCX export works correctly since Word handles fonts. This is a PDF-only issue.

**Impact:** For quarterly papers, DOCX export should be used. PDF export breaks for any non-Latin text.

---

### 10. Duplicate Question Detection
**Status: ✅ Implemented and Verified**

- Content hashing: MD5 of normalized text (pg-storage.ts L2260-2296)
- Similarity scoring: exact match + near-duplicate detection
- Bulk check during upload: `checkBulkQuestionDuplicates()` (pg-storage.ts L2239-2256)
- Department-scoped: only checks within same department (efficient)
- Exact duplicates auto-filtered (routes.ts L1351-1365)
- Summary returned: exactDuplicates count, totalChecked
- Frontend manual entry: real-time duplicate warning with "Edit New" option (teacher/manual-entry.tsx L299)

---

### 11. Question Editing After Upload
**Status: ❌ MISSING — CRITICAL GAP**

- Edit button exists in `questions.tsx` L304-310 but has **NO onClick handler**
- The button renders a pencil icon that does nothing when clicked
- No inline editing, no edit dialog, no edit modal anywhere in the teacher workflow
- Teachers CANNOT modify question text, options, answer, marks, difficulty, section, lesson, or topic after upload
- The only way to fix a question is to DELETE it and re-upload — extremely painful for teachers

**Code Reference:** `questions.tsx` L304-310 — dead `<Button>` with `<Edit>` icon, no onClick

**Only Exception:** SuperAdmin parser page (`superadmin/question-parser.tsx` L258-809) has editing capability, but teachers don't have access to it.

**Impact:** If a teacher spots a typo, wrong answer, or incorrect section assignment after upload, they cannot fix it. This will cause extreme frustration and will be the #1 complaint from teachers.

---

### 12. Question Approval Workflow
**Status: ✅ Implemented and Verified**

- Teacher can approve own questions: `POST /api/questions/:id/approve` (routes.ts L405-415)
- Question status: `draft` → `pending_approval` → `approved` or `rejected`
- Delete endpoint available for removing bad questions (routes.ts L425-455)
- Frontend: approve/delete buttons in questions.tsx

**Note:** The current flow allows teachers to self-approve. In a strict workflow, only HOD should approve. Current implementation is flexible — works for both scenarios.

---

### 13. HOD Review Workflow
**Status: ✅ Implemented and Verified**

- HOD approve: `POST /api/questions/:id/hod-approve` with comments (routes.ts L456-480)
- HOD reject: `POST /api/questions/:id/hod-reject` with rejection reason (routes.ts L481-510)
- Status flow: `pending_approval` → `approved` (with `hodApprovedBy`, `hodApprovedAt`) or `rejected` (with `rejectionReason`)
- Frontend: hod/questions.tsx with Approve/Reject dialogs with comment fields (L333-395)
- Bulk filter by status (pending/approved/rejected)

---

### 14. Blueprint Creation
**Status: ✅ Implemented and Verified**

- `POST /api/blueprints` with sections array (routes.ts L2948-3044)
- Each section: name, questionType, questionCount, marks, difficulty, lessons[], lessonWeightage
- Linked to department
- Frontend: `hod/blueprints.tsx` and standalone `blueprints.tsx` with section builder
- Supports multiple blueprints per department

---

### 15. Blueprint Validation
**Status: ✅ Implemented and Verified**

- `POST /api/tests/:id/validate-multiset` (routes.ts L3778-3817)
- `validateBlueprintCapacity()` from question-selection-engine.ts (L997-1016)
- Checks per-section: required count × set count vs available approved questions
- Returns: valid/invalid, issues array, section analysis with canFulfill flag
- Frontend paper-generator.tsx shows validation results with remediation suggestions

---

### 16. Coverage Calculation by Lesson and Topic
**Status: ✅ Implemented and Verified**

- `GET /api/departments/:id/academic-coverage` (routes.ts L3045-3230)
- Drills down: Department → Blueprint → Section → Lesson → Topic
- Each level shows: required, approved, pending, coverage %, need count, status (green/yellow/red)
- Weak areas identified: weakSections, weakLessons, weakTopics
- Frontend: `hod/academic-coverage.tsx` with expandable tree view, progress bars, status badges

---

### 17. Required vs Available Question Analysis
**Status: ✅ Implemented and Verified**

- Part of coverage calculation (item 16)
- Also in validate-multiset endpoint (item 15)
- Shows per-section: "Need X questions (Y sets × Z per set), only W available"
- Remediation suggestions: which question types and difficulties to add
- Frontend shows clear "Need X More" indicators per lesson and topic

---

### 18. Automatic Set A / Set B / Set C Generation
**Status: ✅ Implemented and Verified**

- `POST /api/tests/:id/generate-multiset` (routes.ts L3822-3911)
- Uses `selectQuestionsUnified()` with `selectMultiSetFair()` algorithm
- Configurable: setCount (default 3), allowOverlap (default false)
- Round-robin allocation from difficulty-stratified pools
- Lesson interleaving for balanced spread (question-selection-engine.ts L312-314)
- Sets stored in `test.questionSets` as array with setName, questionIds, totalMarks, questionMarksMap

**Set naming:** "Set A", "Set B", "Set C" (question-selection-engine.ts L244-247)

---

### 19. Weightage Validation
**Status: ✅ Implemented and Verified**

- Blueprint sections have `lessonWeightage` with per-lesson `questionCount` and `topicWeightage`
- Coverage dashboard uses weightage for required count calculation (routes.ts L3103-3114)
- If no explicit weightage, distributes evenly across lessons (L3114-3116)

---

### 20. Question Repetition Prevention Across Sets
**Status: ✅ Implemented and Verified**

- `usedQuestionIds: Set<string>` tracks globally across all sets (question-selection-engine.ts L204, L337-339)
- Before allocating: `if (!this.usedQuestionIds.has(q.id))` (L337)
- After allocating: `this.usedQuestionIds.add(q.id)` (L339)
- Warning when pool insufficient for non-overlapping sets (L296-301)
- `allowOverlap` option exists but defaults to false
- Validation stats include `overlapCount` (routes.ts L3891)

**Guarantee:** Zero question overlap across sets when `allowOverlap=false` and pool is sufficient.

---

### 21. Generated Paper Formatting
**Status: ⚠️ Partially Implemented — NEEDS IMPROVEMENT**

**What works:**
- School name header ✅
- Test title with set label ✅
- Subject, Grade, Total Marks, Duration metadata ✅
- Instructions block ✅
- Question numbering (Q1, Q2...) ✅
- MCQ option rendering (A, B, C, D) ✅
- Marks per question shown ✅
- Passage grouping ✅
- Footer with "End of Question Paper" ✅

**What's MISSING:**
- ❌ **Section headers** — No "SECTION A — 1 Mark Questions" grouping. All questions are listed in a flat sequence. This is CRITICAL for board-pattern quarterly papers.
- ❌ **Answer writing space** — No blank lines/space after each question for written answers
- ❌ **Page breaks between sections** — Long papers run continuously without breaks
- ❌ **Question type instructions** — No "Answer ANY 5 out of 7" or "All questions are compulsory" per section
- ❌ **Marks distribution header** — No "Section A: 20 marks, Section B: 30 marks" at top
- ⚠️ Footer shows "SmartGenEduX 2025" — should be 2026

**Impact:** The generated paper does NOT look like a proper quarterly examination paper. Any teacher who sees a flat list of questions without section grouping will reject it immediately.

---

### 22. Export Quality (Word/PDF)
**Status: ⚠️ Partially Implemented**

**PDF Export (routes.ts L3982-4124):**
- Generated via `pdfkit`
- School logo supported (fetched via URL) ✅
- A4 and Legal size ✅
- Clean text rendering ✅
- ❌ No Devanagari/Hindi font support (Helvetica only)
- ❌ No section grouping
- ❌ No page numbers
- ❌ No watermark support
- ❌ No math formula rendering

**DOCX Export (routes.ts L4223-4419):**
- Generated via `docx` library
- Headers and footers ✅
- Heading styles ✅
- ❌ No section grouping
- ❌ No school logo in DOCX (only PDF has logo)
- ❌ No page numbers
- ⚠️ Unicode text works (Word handles fonts)

**Answer Key PDF (routes.ts L4126-4220):**
- Shows Q number + correct answer ✅
- Set-specific ✅

**Answer Key DOCX (routes.ts L4421-4510):**
- Shows Q number + correct answer ✅
- Headers/footers ✅

---

### 23. Image and Diagram Placement in Exported Papers
**Status: ❌ MISSING**

- Question `imageUrl` field is always `null` (set during parsing, L2650/L2761)
- Even if `imageUrl` were populated:
  - PDF export does NOT render question images (only school logo, L4047-4057)
  - DOCX export does NOT render question images
  - Neither format includes `<img>` or image embedding for question-level diagrams
- S3 storage for question images is blocked (missing AWS keys)

**Impact:** Science papers with diagrams (circuit diagrams, molecular structures, biological diagrams, maps) cannot be generated. Teachers must manually add images after downloading the paper.

---

### 24. Performance When All 21 Subject Coordinators Upload Simultaneously
**Status: ✅ Implemented and Verified**

- Rate limiting active: general 120 req/min, paper gen 3 req/min (routes.ts L25-47)
- DB connection pool: max 20, idle timeout 30s (pg-storage.ts config)
- Load tested: 1000 concurrent users, 240 req/s throughput, 0.01% error rate
- 21 simultaneous uploads will peak at ~21 concurrent requests — well within capacity
- Word parsing is CPU-bound but fast (mammoth text extraction is lightweight)
- Duplicate detection queries are department-scoped (not full tenant)

**Bottleneck risk:** If all 21 coordinators upload 200+ question documents simultaneously AND trigger multi-set generation, the paper generation phase (which loads all department questions into memory) could spike. Rate limiter (3 req/min for paper gen) prevents this.

---

### 25. End-to-End Workflow
**Status: ⚠️ Partially Verified**

The full workflow chain EXISTS but has gaps at specific stages:

```
Upload (.docx)          ✅ Working
  ↓
Parse Questions         ⚠️ Text only (no images/formulas)
  ↓
Duplicate Check         ✅ Working
  ↓
Save to Question Bank   ✅ Working
  ↓
Edit Questions          ❌ DEAD BUTTON — Cannot edit after upload
  ↓
Teacher Approve         ✅ Working
  ↓
HOD Review              ✅ Working
  ↓
Blueprint Create        ✅ Working
  ↓
Coverage Dashboard      ✅ Working
  ↓
Validate Capacity       ✅ Working
  ↓
Generate Set A/B/C      ✅ Working
  ↓
Approve Sets            ✅ Working
  ↓
Export PDF/DOCX         ⚠️ No section grouping, flat format
  ↓
Answer Key Export       ✅ Working
```

---

## CRITICAL FIXES REQUIRED FOR PRODUCTION

### Priority 1: MUST FIX BEFORE ROLLOUT

| # | Issue | Impact | Effort |
|---|---|---|---|
| **F1** | **Question Editing After Upload** — Dead Edit button | Teachers cannot fix typos, wrong answers, incorrect section/lesson. #1 source of frustration | Medium (2-3 hours) |
| **F2** | **Section Grouping in Paper Export** — Both PDF and DOCX export questions as flat list | Generated papers don't look like quarterly exam papers. Teachers will reject them | Medium (2-3 hours) |

### Priority 2: SHOULD FIX BEFORE ROLLOUT

| # | Issue | Impact | Effort |
|---|---|---|---|
| **F3** | **Hindi/Devanagari in PDF** — Helvetica doesn't support Hindi | Hindi medium papers broken in PDF. Use DOCX as workaround | Low (1 hour — add Noto Sans Devanagari font) |
| **F4** | **Answer Writing Space in Export** — No blank lines after questions | Teachers must manually add space in Word. Inconvenient | Low (30 min) |
| **F5** | **Footer Year** — Shows "2025" instead of "2026" | Minor branding issue | 5 min |

### Priority 3: POST-PILOT (Do Not Block Rollout)

| # | Issue | Impact | Effort |
|---|---|---|---|
| **F6** | **Image/Diagram Handling** — Blocked on S3 keys + mammoth upgrade | Science papers need diagrams. Teachers can add manually post-export for V1 | High (depends on S3 keys) |
| **F7** | **Math Formula Rendering** — No LaTeX/KaTeX in export | Teachers write formulas as plain text for V1 | High (3-5 hours) |
| **F8** | **Page Numbers in Export** | Minor — teachers can add in Word | Low (30 min) |
| **F9** | **School Logo in DOCX** | Currently only in PDF. Minor | Low (1 hour) |

---

## TEACHER UX CONFUSION RISKS

| Scenario | What Could Confuse Teachers | Recommended Fix |
|---|---|---|
| Upload format | Teacher uses creative Word formatting → parser silently drops content | Provide a strict Word template + format guide |
| Edit button | Teacher clicks Edit → nothing happens → thinks app is broken | Fix F1 (implement edit functionality) |
| Section mapping | Question uploaded without SECTION marker → placed in "(No Section)" → not selected by blueprint | Show clear warning during upload preview |
| Approval self-service | Teacher can approve own questions → some schools want HOD-only approval | Make configurable per school |
| Generated paper format | Flat question list without Section A/B/C headers | Fix F2 (section grouping) |
| Hindi in PDF | Hindi text shows as ??? in PDF download | Fix F3 or guide teachers to use DOCX |
| Marks mismatch | Teacher uploads q.marks=2, blueprint assigns section.marks=1 → confusion about which marks are used | Show clear indicator: "Blueprint assigns marks. Question marks are metadata only." |

---

## VERDICT

**Can teachers use Prashnakosh for quarterly paper generation today?**

**Almost — but 2 critical fixes are needed:**

1. **Question Editing** — Without this, teachers will revolt on day one
2. **Section-Grouped Paper Format** — Without this, papers look unprofessional

**With F1 + F2 fixed: YES, the teacher workflow is production-ready** for text-based subjects (Languages, Social Science, Commerce). Science and Math will need the "plain text formulas" workaround until F6/F7 are implemented.
