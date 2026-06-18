#!/usr/bin/env python3
"""Tests the Word parser's SECTION/LESSON/TOPIC hierarchy detection using the preview API."""
import requests, json, sys, os, io

API_URL = os.environ.get("API_URL", "https://paper-gen-3.preview.emergentagent.com")

# We create .docx files programmatically using python-docx
try:
    from docx import Document as DocxDocument
except ImportError:
    os.system("pip install python-docx -q")
    from docx import Document as DocxDocument

def login(school_code, email, password):
    r = requests.post(f"{API_URL}/api/auth/login", json={"schoolCode": school_code, "email": email, "password": password})
    r.raise_for_status()
    return r.json()["token"]

def create_docx(text_content: str) -> bytes:
    """Create a .docx file from plain text content."""
    doc = DocxDocument()
    for line in text_content.split("\n"):
        doc.add_paragraph(line)
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()

def upload_preview(token: str, docx_bytes: bytes, subject: str, grade: str, filename: str = "test.docx"):
    """Upload a .docx file and get the parsed preview."""
    r = requests.post(
        f"{API_URL}/api/teacher/upload/word/preview",
        files={"file": (filename, docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"subject": subject, "grade": grade, "departmentId": ""},
        headers={"Authorization": f"Bearer {token}"},
    )
    return r.json()

# =====================================================
# TEST 1: SCIENCE TEMPLATE
# =====================================================
SCIENCE_TEMPLATE = """SECTION A

LESSON: Life Processes

TOPIC: Nutrition

Q1. What is the role of HCl in the stomach?
A. Kills bacteria
B. Digests proteins
C. Both A and B
D. None of these
Answer: C
Marks: 1

Q2. Name the enzyme that digests starch in the mouth.
Answer: Salivary amylase
Marks: 2

TOPIC: Respiration

Q3. What is the net gain of ATP in glycolysis?
A. 2 ATP
B. 4 ATP
C. 36 ATP
D. 38 ATP
Answer: A
Marks: 1

Q4. Differentiate between aerobic and anaerobic respiration.
Marks: 3

LESSON: Motion

TOPIC: Distance and Displacement

Q5. A body moves 3m East and 4m North. Find displacement.
Marks: 2

Q6. Define uniform motion with an example.
Marks: 2

SECTION B

LESSON: Metals and Non-Metals

TOPIC: Reactivity Series

Q7. Why is sodium stored under kerosene?
Marks: 2

Q8. Arrange the following in order of reactivity: Fe, Au, Na, Cu
Marks: 1
"""

# =====================================================
# TEST 2: ENGLISH TEMPLATE (with passage)
# =====================================================
ENGLISH_TEMPLATE = """SECTION A

LESSON: Reading Comprehension

TOPIC: Unseen Passage

Read the following passage

The sun was setting behind the mountains, casting long shadows across the valley. A gentle breeze carried the scent of pine trees. Birds were returning to their nests, filling the air with their evening songs.

Q1. What time of day is described in the passage?
A. Morning
B. Afternoon
C. Evening
D. Night
Answer: C
Marks: 1

Q2. What scent did the breeze carry?
Answer: Pine trees
Marks: 1

TOPIC: Grammar

Q3. Identify the type of sentence: "What a beautiful day it is!"
A. Declarative
B. Interrogative
C. Exclamatory
D. Imperative
Answer: C
Marks: 1

SECTION B

LESSON: Writing Skills

TOPIC: Letter Writing

Q4. Write a letter to the editor of a newspaper about the need for cleanliness in your locality.
Marks: 5

Q5. Write a paragraph on "The Importance of Reading" in about 100 words.
Marks: 3
"""

# =====================================================
# TEST 3: SANSKRIT TEMPLATE (Unicode)
# =====================================================
SANSKRIT_TEMPLATE = """SECTION A

LESSON: रामायणम्

TOPIC: अयोध्याकाण्डम्

Q1. रामः कस्य पुत्रः आसीत्?
A. दशरथस्य
B. रावणस्य
C. जनकस्य
D. विश्वामित्रस्य
Answer: A
Marks: 1

Q2. रामस्य वनवासस्य अवधिः कति वर्षाणि?
Answer: चतुर्दश वर्षाणि
Marks: 2

TOPIC: शब्दकोशः

Q3. 'गच्छति' इति क्रियापदस्य धातुः कः?
A. गम्
B. चल्
C. पठ्
D. लिख्
Answer: A
Marks: 1

SECTION B

LESSON: व्याकरणम्

TOPIC: सन्धिः

Q4. 'देवालयः' इति पदस्य सन्धिविच्छेदं कुरुत।
Marks: 2

Q5. 'गुणसन्धिः' इत्यस्य उदाहरणत्रयं लिखत।
Marks: 3
"""

print("=" * 60)
print("WORD PARSER HIERARCHY TEST")
print("=" * 60)

# Login
token = login("MVMCHN", "teacher.science@mvm.com", "Teacher@123")
print(f"\nLogged in as teacher. Token: {token[:30]}...\n")

# === TEST 1: Science ===
print("=" * 40)
print("TEST 1: Science Template")
print("=" * 40)
docx = create_docx(SCIENCE_TEMPLATE)
result = upload_preview(token, docx, "Science", "9", "science_test.docx")

if result.get("success"):
    preview = result["preview"]
    print(f"  Total parsed: {preview['totalParsed']}")
    print(f"  Warnings: {len(preview['warnings'])}")
    
    # Check hierarchy
    print("\n  HIERARCHY SUMMARY:")
    for h in preview.get("hierarchySummary", []):
        print(f"    Section {h['section']} | {h['lesson']} | {h['topic']} = {h['count']} questions")
    
    # Verify section/lesson/topic on each question
    print("\n  QUESTION DETAILS:")
    for q in preview["questions"]:
        print(f"    Q{q['index']}: Section={q.get('section','')} | Lesson={q.get('lesson','')} | Topic={q.get('topic','')} | Type={q['type']}")
    
    # Validate
    errors = []
    q5 = preview["questions"][4] if len(preview["questions"]) > 4 else None
    q6 = preview["questions"][5] if len(preview["questions"]) > 5 else None
    q7 = preview["questions"][6] if len(preview["questions"]) > 6 else None
    
    if q5 and q5.get("lesson") != "Motion":
        errors.append(f"Q5 lesson should be 'Motion', got '{q5.get('lesson')}'")
    if q5 and q5.get("topic") != "Distance and Displacement":
        errors.append(f"Q5 topic should be 'Distance and Displacement', got '{q5.get('topic')}'")
    if q7 and q7.get("section") != "B":
        errors.append(f"Q7 section should be 'B', got '{q7.get('section')}'")
    if q7 and q7.get("lesson") != "Metals and Non-Metals":
        errors.append(f"Q7 lesson should be 'Metals and Non-Metals', got '{q7.get('lesson')}'")
    
    if errors:
        print(f"\n  FAILURES: {errors}")
    else:
        print("\n  PASS: All hierarchy context switches verified!")
else:
    print(f"  FAILED: {result.get('error', result)}")

# === TEST 2: English (with passage) ===
print("\n" + "=" * 40)
print("TEST 2: English Template (with Passage)")
print("=" * 40)
docx = create_docx(ENGLISH_TEMPLATE)
result = upload_preview(token, docx, "English", "10", "english_test.docx")

if result.get("success"):
    preview = result["preview"]
    print(f"  Total parsed: {preview['totalParsed']}")
    print(f"  Warnings: {len(preview['warnings'])}")
    
    print("\n  HIERARCHY SUMMARY:")
    for h in preview.get("hierarchySummary", []):
        print(f"    Section {h['section']} | {h['lesson']} | {h['topic']} = {h['count']} questions")
    
    print("\n  QUESTION DETAILS:")
    for q in preview["questions"]:
        print(f"    Q{q['index']}: Section={q.get('section','')} | Lesson={q.get('lesson','')} | Topic={q.get('topic','')} | Type={q['type']}")
    
    # Check passage was not silently dropped
    passage_q = [q for q in preview["questions"] if q.get("type") == "passage"]
    if passage_q:
        print(f"\n  PASS: Passage detected and stored ({len(passage_q)} passage blocks)")
    else:
        print("\n  INFO: No passage blocks stored (questions after passage should still parse)")
    
    # Verify writing section
    q4 = next((q for q in preview["questions"] if "letter to the editor" in q.get("content","").lower()), None)
    if q4 and q4.get("section") == "B" and q4.get("lesson") == "Writing Skills":
        print("  PASS: Q4 correctly in Section B / Writing Skills")
    elif q4:
        print(f"  WARN: Q4 section={q4.get('section')} lesson={q4.get('lesson')}")
else:
    print(f"  FAILED: {result.get('error', result)}")

# === TEST 3: Sanskrit (Unicode) ===
print("\n" + "=" * 40)
print("TEST 3: Sanskrit Template (Unicode)")
print("=" * 40)
docx = create_docx(SANSKRIT_TEMPLATE)
result = upload_preview(token, docx, "Sanskrit", "9", "sanskrit_test.docx")

if result.get("success"):
    preview = result["preview"]
    print(f"  Total parsed: {preview['totalParsed']}")
    print(f"  Warnings: {len(preview['warnings'])}")
    
    print("\n  HIERARCHY SUMMARY:")
    for h in preview.get("hierarchySummary", []):
        print(f"    Section {h['section']} | {h['lesson']} | {h['topic']} = {h['count']} questions")
    
    print("\n  QUESTION DETAILS:")
    for q in preview["questions"]:
        print(f"    Q{q['index']}: Section={q.get('section','')} | Lesson={q.get('lesson','')} | Topic={q.get('topic','')} | Type={q['type']}")
    
    # Verify Unicode parsing
    q1 = preview["questions"][0] if preview["questions"] else None
    if q1 and q1.get("lesson") == "रामायणम्":
        print(f"\n  PASS: Sanskrit LESSON detected: '{q1.get('lesson')}'")
    elif q1:
        print(f"\n  FAIL: Expected lesson 'रामायणम्', got '{q1.get('lesson')}'")
    
    q3 = preview["questions"][2] if len(preview["questions"]) > 2 else None
    if q3 and q3.get("topic") == "शब्दकोशः":
        print(f"  PASS: Sanskrit TOPIC detected: '{q3.get('topic')}'")
    elif q3:
        print(f"  FAIL: Expected topic 'शब्दकोशः', got '{q3.get('topic')}'")
    
    q4 = preview["questions"][3] if len(preview["questions"]) > 3 else None
    if q4 and q4.get("section") == "B" and q4.get("lesson") == "व्याकरणम्":
        print(f"  PASS: Section B / व्याकरणम् detected correctly")
    elif q4:
        print(f"  FAIL: Q4 section={q4.get('section')} lesson={q4.get('lesson')}")
else:
    print(f"  FAILED: {result.get('error', result)}")

# === TEST 4: Validation warnings ===
print("\n" + "=" * 40)
print("TEST 4: Validation - Questions without context")
print("=" * 40)
NO_CONTEXT = """Q1. This question has no section, lesson, or topic.
A. Option A
B. Option B
Answer: A
Marks: 1

SECTION A

Q2. This question has section but no lesson or topic.
Marks: 2

LESSON: Life Processes

Q3. This question has section and lesson but no topic.
Marks: 1
"""
docx = create_docx(NO_CONTEXT)
result = upload_preview(token, docx, "Science", "9", "no_context.docx")

if result.get("success"):
    preview = result["preview"]
    print(f"  Total parsed: {preview['totalParsed']}")
    print(f"  Warnings: {len(preview['warnings'])}")
    for w in preview["warnings"]:
        print(f"    - {w}")
    
    # Check that all 3 validation warnings are present
    section_warnings = [w for w in preview["warnings"] if "SECTION" in w]
    lesson_warnings = [w for w in preview["warnings"] if "LESSON" in w]
    topic_warnings = [w for w in preview["warnings"] if "TOPIC" in w]
    
    if section_warnings:
        print(f"\n  PASS: Section missing warning detected ({len(section_warnings)})")
    else:
        print(f"\n  FAIL: Expected 'before SECTION' warning")
    
    if lesson_warnings:
        print(f"  PASS: Lesson missing warning detected ({len(lesson_warnings)})")
    else:
        print(f"  FAIL: Expected 'before LESSON' warning")
    
    if topic_warnings:
        print(f"  PASS: Topic missing warning detected ({len(topic_warnings)})")
    else:
        print(f"  FAIL: Expected 'before TOPIC' warning")
else:
    print(f"  FAILED: {result.get('error', result)}")

print("\n" + "=" * 60)
print("ALL PARSER TESTS COMPLETE")
print("=" * 60)
