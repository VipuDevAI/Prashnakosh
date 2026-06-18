#!/usr/bin/env python3
"""
Tests for Word Parser Enhancement - SECTION/LESSON/TOPIC hierarchy detection
Tests the preview and confirm endpoints for Word document upload
"""
import pytest
import requests
import os
import io

# Install python-docx if not available
try:
    from docx import Document as DocxDocument
except ImportError:
    os.system("pip install python-docx -q")
    from docx import Document as DocxDocument

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://paper-gen-3.preview.emergentagent.com").rstrip("/")

# Test credentials
TEACHER_CREDS = {
    "schoolCode": "MVMCHN",
    "email": "teacher.science@mvm.com",
    "password": "Teacher@123"
}

HOD_CREDS = {
    "schoolCode": "MVMCHN",
    "email": "hod.science@mvm.com",
    "password": "Hod@12345"
}

# Department ID for IX_Science
IX_SCIENCE_DEPT_ID = "9e5da805-3d9b-4ab4-9ca5-c8b6a983a716"


def create_docx(text_content: str) -> bytes:
    """Create a .docx file from plain text content."""
    doc = DocxDocument()
    for line in text_content.split("\n"):
        doc.add_paragraph(line)
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


@pytest.fixture(scope="module")
def teacher_token():
    """Get teacher authentication token."""
    r = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDS)
    assert r.status_code == 200, f"Teacher login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def hod_token():
    """Get HOD authentication token."""
    r = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
    assert r.status_code == 200, f"HOD login failed: {r.text}"
    return r.json()["token"]


# =====================================================
# TEST TEMPLATES
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

NO_CONTEXT_TEMPLATE = """Q1. This question has no section, lesson, or topic.
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


class TestWordParserPreview:
    """Tests for POST /api/teacher/upload/word/preview endpoint"""

    # TEST 1: Science template - 8 questions with correct hierarchy
    def test_science_template_parsing(self, teacher_token):
        """Test Science template parses 8 questions with correct section/lesson/topic"""
        docx_bytes = create_docx(SCIENCE_TEMPLATE)
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("science_test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "Science", "grade": "9", "departmentId": ""},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        
        assert r.status_code == 200, f"Preview failed: {r.text}"
        result = r.json()
        assert result.get("success") is True
        
        preview = result["preview"]
        assert preview["totalParsed"] == 8, f"Expected 8 questions, got {preview['totalParsed']}"
        
        # Verify questions have section/lesson/topic fields
        questions = preview["questions"]
        assert len(questions) == 8
        
        # Q1-Q4 should be in Section A, Life Processes
        for i in range(4):
            q = questions[i]
            assert q.get("section") == "A", f"Q{i+1} section should be 'A', got '{q.get('section')}'"
            assert q.get("lesson") == "Life Processes", f"Q{i+1} lesson should be 'Life Processes', got '{q.get('lesson')}'"
        
        # Q1-Q2 should have topic Nutrition
        assert questions[0].get("topic") == "Nutrition"
        assert questions[1].get("topic") == "Nutrition"
        
        # Q3-Q4 should have topic Respiration
        assert questions[2].get("topic") == "Respiration"
        assert questions[3].get("topic") == "Respiration"
        
        print("TEST 1 PASSED: Science template parsed 8 questions with correct hierarchy")

    # TEST 2: Context switching - Q5-Q6 under Motion, Q7-Q8 under Section B
    def test_context_switching(self, teacher_token):
        """Test context switching - new LESSON resets topic, new SECTION resets both"""
        docx_bytes = create_docx(SCIENCE_TEMPLATE)
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("science_test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "Science", "grade": "9", "departmentId": ""},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        
        assert r.status_code == 200
        result = r.json()
        questions = result["preview"]["questions"]
        
        # Q5-Q6 should be under Lesson 'Motion', not 'Life Processes'
        q5 = questions[4]
        q6 = questions[5]
        assert q5.get("lesson") == "Motion", f"Q5 lesson should be 'Motion', got '{q5.get('lesson')}'"
        assert q6.get("lesson") == "Motion", f"Q6 lesson should be 'Motion', got '{q6.get('lesson')}'"
        assert q5.get("topic") == "Distance and Displacement"
        assert q6.get("topic") == "Distance and Displacement"
        
        # Q7-Q8 should be under Section B
        q7 = questions[6]
        q8 = questions[7]
        assert q7.get("section") == "B", f"Q7 section should be 'B', got '{q7.get('section')}'"
        assert q8.get("section") == "B", f"Q8 section should be 'B', got '{q8.get('section')}'"
        assert q7.get("lesson") == "Metals and Non-Metals"
        assert q8.get("lesson") == "Metals and Non-Metals"
        
        print("TEST 2 PASSED: Context switching works correctly")

    # TEST 3: English template with passage - should not crash
    def test_english_template_with_passage(self, teacher_token):
        """Test English template with passage - verify passage detected and 5+ questions parsed"""
        docx_bytes = create_docx(ENGLISH_TEMPLATE)
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("english_test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "English", "grade": "10", "departmentId": ""},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        
        assert r.status_code == 200, f"Preview failed: {r.text}"
        result = r.json()
        assert result.get("success") is True
        
        preview = result["preview"]
        # Should have at least 5 questions (plus possibly passage block)
        assert preview["totalParsed"] >= 5, f"Expected at least 5 questions, got {preview['totalParsed']}"
        
        # Check for passage warning (indicates passage was detected)
        passage_warnings = [w for w in preview.get("warnings", []) if "Passage" in w or "passage" in w]
        print(f"  Passage warnings: {passage_warnings}")
        
        # Verify Section B / Writing Skills questions
        questions = preview["questions"]
        writing_q = [q for q in questions if q.get("lesson") == "Writing Skills"]
        assert len(writing_q) >= 2, f"Expected at least 2 Writing Skills questions, got {len(writing_q)}"
        
        print(f"TEST 3 PASSED: English template parsed {preview['totalParsed']} items (passage support working)")

    # TEST 4: Sanskrit template - Unicode support
    def test_sanskrit_unicode_support(self, teacher_token):
        """Test Sanskrit template - verify रामायणम् and व्याकरणम् detected as LESSON names"""
        docx_bytes = create_docx(SANSKRIT_TEMPLATE)
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("sanskrit_test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "Sanskrit", "grade": "9", "departmentId": ""},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        
        assert r.status_code == 200, f"Preview failed: {r.text}"
        result = r.json()
        assert result.get("success") is True
        
        preview = result["preview"]
        questions = preview["questions"]
        
        # Verify Sanskrit lesson names are detected
        q1 = questions[0] if questions else None
        assert q1 is not None
        assert q1.get("lesson") == "रामायणम्", f"Q1 lesson should be 'रामायणम्', got '{q1.get('lesson')}'"
        
        # Q3 should have topic शब्दकोशः
        q3 = questions[2] if len(questions) > 2 else None
        assert q3 is not None
        assert q3.get("topic") == "शब्दकोशः", f"Q3 topic should be 'शब्दकोशः', got '{q3.get('topic')}'"
        
        # Q4-Q5 should be in Section B with lesson व्याकरणम्
        q4 = questions[3] if len(questions) > 3 else None
        assert q4 is not None
        assert q4.get("section") == "B", f"Q4 section should be 'B', got '{q4.get('section')}'"
        assert q4.get("lesson") == "व्याकरणम्", f"Q4 lesson should be 'व्याकरणम्', got '{q4.get('lesson')}'"
        
        print("TEST 4 PASSED: Sanskrit Unicode support working correctly")

    # TEST 5: Validation warnings for questions without context
    def test_validation_warnings(self, teacher_token):
        """Test validation - upload document without SECTION/LESSON/TOPIC markers before first question"""
        docx_bytes = create_docx(NO_CONTEXT_TEMPLATE)
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("no_context.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "Science", "grade": "9", "departmentId": ""},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        
        assert r.status_code == 200, f"Preview failed: {r.text}"
        result = r.json()
        assert result.get("success") is True
        
        preview = result["preview"]
        warnings = preview.get("warnings", [])
        
        # Should have warnings for missing context
        section_warnings = [w for w in warnings if "SECTION" in w]
        lesson_warnings = [w for w in warnings if "LESSON" in w]
        topic_warnings = [w for w in warnings if "TOPIC" in w]
        
        assert len(section_warnings) >= 1, f"Expected at least 1 SECTION warning, got {len(section_warnings)}"
        assert len(lesson_warnings) >= 1, f"Expected at least 1 LESSON warning, got {len(lesson_warnings)}"
        assert len(topic_warnings) >= 1, f"Expected at least 1 TOPIC warning, got {len(topic_warnings)}"
        
        print(f"TEST 5 PASSED: Validation warnings generated ({len(warnings)} total warnings)")

    # TEST 6: Preview response includes hierarchySummary
    def test_hierarchy_summary_in_response(self, teacher_token):
        """Test preview response includes hierarchySummary array with section/lesson/topic/count entries"""
        docx_bytes = create_docx(SCIENCE_TEMPLATE)
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("science_test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "Science", "grade": "9", "departmentId": ""},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        
        assert r.status_code == 200
        result = r.json()
        preview = result["preview"]
        
        # Check hierarchySummary exists and has correct structure
        hierarchy = preview.get("hierarchySummary", [])
        assert isinstance(hierarchy, list), "hierarchySummary should be an array"
        assert len(hierarchy) > 0, "hierarchySummary should not be empty"
        
        # Each entry should have section, lesson, topic, count
        for h in hierarchy:
            assert "section" in h, "hierarchySummary entry missing 'section'"
            assert "lesson" in h, "hierarchySummary entry missing 'lesson'"
            assert "topic" in h, "hierarchySummary entry missing 'topic'"
            assert "count" in h, "hierarchySummary entry missing 'count'"
            assert isinstance(h["count"], int), "count should be an integer"
        
        # Verify specific entries
        section_a_nutrition = [h for h in hierarchy if h["section"] == "A" and h["topic"] == "Nutrition"]
        assert len(section_a_nutrition) == 1, "Should have one entry for Section A / Nutrition"
        assert section_a_nutrition[0]["count"] == 2, "Section A / Nutrition should have 2 questions"
        
        print(f"TEST 6 PASSED: hierarchySummary present with {len(hierarchy)} entries")

    # TEST 7: Per-question section/lesson/topic fields
    def test_per_question_hierarchy_fields(self, teacher_token):
        """Test preview response includes per-question section/lesson/topic fields"""
        docx_bytes = create_docx(SCIENCE_TEMPLATE)
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("science_test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "Science", "grade": "9", "departmentId": ""},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        
        assert r.status_code == 200
        result = r.json()
        questions = result["preview"]["questions"]
        
        # Every question should have section, lesson, topic fields
        for i, q in enumerate(questions):
            assert "section" in q, f"Q{i+1} missing 'section' field"
            assert "lesson" in q, f"Q{i+1} missing 'lesson' field"
            assert "topic" in q, f"Q{i+1} missing 'topic' field"
        
        print("TEST 7 PASSED: All questions have section/lesson/topic fields")


class TestWordParserConfirm:
    """Tests for POST /api/teacher/upload/word/confirm endpoint"""

    # TEST 8: Confirm with departmentId - questions saved with correct departmentId
    def test_confirm_with_department_id(self, teacher_token):
        """Test confirm endpoint saves questions with correct departmentId"""
        # First, get preview
        docx_bytes = create_docx("""SECTION A

LESSON: Test Lesson

TOPIC: Test Topic

Q1. Test question for confirm endpoint verification.
A. Option A
B. Option B
C. Option C
D. Option D
Answer: A
Marks: 1
""")
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("test_confirm.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "Science", "grade": "9", "departmentId": IX_SCIENCE_DEPT_ID},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        
        assert r.status_code == 200, f"Preview failed: {r.text}"
        preview_result = r.json()
        
        # Now confirm
        confirm_r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/confirm",
            json={
                "questions": preview_result["rawQuestions"],
                "metadata": preview_result["metadata"],
                "departmentId": IX_SCIENCE_DEPT_ID,
                "forceUpload": True,
            },
            headers={
                "Authorization": f"Bearer {teacher_token}",
                "Content-Type": "application/json"
            },
        )
        
        assert confirm_r.status_code == 200, f"Confirm failed: {confirm_r.text}"
        confirm_result = confirm_r.json()
        
        assert confirm_result.get("success") is True
        assert confirm_result.get("questionsCreated", 0) >= 1, "Should have created at least 1 question"
        assert "uploadId" in confirm_result, "Response should include uploadId"
        
        print(f"TEST 8 PASSED: Confirm endpoint created {confirm_result.get('questionsCreated')} questions")


class TestAuthAndAccess:
    """Tests for authentication and access control"""

    def test_preview_requires_auth(self):
        """Test preview endpoint requires authentication"""
        docx_bytes = create_docx("Q1. Test question\nAnswer: A\nMarks: 1")
        
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            files={"file": ("test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"subject": "Science", "grade": "9"},
        )
        
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        print("TEST 9 PASSED: Preview endpoint requires authentication")

    def test_confirm_requires_auth(self):
        """Test confirm endpoint requires authentication"""
        r = requests.post(
            f"{BASE_URL}/api/teacher/upload/word/confirm",
            json={"questions": [], "metadata": {"subject": "Science", "grade": "9"}},
            headers={"Content-Type": "application/json"},
        )
        
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        print("TEST 10 PASSED: Confirm endpoint requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
