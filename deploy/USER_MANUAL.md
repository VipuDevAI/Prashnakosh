# PRASHNAKOSH — User Manual
**Version**: 1.0 | **For**: Testing Engineers & Staff Training

---

## Quick Reference

| Role | Login School Code | Default Password | First Action After Login |
|------|-------------------|------------------|--------------------------|
| Super Admin | `SUPERADMIN` | *(set during deployment)* | Create a School |
| Admin | *(school code)* | `changeme123` | Create Departments & Users |
| HOD | *(school code)* | `changeme123` | Review Questions & Create Blueprints |
| Teacher | *(school code)* | `changeme123` | Upload Question Bank |
| Student | *(school code)* | `changeme123` | Take Mock Tests |

**Login URL**: `https://<server-ip>` (e.g., `https://192.168.1.100`)

All users need three fields to log in: **School Code** + **Email** + **Password**

---

# PART 1 — SUPER ADMIN MANUAL

The Super Admin manages the entire Prashnakosh platform. They create schools, assign admins, and configure storage.

## Step 1: Login

1. Open the application URL in a browser
2. Enter:
   - School Code: `SUPERADMIN`
   - Email: *(configured during deployment)*
   - Password: *(configured during deployment)*
3. Click **Sign In**
4. You will land on the **Super Admin Dashboard**

## Step 2: Create a School

1. Click **Schools** in the sidebar (or the Schools card on the dashboard)
2. Click **+ Add School**
3. Fill in:
   - **School Name**: e.g., `Maharishi Vidya Mandir Chhindwara`
   - **School Code**: e.g., `MVMCHN` (this is what all staff/students of this school will enter on the login screen)
   - **Address** (optional)
   - **Contact** (optional)
4. Click **Save**
5. The school now appears in the schools table

> **Important**: The School Code is permanent. Choose it carefully (short, uppercase, unique per school).

## Step 3: Create an Admin for the School

1. Click **Users** in the sidebar
2. Select the school from the dropdown at the top
3. Click **+ Add User**
4. Fill in:
   - **Name**: e.g., `School Admin`
   - **Email**: e.g., `admin@mvmchn.edu`
   - **Role**: Select **admin**
5. Click **Save**
6. The user is created with default password **`changeme123`**

> Share the School Code + Email + default password with the School Admin. They should change their password on first login.

## Step 4: Configure Storage (Optional)

1. Click **Storage** in the sidebar
2. Select the school from the table
3. Set the **Storage Path** (subfolder name for this school, e.g., `mvmchn`)
4. Set **Max Storage** (e.g., 5 GB)
5. Click **Save**

## Super Admin — Sidebar Menu Reference

| Menu Item | What It Does |
|-----------|-------------|
| Dashboard | Overview with quick-access cards to all sections |
| Schools | Create, view, and manage schools |
| Users | Create and manage users for any school |
| Storage | Configure local storage allocation per school |
| Reference Materials | Upload global reference documents (syllabi, guides) |
| Question Parser | Test DOCX parsing without uploading to a department |

---

# PART 2 — HOD (HEAD OF DEPARTMENT) MANUAL

The HOD manages one department (e.g., Class IX Science). They review questions uploaded by teachers, create blueprints, and generate test papers.

## Step 1: Login

1. Open the application URL
2. Enter:
   - School Code: e.g., `MVMCHN`
   - Email: *(provided by Admin)*
   - Password: `changeme123` (change it after first login)
3. Click **Sign In**
4. You will land on the **Dashboard**

## Step 2: Review the Question Bank

1. Click **Questions** in the sidebar
2. You will see all questions uploaded by teachers in your department
3. Use the filters at the top:
   - **Section** (A, B, C, D, E) — sections represent question types (MCQ, Short Answer, Long Answer, etc.)
   - **Lesson** — filter by lesson/chapter
   - **Topic** — filter by specific topic
   - **Status** — filter by Pending / Approved / Rejected
4. For each question you can:
   - Click to **view** full content
   - Click **Edit** (pencil icon) to modify the question text, marks, or section
   - Click **Approve** to mark it as approved for paper generation
   - Click **Reject** to send it back to the teacher

> **Note**: Only **Approved** questions are used when generating test papers.

## Step 3: Create a Blueprint

A blueprint defines the structure of a test paper — how many questions per section, marks distribution, etc.

1. Click **Blueprints** in the sidebar
2. Click **+ Create Blueprint**
3. Fill in:
   - **Blueprint Name**: e.g., `Quarterly Exam - IX Science`
   - **Total Marks**: e.g., `80`
4. For each **Section** (A, B, C, D, E), configure:
   - **Number of Questions**: How many questions to pick
   - **Marks per Question**: e.g., Section A = 1 mark each, Section D = 5 marks each
5. Click **Save Blueprint**

> The total marks of all sections must add up to the Total Marks.

### Standard Section Reference (Typical School Pattern)

| Section | Question Type | Marks/Question | Typical Count |
|---------|--------------|----------------|---------------|
| A | MCQ / Objective | 1 | 10-20 |
| B | Fill in the Blanks / True-False | 1-2 | 5-10 |
| C | Short Answer (3-4 lines) | 2-3 | 5-8 |
| D | Long Answer (8-10 lines) | 5 | 3-5 |
| E | Very Long / Essay / HOTS | 5-10 | 1-3 |

## Step 4: Generate a Test Paper

1. Click **Paper Gen** in the sidebar
2. Select a **Blueprint** from the dropdown
3. Click **Generate Paper**
4. The system automatically:
   - Picks questions from the approved question bank
   - Matches section-wise marks distribution from the blueprint
   - Avoids repeating questions from recent papers
5. **Review** the generated paper on screen
6. Download:
   - Click **Download DOCX** for an editable Word document
   - Click **Download PDF** for a print-ready PDF
7. The exported paper has:
   - School header
   - Section-wise grouping (Section A, Section B, etc.)
   - Marks printed next to each question
   - Total marks summary

## Step 5: View Academic Coverage

1. Click **Coverage** in the sidebar
2. See a visual breakdown of how many questions exist per lesson/topic
3. Identify gaps — topics with few or no questions

## Step 6: View Analytics

1. Click **Analytics** in the sidebar
2. See:
   - Total questions by section
   - Approval rates
   - Teacher contribution statistics
   - Question bank growth over time

## HOD — Sidebar Menu Reference

| Menu Item | What It Does |
|-----------|-------------|
| Dashboard | Department overview and quick stats |
| Questions | Review, approve, reject, and edit questions |
| Blueprints | Create and manage paper structure templates |
| Upload | Upload question banks (DOCX) directly |
| Coverage | See topic-wise question coverage gaps |
| Paper Gen | Generate test papers from blueprints |
| Mock Tests | Create and manage online mock tests for students |
| Analytics | Charts and statistics about the question bank |

---

# PART 3 — TEACHER MANUAL

Teachers upload questions to the department's question bank. The HOD reviews and approves them.

## Step 1: Login

1. Open the application URL
2. Enter:
   - School Code: e.g., `MVMCHN`
   - Email: *(provided by Admin)*
   - Password: `changeme123` (change it after first login)
3. Click **Sign In**

## Step 2: Upload a Question Bank (DOCX)

This is the primary way to add questions in bulk.

1. Click **Upload** in the sidebar
2. Click **Upload Word File** tab (or navigate to the upload page)
3. Click **Choose File** and select a `.docx` Word document
4. The system parses the document and extracts questions
5. Review the extracted questions in the preview table
6. Verify:
   - Each question has the correct **Section** (A/B/C/D/E)
   - Each question has the correct **Marks**
   - The **Lesson** and **Topic** are assigned
7. Click **Submit** to upload all questions to the department bank

### DOCX Format Guide

The Word document should follow this structure:

```
Section A - MCQ (1 mark each)

1. What is the SI unit of force?
   a) Joule
   b) Newton
   c) Watt
   d) Pascal

2. Which organ pumps blood in the human body?
   a) Liver
   b) Brain
   c) Heart
   d) Kidney

Section B - Short Answer (2 marks each)

1. Define photosynthesis.

2. What is Ohm's law? Write the formula.

Section C - Long Answer (5 marks each)

1. Explain the structure of an atom with a diagram.

2. Describe the water cycle in detail.
```

**Tips for best parsing results**:
- Start each section with "Section A", "Section B", etc.
- Include marks in the section header (e.g., "2 marks each")
- Number questions sequentially within each section
- For MCQs, use a), b), c), d) for options
- Keep one blank line between questions

## Step 3: Edit Questions After Upload

If you spot an error in an uploaded question:

1. Click **Questions** (or go to **Upload** → view your questions)
2. Find the question you want to edit
3. Click the **Edit** (pencil) icon
4. In the dialog, modify:
   - Question text
   - Section (A/B/C/D/E)
   - Marks
   - Lesson
   - Topic
5. Click **Save**

> Edited questions will need re-approval from the HOD if they were previously approved.

## Step 4: View Your Questions

1. Click **Questions** in the sidebar
2. See all questions you have uploaded
3. Check the **Status** column:
   - **Pending** — waiting for HOD review
   - **Approved** — will be used in paper generation
   - **Rejected** — HOD has sent it back (check comments and re-upload)

## Teacher — Sidebar Menu Reference

| Menu Item | What It Does |
|-----------|-------------|
| Dashboard | Personal stats and recent activity |
| Upload | Upload question bank (DOCX file) |
| Mock Tests | View assigned mock tests |

---

# PART 4 — COMMON WORKFLOWS

## Changing Your Password

1. Click your **profile icon** (top-right corner)
2. Select **Change Password**
3. Enter your current password
4. Enter and confirm a new password (minimum 6 characters)
5. Click **Save**

## The Complete Testing Workflow (End-to-End)

Here is the full sequence for generating a test paper:

```
Super Admin                 Admin                   Teacher              HOD
    │                         │                        │                   │
    ├─ Create School          │                        │                   │
    ├─ Create Admin ─────────►│                        │                   │
    │                         ├─ Create Department     │                   │
    │                         ├─ Create HOD ──────────────────────────────►│
    │                         ├─ Create Teacher ──────►│                   │
    │                         │                        │                   │
    │                         │                        ├─ Upload DOCX      │
    │                         │                        ├─ Questions sent──►│
    │                         │                        │                   ├─ Review Questions
    │                         │                        │                   ├─ Approve / Reject
    │                         │                        │                   ├─ Create Blueprint
    │                         │                        │                   ├─ Generate Paper
    │                         │                        │                   ├─ Download DOCX/PDF
    │                         │                        │                   │
    │                         │                        │              PAPER READY
```

## Testing Meeting Checklist

Use this checklist during a testing session:

### Pre-Meeting Setup (Super Admin)
- [ ] Login as Super Admin
- [ ] Create a test school (e.g., code: `TESTSCH`)
- [ ] Create an Admin user for the test school
- [ ] Share the School Code + Admin credentials with the team

### Admin Setup (5 minutes)
- [ ] Login as Admin with School Code `TESTSCH`
- [ ] Go to **Departments** → Create a department (e.g., `IX Science`)
- [ ] Go to **Users** → Create an HOD (select the department)
- [ ] Go to **Users** → Create a Teacher (select the department)
- [ ] Share HOD and Teacher credentials with the team

### Teacher Flow (10 minutes)
- [ ] Login as Teacher
- [ ] Go to **Upload** → Upload a prepared DOCX file
- [ ] Verify questions appear in the preview
- [ ] Submit the questions
- [ ] Verify question count in the dashboard

### HOD Flow (15 minutes)
- [ ] Login as HOD
- [ ] Go to **Questions** → See uploaded questions with status "Pending"
- [ ] Approve at least 20-30 questions across sections A, B, C, D
- [ ] Go to **Blueprints** → Create a blueprint (e.g., 40 marks)
- [ ] Go to **Paper Gen** → Select the blueprint → Generate Paper
- [ ] Download **DOCX** → Open in Word → Verify section-wise layout
- [ ] Download **PDF** → Open → Verify formatting
- [ ] Verify marks distribution matches the blueprint

### Verification Points
- [ ] Login works for all roles (Super Admin, Admin, HOD, Teacher)
- [ ] Question upload parses DOCX correctly
- [ ] HOD can approve/reject questions
- [ ] Blueprint saves correctly
- [ ] Paper generation picks correct number of questions per section
- [ ] DOCX export opens in Microsoft Word
- [ ] PDF export opens in any PDF reader
- [ ] Sidebar navigation works for each role
- [ ] Logout and re-login works

---

# APPENDIX

## Default Credentials

| Role | Default Password | Notes |
|------|-----------------|-------|
| Super Admin | *(set in .env during deployment)* | Cannot be reset from UI |
| All other users | `changeme123` | Must be changed after first login |

## Role Permissions Matrix

| Action | Super Admin | Admin | HOD | Teacher | Student |
|--------|:-----------:|:-----:|:---:|:-------:|:-------:|
| Create Schools | Yes | - | - | - | - |
| Create Users | Yes | Yes | - | - | - |
| Create Departments | Yes | Yes | - | - | - |
| Upload Questions | Yes | Yes | Yes | Yes | - |
| Approve Questions | Yes | Yes | Yes | - | - |
| Create Blueprints | Yes | Yes | Yes | - | - |
| Generate Papers | Yes | Yes | Yes | - | - |
| Download DOCX/PDF | Yes | Yes | Yes | - | - |
| Take Mock Tests | - | - | - | - | Yes |
| View Analytics | Yes | Yes | Yes | - | - |
| Configure Storage | Yes | - | - | - | - |

## Section-Marks Reference

| Section | Typical Use | Marks Range |
|---------|------------|-------------|
| A | MCQ, Objective, True/False | 1 mark |
| B | Fill in Blanks, Very Short Answer | 1-2 marks |
| C | Short Answer | 2-3 marks |
| D | Long Answer | 3-5 marks |
| E | Essay, HOTS, Diagram-based | 5-10 marks |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid credentials" | Check School Code (case-sensitive), Email, and Password |
| Blank page after login | Clear browser cache and refresh |
| Questions not showing | Check if you're in the correct department; check filters |
| Paper generation fails | Ensure enough approved questions exist for the blueprint |
| DOCX not parsing | Use `.docx` format (not `.doc`). Follow the format guide above |
| Password forgotten | Ask Admin to reset it (Users page → Reset Password) |

---

**Document Version**: 1.0
**Prepared For**: Testing Engineers & Staff Training
**Last Updated**: July 2026
