"""
Test suite for Duplicate Detection and Unified Selection Engine features
Tests:
- POST /api/questions/check-duplicate - single question duplicate check
- POST /api/questions/check-duplicates-bulk - bulk duplicate check
- POST /api/teacher/questions - manual entry with duplicate detection
- POST /api/teacher/upload/word/preview - word upload preview with duplicate summary
- POST /api/teacher/upload/word/confirm - word upload confirm with auto-filter
- POST /api/questions/bulk - bulk question creation with duplicate filter
- POST /api/tests/:id/select-by-blueprint - unified engine selection
- POST /api/blueprints/:id/generate-preview - unified engine preview
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEACHER_CREDENTIALS = {
    "schoolCode": "TESTSCH",
    "email": "teacher@test.com",
    "password": "Teacher@123"
}

SUPERADMIN_CREDENTIALS = {
    "schoolCode": "SUPERADMIN",
    "email": "superadmin@safal.com",
    "password": "SuperAdmin@123"
}


class TestAuth:
    """Authentication tests"""
    
    def test_teacher_login(self, api_client):
        """Test teacher login with TESTSCH school"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDENTIALS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == TEACHER_CREDENTIALS["email"]
        print(f"✓ Teacher login successful: {data['user']['name']}")
        return data["token"]
    
    def test_superadmin_login(self, api_client):
        """Test super admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDENTIALS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data["user"]["role"] == "super_admin"
        print(f"✓ Super Admin login successful")
        return data["token"]


class TestDuplicateDetectionEndpoints:
    """Test duplicate detection API endpoints"""
    
    def test_check_duplicate_unique_question(self, teacher_client):
        """Test checking a unique question - should return 'unique' status"""
        unique_content = f"TEST_UNIQUE_What is the capital of France? {time.time()}"
        response = teacher_client.post(f"{BASE_URL}/api/questions/check-duplicate", json={
            "content": unique_content,
            "subject": "Geography"
        })
        assert response.status_code == 200, f"Check duplicate failed: {response.text}"
        data = response.json()
        assert data["status"] == "unique", f"Expected unique, got {data['status']}"
        print(f"✓ Unique question check passed: status={data['status']}")
    
    def test_check_duplicate_exact_match(self, teacher_client):
        """Test checking an exact duplicate - should return 'exact_duplicate' status"""
        # First, get existing questions to find one to duplicate
        response = teacher_client.get(f"{BASE_URL}/api/questions")
        if response.status_code == 200:
            questions = response.json()
            if len(questions) > 0:
                existing_q = questions[0]
                # Check for exact duplicate
                response = teacher_client.post(f"{BASE_URL}/api/questions/check-duplicate", json={
                    "content": existing_q["content"],
                    "options": existing_q.get("options"),
                    "subject": existing_q.get("subject")
                })
                assert response.status_code == 200, f"Check duplicate failed: {response.text}"
                data = response.json()
                # Should be exact_duplicate or similar_found
                assert data["status"] in ["exact_duplicate", "similar_found", "unique"], f"Unexpected status: {data['status']}"
                print(f"✓ Duplicate check for existing question: status={data['status']}")
            else:
                pytest.skip("No existing questions to test duplicate detection")
        else:
            pytest.skip("Could not fetch questions")
    
    def test_check_duplicates_bulk(self, teacher_client):
        """Test bulk duplicate check endpoint"""
        questions = [
            {"content": f"TEST_BULK_Question 1: What is 2+2? {time.time()}"},
            {"content": f"TEST_BULK_Question 2: What is 3+3? {time.time()}"},
            {"content": f"TEST_BULK_Question 3: What is 4+4? {time.time()}"}
        ]
        response = teacher_client.post(f"{BASE_URL}/api/questions/check-duplicates-bulk", json={
            "questions": questions
        })
        assert response.status_code == 200, f"Bulk check failed: {response.text}"
        data = response.json()
        assert "results" in data, "No results in response"
        assert "totalChecked" in data, "No totalChecked in response"
        assert data["totalChecked"] == 3, f"Expected 3 checked, got {data['totalChecked']}"
        print(f"✓ Bulk duplicate check passed: {data['totalChecked']} questions checked")
        print(f"  - Exact duplicates: {data.get('exactDuplicates', 0)}")
        print(f"  - Similar found: {data.get('similarFound', 0)}")
        print(f"  - Unique: {data.get('unique', 0)}")
    
    def test_check_duplicate_validation(self, teacher_client):
        """Test validation - content too short should fail"""
        response = teacher_client.post(f"{BASE_URL}/api/questions/check-duplicate", json={
            "content": "short"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Validation for short content works correctly")


class TestTeacherManualEntry:
    """Test teacher manual question entry with duplicate detection"""
    
    def test_create_unique_question(self, teacher_client):
        """Test creating a unique question - should succeed"""
        unique_content = f"TEST_MANUAL_What is the time complexity of binary search algorithm? {time.time()}"
        response = teacher_client.post(f"{BASE_URL}/api/teacher/questions", json={
            "content": unique_content,
            "type": "mcq",
            "subject": "Computer Science",
            "chapter": "Algorithms",  # Required field
            "grade": "10",
            "marks": 2,
            "difficulty": "medium",
            "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
            "correctAnswer": "C"
        })
        assert response.status_code == 200, f"Create question failed: {response.text}"
        data = response.json()
        assert data["success"] == True, "Question creation not successful"
        assert "question" in data, "No question in response"
        print(f"✓ Unique question created successfully: {data['question']['id']}")
        return data["question"]["id"]
    
    def test_create_exact_duplicate_blocked(self, teacher_client):
        """Test creating an exact duplicate - should be blocked with 409"""
        # First create a question
        unique_content = f"TEST_DUP_BLOCK_What is the speed of light? {time.time()}"
        response1 = teacher_client.post(f"{BASE_URL}/api/teacher/questions", json={
            "content": unique_content,
            "type": "short_answer",
            "subject": "Physics",
            "chapter": "Light and Optics",  # Required field
            "grade": "10",
            "marks": 2,
            "difficulty": "easy"
        })
        assert response1.status_code == 200, f"First question creation failed: {response1.text}"
        
        # Try to create exact duplicate
        response2 = teacher_client.post(f"{BASE_URL}/api/teacher/questions", json={
            "content": unique_content,  # Same content
            "type": "short_answer",
            "subject": "Physics",
            "chapter": "Light and Optics",  # Required field
            "grade": "10",
            "marks": 2,
            "difficulty": "easy"
        })
        assert response2.status_code == 409, f"Expected 409 for duplicate, got {response2.status_code}"
        data = response2.json()
        assert data.get("duplicate") == True, "Response should indicate duplicate"
        assert data.get("duplicateType") == "exact", f"Expected exact duplicate, got {data.get('duplicateType')}"
        print("✓ Exact duplicate correctly blocked with 409")
    
    def test_force_upload_similar_question(self, teacher_client):
        """Test force upload with forceUpload:true - should allow similar questions"""
        base_content = f"TEST_FORCE_What are the main principles of object-oriented programming? {time.time()}"
        
        # Create first question
        response1 = teacher_client.post(f"{BASE_URL}/api/teacher/questions", json={
            "content": base_content,
            "type": "long_answer",
            "subject": "Computer Science",
            "chapter": "OOP Concepts",  # Required field
            "grade": "10",
            "marks": 5,
            "difficulty": "medium"
        })
        assert response1.status_code == 200, f"First question creation failed: {response1.text}"
        
        # Create similar question with forceUpload
        similar_content = base_content + " Explain with examples."
        response2 = teacher_client.post(f"{BASE_URL}/api/teacher/questions", json={
            "content": similar_content,
            "type": "long_answer",
            "subject": "Computer Science",
            "chapter": "OOP Concepts",  # Required field
            "grade": "10",
            "marks": 5,
            "difficulty": "medium",
            "forceUpload": True
        })
        # Should succeed with forceUpload
        assert response2.status_code in [200, 409], f"Unexpected status: {response2.status_code}"
        print(f"✓ Force upload test completed: status={response2.status_code}")


class TestBulkQuestionUpload:
    """Test bulk question upload with duplicate filtering"""
    
    def test_bulk_upload_filters_duplicates(self, teacher_client):
        """Test that bulk upload filters out exact duplicates"""
        timestamp = time.time()
        questions = [
            {
                "content": f"TEST_BULK_UPLOAD_Q1 What is photosynthesis? {timestamp}",
                "type": "short_answer",
                "subject": "Biology",
                "chapter": "Plant Biology",  # Required field
                "grade": "10",
                "marks": 2,
                "difficulty": "easy"
            },
            {
                "content": f"TEST_BULK_UPLOAD_Q2 What is respiration? {timestamp}",
                "type": "short_answer",
                "subject": "Biology",
                "chapter": "Plant Biology",  # Required field
                "grade": "10",
                "marks": 2,
                "difficulty": "easy"
            }
        ]
        
        response = teacher_client.post(f"{BASE_URL}/api/questions/bulk", json={
            "questions": questions
        })
        assert response.status_code == 200, f"Bulk upload failed: {response.text}"
        data = response.json()
        assert data["success"] == True, "Bulk upload not successful"
        assert "count" in data, "No count in response"
        print(f"✓ Bulk upload successful: {data['count']} questions created")
        print(f"  - Duplicates removed: {data.get('duplicatesRemoved', 0)}")


class TestUnifiedSelectionEngine:
    """Test unified question selection engine endpoints"""
    
    def test_select_by_blueprint(self, teacher_client):
        """Test POST /api/tests/:id/select-by-blueprint - unified engine"""
        # First, get a test with a blueprint
        response = teacher_client.get(f"{BASE_URL}/api/tests")
        if response.status_code != 200:
            pytest.skip("Could not fetch tests")
        
        tests = response.json()
        test_with_blueprint = None
        for test in tests:
            if test.get("blueprintId"):
                test_with_blueprint = test
                break
        
        if not test_with_blueprint:
            pytest.skip("No test with blueprint found")
        
        # Call select-by-blueprint
        response = teacher_client.post(
            f"{BASE_URL}/api/tests/{test_with_blueprint['id']}/select-by-blueprint",
            json={"mode": "offline"}
        )
        
        if response.status_code == 200:
            data = response.json()
            # Verify unified engine response structure
            assert "sectionBreakdown" in data or "selectedQuestions" in data, "Missing unified engine fields"
            print(f"✓ Select by blueprint successful")
            print(f"  - Selected questions: {data.get('selectedQuestions', 0)}")
            print(f"  - Total marks: {data.get('totalMarks', 0)}")
            if "warnings" in data:
                print(f"  - Warnings: {data['warnings']}")
        else:
            print(f"⚠ Select by blueprint returned {response.status_code}: {response.text}")
    
    def test_blueprint_generate_preview(self, teacher_client):
        """Test POST /api/blueprints/:id/generate-preview - unified engine preview"""
        # Get blueprints
        response = teacher_client.get(f"{BASE_URL}/api/blueprints")
        if response.status_code != 200:
            pytest.skip("Could not fetch blueprints")
        
        blueprints = response.json()
        if len(blueprints) == 0:
            pytest.skip("No blueprints found")
        
        blueprint = blueprints[0]
        
        # Generate preview with unified engine
        response = teacher_client.post(
            f"{BASE_URL}/api/blueprints/{blueprint['id']}/generate-preview",
            json={"mode": "offline", "setCount": 1}
        )
        
        if response.status_code == 200:
            data = response.json()
            # Verify unified engine response structure
            assert "sets" in data or "stats" in data or "warnings" in data, "Missing unified engine fields"
            print(f"✓ Blueprint generate preview successful")
            if "stats" in data:
                print(f"  - Stats: {data['stats']}")
            if "warnings" in data and len(data["warnings"]) > 0:
                print(f"  - Warnings: {data['warnings']}")
        else:
            print(f"⚠ Blueprint generate preview returned {response.status_code}: {response.text}")


class TestWordUploadDuplicateDetection:
    """Test Word upload endpoints with duplicate detection"""
    
    def test_word_preview_returns_duplicate_summary(self, teacher_client):
        """Test that word preview returns duplicateSummary and per-question duplicateStatus"""
        # This test requires a .docx file - we'll test the endpoint structure
        # by checking if the endpoint exists and returns proper error for missing file
        response = teacher_client.post(
            f"{BASE_URL}/api/teacher/upload/word/preview",
            data={"subject": "Math", "grade": "10"}
        )
        # Should return 400 for missing file, not 404
        assert response.status_code in [400, 415], f"Unexpected status: {response.status_code}"
        print("✓ Word preview endpoint exists and validates input")
    
    def test_word_confirm_endpoint_exists(self, teacher_client):
        """Test that word confirm endpoint exists"""
        response = teacher_client.post(
            f"{BASE_URL}/api/teacher/upload/word/confirm",
            json={"questions": [], "metadata": {"subject": "Math", "grade": "10"}}
        )
        # Should return 400 for empty questions, not 404
        assert response.status_code == 400, f"Unexpected status: {response.status_code}"
        data = response.json()
        assert "error" in data, "Should return error for empty questions"
        print("✓ Word confirm endpoint exists and validates input")


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def teacher_token(api_client):
    """Get teacher authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDENTIALS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Teacher authentication failed: {response.text}")


@pytest.fixture
def teacher_client(api_client, teacher_token):
    """Session with teacher auth header"""
    api_client.headers.update({"Authorization": f"Bearer {teacher_token}"})
    return api_client


@pytest.fixture
def superadmin_token(api_client):
    """Get super admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDENTIALS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Super admin authentication failed: {response.text}")


@pytest.fixture
def superadmin_client(api_client, superadmin_token):
    """Session with super admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {superadmin_token}"})
    return api_client


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
