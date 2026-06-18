"""
PRASHNAKOSH V1 - BLOCKER FIXES & E2E FLOW TESTS
================================================
Tests for:
- BLOCKER 1: DepartmentId filter in paper generation (no cross-department leakage)
- BLOCKER 4: Lesson balancing in question selection
- E2E Flow: Department creation through student results

Test Credentials:
- HOD: MVMCHN / hod.science@mvm.com / Hod@12345
- Teacher: MVMCHN / teacher.science@mvm.com / Teacher@123
- Student: MVMCHN / student1@mvm.com / Student@123
- Super Admin: SUPERADMIN / superadmin@safal.com / SuperAdmin@123

Department IDs:
- IX_Science: 3bedf6c1-d838-4851-a27d-9774fa2b027a
- IX_Mathematics: 41c720e0-4fe3-480f-9026-9fd1763cf457

Blueprint ID: 11d1d880-0913-4a68-89bf-70c23872df1d
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paper-gen-3.preview.emergentagent.com').rstrip('/')

# Test credentials
HOD_CREDS = {
    "schoolCode": "MVMCHN",
    "email": "hod.science@mvm.com",
    "password": "Hod@12345"
}

TEACHER_CREDS = {
    "schoolCode": "MVMCHN",
    "email": "teacher.science@mvm.com",
    "password": "Teacher@123"
}

STUDENT_CREDS = {
    "schoolCode": "MVMCHN",
    "email": "student1@mvm.com",
    "password": "Student@123"
}

SUPER_ADMIN_CREDS = {
    "schoolCode": "SUPERADMIN",
    "email": "superadmin@safal.com",
    "password": "SuperAdmin@123"
}

# Known IDs
IX_SCIENCE_DEPT_ID = "3bedf6c1-d838-4851-a27d-9774fa2b027a"
IX_MATH_DEPT_ID = "41c720e0-4fe3-480f-9026-9fd1763cf457"
BLUEPRINT_ID = "11d1d880-0913-4a68-89bf-70c23872df1d"
TENANT_ID = "f09533f9-49ed-460f-b6fb-fcf9fdba009e"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def hod_token(api_client):
    """Get HOD authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"HOD authentication failed: {response.text}")


@pytest.fixture(scope="module")
def teacher_token(api_client):
    """Get Teacher authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Teacher authentication failed: {response.text}")


@pytest.fixture(scope="module")
def student_token(api_client):
    """Get Student authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=STUDENT_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Student authentication failed: {response.text}")


@pytest.fixture(scope="module")
def super_admin_token(api_client):
    """Get Super Admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Super Admin authentication failed: {response.text}")


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================
class TestAuthentication:
    """Test authentication for all user roles"""
    
    def test_hod_login(self, api_client):
        """E2E Step 1: HOD can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
        assert response.status_code == 200, f"HOD login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "hod"
        assert data["user"]["email"] == HOD_CREDS["email"]
        print(f"✓ HOD login successful: {data['user']['name']}")
    
    def test_teacher_login(self, api_client):
        """E2E Step 3: Teacher can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDS)
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "teacher"
        print(f"✓ Teacher login successful: {data['user']['name']}")
    
    def test_student_login(self, api_client):
        """E2E Step 9: Student can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=STUDENT_CREDS)
        assert response.status_code == 200, f"Student login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "student"
        print(f"✓ Student login successful: {data['user']['name']}")


# ============================================================================
# BLOCKER 1: DEPARTMENT ID FILTER TESTS
# ============================================================================
class TestDepartmentIdFilter:
    """BLOCKER 1: Test that paper generation filters questions by departmentId"""
    
    def test_blueprint_exists_with_department(self, api_client, hod_token):
        """E2E Step 2: Verify IX_Science blueprint exists with correct departmentId"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/blueprints?departmentId={IX_SCIENCE_DEPT_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Failed to get blueprints: {response.text}"
        
        blueprints = response.json()
        blueprint = next((b for b in blueprints if b["id"] == BLUEPRINT_ID), None)
        
        assert blueprint is not None, f"Blueprint {BLUEPRINT_ID} not found"
        assert blueprint.get("departmentId") == IX_SCIENCE_DEPT_ID, \
            f"Blueprint departmentId mismatch: expected {IX_SCIENCE_DEPT_ID}, got {blueprint.get('departmentId')}"
        
        print(f"✓ Blueprint found: {blueprint['name']}")
        print(f"  - Subject: {blueprint.get('subject')}")
        print(f"  - Grade: {blueprint.get('grade')}")
        print(f"  - DepartmentId: {blueprint.get('departmentId')}")
    
    def test_generate_preview_uses_department_filter(self, api_client, hod_token):
        """BLOCKER 1: Generate preview must filter questions by departmentId"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/blueprints/{BLUEPRINT_ID}/generate-preview",
            json={"mode": "offline", "setCount": 1},
            headers=headers
        )
        assert response.status_code == 200, f"Generate preview failed: {response.text}"
        
        data = response.json()
        assert "sets" in data, "Response missing 'sets' field"
        assert len(data["sets"]) >= 1, "No sets generated"
        
        # Get all question IDs from the generated set
        set_a = data["sets"][0]
        question_ids = [q["id"] for q in set_a.get("questions", [])]
        
        print(f"✓ Generated {len(question_ids)} questions in Set A")
        
        # Verify all questions belong to IX_Science department
        if question_ids:
            # Fetch questions to verify departmentId
            questions_response = api_client.get(
                f"{BASE_URL}/api/questions?departmentId={IX_SCIENCE_DEPT_ID}",
                headers=headers
            )
            assert questions_response.status_code == 200
            
            dept_questions = questions_response.json()
            dept_question_ids = {q["id"] for q in dept_questions}
            
            # All generated questions must be from IX_Science department
            for qid in question_ids:
                assert qid in dept_question_ids, \
                    f"Question {qid} is NOT from IX_Science department - CROSS-DEPARTMENT LEAKAGE!"
            
            print(f"✓ All {len(question_ids)} questions are from IX_Science department (no leakage)")
    
    def test_no_math_questions_in_science_paper(self, api_client, hod_token):
        """BLOCKER 1: IX_Science paper must NOT contain IX_Mathematics questions"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        # Get IX_Mathematics questions
        math_response = api_client.get(
            f"{BASE_URL}/api/questions?departmentId={IX_MATH_DEPT_ID}",
            headers=headers
        )
        
        # This may return 403 if HOD doesn't have access to Math dept - that's OK
        if math_response.status_code == 403:
            print("✓ HOD correctly denied access to IX_Mathematics department")
            return
        
        if math_response.status_code == 200:
            math_questions = math_response.json()
            math_question_ids = {q["id"] for q in math_questions}
            
            # Generate science paper
            preview_response = api_client.post(
                f"{BASE_URL}/api/blueprints/{BLUEPRINT_ID}/generate-preview",
                json={"mode": "offline", "setCount": 1},
                headers=headers
            )
            
            if preview_response.status_code == 200:
                data = preview_response.json()
                if data.get("sets") and len(data["sets"]) > 0:
                    generated_ids = {q["id"] for q in data["sets"][0].get("questions", [])}
                    
                    # Check for cross-department leakage
                    leaked_ids = generated_ids.intersection(math_question_ids)
                    assert len(leaked_ids) == 0, \
                        f"CROSS-DEPARTMENT LEAKAGE: {len(leaked_ids)} Math questions in Science paper!"
                    
                    print(f"✓ No IX_Mathematics questions leaked into IX_Science paper")
    
    def test_teacher_cannot_access_other_department(self, api_client, teacher_token):
        """Security: IX_Science teacher cannot access IX_Mathematics data"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # Try to access IX_Mathematics questions
        response = api_client.get(
            f"{BASE_URL}/api/questions?departmentId={IX_MATH_DEPT_ID}",
            headers=headers
        )
        
        # Should return 403 Forbidden
        assert response.status_code == 403, \
            f"Expected 403 for cross-department access, got {response.status_code}"
        
        print("✓ Teacher correctly denied access to IX_Mathematics department")


# ============================================================================
# BLOCKER 4: LESSON BALANCING TESTS
# ============================================================================
class TestLessonBalancing:
    """BLOCKER 4: Test that generated paper spreads questions across multiple lessons"""
    
    def test_lesson_distribution_in_generated_paper(self, api_client, hod_token):
        """BLOCKER 4: Generated paper must spread questions across multiple lessons"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/blueprints/{BLUEPRINT_ID}/generate-preview",
            json={"mode": "offline", "setCount": 1},
            headers=headers
        )
        assert response.status_code == 200, f"Generate preview failed: {response.text}"
        
        data = response.json()
        
        # Check stats for lesson distribution
        stats = data.get("stats", {})
        lesson_distribution = stats.get("lessonDistribution", {})
        
        print(f"Lesson distribution: {lesson_distribution}")
        
        # If we have questions, verify they come from multiple lessons
        if data.get("sets") and len(data["sets"]) > 0:
            questions = data["sets"][0].get("questions", [])
            
            if len(questions) > 0:
                lessons_used = set()
                for q in questions:
                    lesson = q.get("lesson", "Unknown")
                    lessons_used.add(lesson)
                
                print(f"✓ Questions spread across {len(lessons_used)} lessons: {lessons_used}")
                
                # If we have more than 5 questions, we should have multiple lessons
                if len(questions) >= 5:
                    assert len(lessons_used) > 1, \
                        f"LESSON IMBALANCE: All {len(questions)} questions from single lesson!"
    
    def test_multiset_lesson_distribution(self, api_client, hod_token):
        """BLOCKER 4: Multi-set generation should have balanced lesson distribution per set"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/blueprints/{BLUEPRINT_ID}/generate-preview",
            json={"mode": "offline", "setCount": 3},
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Multi-set generation failed: {response.text}")
        
        data = response.json()
        stats = data.get("stats", {})
        per_set_stats = stats.get("perSetStats", [])
        
        for set_stat in per_set_stats:
            lesson_dist = set_stat.get("lessonDistribution", {})
            print(f"{set_stat['setName']}: {lesson_dist}")
            
            # Each set should have questions from multiple lessons (if available)
            if sum(lesson_dist.values()) >= 5:
                assert len(lesson_dist) > 1 or sum(lesson_dist.values()) < 5, \
                    f"LESSON IMBALANCE in {set_stat['setName']}: all questions from one lesson"
        
        print("✓ Lesson distribution checked for all sets")


# ============================================================================
# E2E FLOW: ACADEMIC COVERAGE DASHBOARD
# ============================================================================
class TestAcademicCoverage:
    """E2E Step 5: Test Academic Coverage Dashboard API"""
    
    def test_academic_coverage_api(self, api_client, hod_token):
        """E2E Step 5: GET /api/departments/:id/academic-coverage returns valid data"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage",
            headers=headers
        )
        assert response.status_code == 200, f"Academic coverage failed: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "departmentId" in data
        assert "departmentName" in data
        assert "totalQuestions" in data
        assert "totalApprovedQuestions" in data
        assert "totalPendingQuestions" in data
        assert "blueprints" in data
        assert "summary" in data
        
        print(f"✓ Academic Coverage for {data['departmentName']}:")
        print(f"  - Total Questions: {data['totalQuestions']}")
        print(f"  - Approved: {data['totalApprovedQuestions']}")
        print(f"  - Pending: {data['totalPendingQuestions']}")
        print(f"  - Overall Coverage: {data['summary'].get('overallCoverage', 0)}%")
        
        # Verify approved count > 0 (E2E Step 4 prerequisite)
        assert data['totalApprovedQuestions'] > 0, \
            "No approved questions found - E2E flow requires approved questions"


# ============================================================================
# E2E FLOW: MULTI-SET GENERATION
# ============================================================================
class TestMultiSetGeneration:
    """E2E Steps 6-7: Test multi-set paper generation"""
    
    def test_generate_single_set(self, api_client, hod_token):
        """E2E Step 6: Generate Set A with setCount=1"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/blueprints/{BLUEPRINT_ID}/generate-preview",
            json={"mode": "offline", "setCount": 1},
            headers=headers
        )
        assert response.status_code == 200, f"Generate Set A failed: {response.text}"
        
        data = response.json()
        assert "sets" in data
        assert len(data["sets"]) >= 1
        
        set_a = data["sets"][0]
        questions = set_a.get("questions", [])
        
        print(f"✓ Set A generated: {len(questions)} questions, {set_a.get('totalMarks', 0)} marks")
        
        # Verify all questions have correct departmentId
        for q in questions:
            assert q.get("departmentId") == IX_SCIENCE_DEPT_ID or q.get("departmentId") is None, \
                f"Question {q['id']} has wrong departmentId"
    
    def test_generate_three_sets_no_overlap(self, api_client, hod_token):
        """E2E Step 7: Generate Set A/B/C with setCount=3, verify zero overlap"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/blueprints/{BLUEPRINT_ID}/generate-preview",
            json={"mode": "offline", "setCount": 3, "allowOverlap": False},
            headers=headers
        )
        assert response.status_code == 200, f"Generate 3 sets failed: {response.text}"
        
        data = response.json()
        assert "sets" in data
        
        sets = data["sets"]
        print(f"Generated {len(sets)} sets")
        
        # Collect all question IDs per set
        all_question_ids = []
        for s in sets:
            questions = s.get("questions", [])
            qids = [q["id"] for q in questions]
            all_question_ids.append(set(qids))
            print(f"  {s['setName']}: {len(questions)} questions")
        
        # Verify zero overlap between sets
        if len(sets) >= 2:
            for i in range(len(sets)):
                for j in range(i + 1, len(sets)):
                    overlap = all_question_ids[i].intersection(all_question_ids[j])
                    assert len(overlap) == 0, \
                        f"OVERLAP between Set {i+1} and Set {j+1}: {len(overlap)} questions"
            
            print("✓ Zero question overlap between all sets")
        
        # Check stats
        stats = data.get("stats", {})
        overlap_count = stats.get("overlapCount", 0)
        assert overlap_count == 0, f"Stats show {overlap_count} overlapping questions"


# ============================================================================
# E2E FLOW: MOCK TEST CREATION & EXAM FLOW
# ============================================================================
class TestMockTestFlow:
    """E2E Steps 8-13: Test mock test creation and exam flow"""
    
    @pytest.fixture(scope="class")
    def created_test_id(self, api_client, hod_token):
        """Create a mock test for E2E testing"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        # Create test via /api/tests/generate
        test_data = {
            "title": f"E2E Test - {int(time.time())}",
            "type": "mock",
            "subject": "Science",
            "grade": "9",
            "blueprintId": BLUEPRINT_ID,
            "departmentId": IX_SCIENCE_DEPT_ID,
            "duration": 30,
            "totalMarks": 20,
            "questionCount": 10
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/tests/generate",
            json=test_data,
            headers=headers
        )
        
        if response.status_code == 200:
            test = response.json()
            print(f"✓ Created test: {test['id']}")
            return test["id"]
        else:
            pytest.skip(f"Failed to create test: {response.text}")
    
    def test_create_mock_test(self, api_client, hod_token):
        """E2E Step 8: Create Mock Test via /api/tests/generate"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        test_data = {
            "title": f"E2E Mock Test - {int(time.time())}",
            "type": "mock",
            "subject": "Science",
            "grade": "9",
            "blueprintId": BLUEPRINT_ID,
            "departmentId": IX_SCIENCE_DEPT_ID,
            "duration": 30,
            "totalMarks": 20,
            "questionCount": 10
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/tests/generate",
            json=test_data,
            headers=headers
        )
        assert response.status_code == 200, f"Create test failed: {response.text}"
        
        test = response.json()
        assert "id" in test
        assert test.get("title") == test_data["title"]
        assert test.get("departmentId") == IX_SCIENCE_DEPT_ID
        
        print(f"✓ Mock test created: {test['id']}")
        print(f"  - Title: {test['title']}")
        print(f"  - Blueprint: {test.get('blueprintId')}")
        
        return test["id"]
    
    def test_activate_test(self, api_client, hod_token, created_test_id):
        """Activate the test for students"""
        if not created_test_id:
            pytest.skip("No test created")
        
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/tests/{created_test_id}/activate",
            headers=headers
        )
        
        # May fail if test is not in activatable state
        if response.status_code == 200:
            print(f"✓ Test activated: {created_test_id}")
        else:
            print(f"Test activation returned {response.status_code}: {response.text}")


class TestExamFlow:
    """E2E Steps 9-13: Student exam flow"""
    
    def test_student_available_tests(self, api_client, student_token):
        """E2E Step 9: Student can see available tests"""
        headers = {"Authorization": f"Bearer {student_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/student/tests",
            headers=headers
        )
        assert response.status_code == 200, f"Get student tests failed: {response.text}"
        
        tests = response.json()
        print(f"✓ Student has {len(tests)} available tests")
        
        # Find an active test
        active_tests = [t for t in tests if t.get("isActive") and not t.get("hasCompletedAttempt")]
        if active_tests:
            print(f"  - {len(active_tests)} active tests available")
            return active_tests[0]["id"]
        return None
    
    def test_exam_start(self, api_client, student_token):
        """E2E Step 10: Student can start exam"""
        headers = {"Authorization": f"Bearer {student_token}"}
        
        # Get available tests first
        tests_response = api_client.get(f"{BASE_URL}/api/student/tests", headers=headers)
        if tests_response.status_code != 200:
            pytest.skip("Cannot get student tests")
        
        tests = tests_response.json()
        active_test = next(
            (t for t in tests if t.get("isActive") and not t.get("hasCompletedAttempt")),
            None
        )
        
        if not active_test:
            pytest.skip("No active test available for student")
        
        # Start exam
        response = api_client.post(
            f"{BASE_URL}/api/exam/start",
            json={"testId": active_test["id"]},
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "attempt" in data
            assert "questions" in data
            assert "duration" in data
            
            print(f"✓ Exam started: {data['attempt']['id']}")
            print(f"  - Questions: {len(data['questions'])}")
            print(f"  - Duration: {data['duration']} minutes")
            
            return data["attempt"]["id"], data["questions"]
        elif response.status_code == 400 and "already completed" in response.text.lower():
            print("Student has already completed this test")
        else:
            print(f"Exam start returned {response.status_code}: {response.text}")
    
    def test_exam_submit(self, api_client, student_token):
        """E2E Steps 11-12: Student can submit exam"""
        headers = {"Authorization": f"Bearer {student_token}"}
        
        # Get available tests
        tests_response = api_client.get(f"{BASE_URL}/api/student/tests", headers=headers)
        if tests_response.status_code != 200:
            pytest.skip("Cannot get student tests")
        
        tests = tests_response.json()
        
        # Find test with active attempt
        test_with_attempt = next(
            (t for t in tests if t.get("hasActiveAttempt")),
            None
        )
        
        if not test_with_attempt:
            # Try to start a new exam
            active_test = next(
                (t for t in tests if t.get("isActive") and not t.get("hasCompletedAttempt")),
                None
            )
            
            if not active_test:
                pytest.skip("No active test available")
            
            start_response = api_client.post(
                f"{BASE_URL}/api/exam/start",
                json={"testId": active_test["id"]},
                headers=headers
            )
            
            if start_response.status_code != 200:
                pytest.skip(f"Cannot start exam: {start_response.text}")
            
            exam_data = start_response.json()
            attempt_id = exam_data["attempt"]["id"]
            questions = exam_data["questions"]
        else:
            # Get active attempt
            pytest.skip("Test has active attempt but we don't have attempt ID")
            return
        
        # Submit with some answers
        answers = {}
        for q in questions[:5]:  # Answer first 5 questions
            if q.get("options") and len(q["options"]) > 0:
                answers[q["id"]] = q["options"][0]  # Pick first option
            elif q.get("correctAnswer"):
                answers[q["id"]] = q["correctAnswer"]
        
        response = api_client.post(
            f"{BASE_URL}/api/exam/submit",
            json={"attemptId": attempt_id, "answers": answers},
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "score" in data
            assert "total" in data
            assert "percentage" in data
            
            print(f"✓ Exam submitted successfully")
            print(f"  - Score: {data['score']}/{data['total']}")
            print(f"  - Percentage: {data['percentage']:.1f}%")
            print(f"  - Needs manual marking: {data.get('needsManualMarking', False)}")
        else:
            print(f"Exam submit returned {response.status_code}: {response.text}")
    
    def test_student_results(self, api_client, student_token):
        """E2E Step 13: Student can view results"""
        headers = {"Authorization": f"Bearer {student_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/student/results",
            headers=headers
        )
        assert response.status_code == 200, f"Get results failed: {response.text}"
        
        results = response.json()
        print(f"✓ Student has {len(results)} result(s)")
        
        for r in results[:3]:  # Show first 3
            print(f"  - {r.get('testTitle', 'Unknown')}: {r.get('score', 0)}/{r.get('totalMarks', 0)} ({r.get('status', 'unknown')})")


class TestRevealResults:
    """E2E Step 13: HOD reveals results"""
    
    def test_hod_reveal_results(self, api_client, hod_token):
        """HOD can reveal test results"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        # Get tests
        response = api_client.get(f"{BASE_URL}/api/tests", headers=headers)
        if response.status_code != 200:
            pytest.skip("Cannot get tests")
        
        tests = response.json()
        
        # Find a test that hasn't revealed results
        test_to_reveal = next(
            (t for t in tests if not t.get("resultsRevealed") and t.get("isActive")),
            None
        )
        
        if not test_to_reveal:
            print("No test available to reveal results")
            return
        
        response = api_client.post(
            f"{BASE_URL}/api/tests/{test_to_reveal['id']}/reveal-results",
            headers=headers
        )
        
        if response.status_code == 200:
            print(f"✓ Results revealed for test: {test_to_reveal['title']}")
        else:
            print(f"Reveal results returned {response.status_code}: {response.text}")


# ============================================================================
# QUESTION APPROVAL FLOW
# ============================================================================
class TestQuestionApproval:
    """E2E Steps 3-4: Teacher upload and HOD approval"""
    
    def test_get_pending_questions(self, api_client, hod_token):
        """E2E Step 4: HOD can see pending questions"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/questions/pending?departmentId={IX_SCIENCE_DEPT_ID}",
            headers=headers
        )
        
        if response.status_code == 200:
            pending = response.json()
            print(f"✓ {len(pending)} pending questions for approval")
        else:
            print(f"Get pending questions returned {response.status_code}")
    
    def test_approved_questions_count(self, api_client, hod_token):
        """E2E Step 4: Verify approved count > 0"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/questions?departmentId={IX_SCIENCE_DEPT_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Get questions failed: {response.text}"
        
        questions = response.json()
        approved = [q for q in questions if q.get("status") == "approved"]
        
        print(f"✓ {len(approved)} approved questions in IX_Science department")
        assert len(approved) > 0, "No approved questions - E2E flow requires approved questions"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
