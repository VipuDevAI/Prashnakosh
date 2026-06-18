"""
Test Suite: Memory Bottleneck Fix (Prashnakosh V1)
Tests the removal of full-tenant question loading (getQuestionsByTenant) 
and replacement with department-filtered SQL queries, SQL COUNT/DISTINCT, and pagination.

Key changes tested:
- GET /api/questions with departmentId returns array of department questions
- GET /api/questions without departmentId returns paginated response {questions, pagination}
- GET /api/teacher/questions returns only questions created by the logged-in teacher
- GET /api/analytics returns correct totalQuestions count using SQL COUNT
- GET /api/departments/:id/academic-coverage returns coverage data
- GET /api/hod/lesson-stats with departmentId returns stats
- POST /api/tests/:id/validate-multiset still works correctly
- POST /api/questions/check-duplicate with departmentId works
- GET /api/export/questions with departmentId works
- Session expiry still works (401 SESSION_EXPIRED for expired tokens)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
CREDENTIALS = {
    "super_admin": {
        "schoolCode": "SUPERADMIN",
        "email": "superadmin@safal.com",
        "password": "SuperAdmin@123"
    },
    "hod": {
        "schoolCode": "MVMCHN",
        "email": "hod.science@mvm.com",
        "password": "Hod@12345"
    },
    "teacher": {
        "schoolCode": "MVMCHN",
        "email": "teacher.science@mvm.com",
        "password": "Teacher@123"
    },
    "student": {
        "schoolCode": "MVMCHN",
        "email": "student1@mvm.com",
        "password": "Student@123"
    }
}

# Known IDs from context
DEPARTMENT_ID = "3bedf6c1-d838-4851-a27d-9774fa2b027a"
BLUEPRINT_ID = "11d1d880-0913-4a68-89bf-70c23872df1d"


class TestLoginAllRoles:
    """Test login works for all roles"""
    
    def test_super_admin_login(self):
        """Super Admin login should work and return token with expiresAt"""
        creds = CREDENTIALS["super_admin"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200, f"Super Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not returned"
        assert "user" in data, "User not returned"
        assert "expiresAt" in data, "expiresAt not returned"
        assert data["user"]["role"] == "super_admin"
        print(f"PASS: Super Admin login successful, expiresAt={data['expiresAt']}")
    
    def test_hod_login(self):
        """HOD login should work and return token with expiresAt"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200, f"HOD login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not returned"
        assert "user" in data, "User not returned"
        assert "expiresAt" in data, "expiresAt not returned"
        assert data["user"]["role"] == "hod"
        print(f"PASS: HOD login successful, expiresAt={data['expiresAt']}")
    
    def test_teacher_login(self):
        """Teacher login should work and return token with expiresAt"""
        creds = CREDENTIALS["teacher"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not returned"
        assert "user" in data, "User not returned"
        assert "expiresAt" in data, "expiresAt not returned"
        assert data["user"]["role"] == "teacher"
        print(f"PASS: Teacher login successful, expiresAt={data['expiresAt']}")
    
    def test_student_login(self):
        """Student login should work and return token with expiresAt"""
        creds = CREDENTIALS["student"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200, f"Student login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not returned"
        assert "user" in data, "User not returned"
        assert "expiresAt" in data, "expiresAt not returned"
        assert data["user"]["role"] == "student"
        print(f"PASS: Student login successful, expiresAt={data['expiresAt']}")


class TestQuestionsEndpoint:
    """Test GET /api/questions with and without departmentId"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as HOD for questions tests"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_questions_with_department_id_returns_array(self):
        """GET /api/questions?departmentId=X should return array of department questions"""
        response = requests.get(
            f"{BASE_URL}/api/questions?departmentId={DEPARTMENT_ID}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Should be an array, not paginated object
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"PASS: GET /api/questions?departmentId returns array with {len(data)} questions")
    
    def test_questions_without_department_id_returns_paginated(self):
        """GET /api/questions without departmentId should return paginated response"""
        # Login as admin to test paginated response (admin/super_admin get paginated)
        creds = CREDENTIALS["super_admin"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        admin_token = response.json()["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/questions", headers=admin_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Should be paginated object with questions and pagination
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        assert "questions" in data, "Missing 'questions' key in paginated response"
        assert "pagination" in data, "Missing 'pagination' key in paginated response"
        assert "page" in data["pagination"], "Missing 'page' in pagination"
        assert "limit" in data["pagination"], "Missing 'limit' in pagination"
        assert "total" in data["pagination"], "Missing 'total' in pagination"
        assert "totalPages" in data["pagination"], "Missing 'totalPages' in pagination"
        print(f"PASS: GET /api/questions returns paginated response with {len(data['questions'])} questions, total={data['pagination']['total']}")


class TestTeacherQuestions:
    """Test GET /api/teacher/questions returns only questions created by logged-in teacher"""
    
    def test_teacher_questions_endpoint(self):
        """GET /api/teacher/questions should return only teacher's own questions"""
        creds = CREDENTIALS["teacher"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        user_id = response.json()["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/teacher/questions", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        # All questions should be created by this teacher
        for q in data:
            assert q.get("createdBy") == user_id, f"Question {q['id']} not created by logged-in teacher"
        print(f"PASS: GET /api/teacher/questions returns {len(data)} questions created by teacher")


class TestAnalyticsEndpoint:
    """Test GET /api/analytics returns correct totalQuestions count using SQL COUNT"""
    
    def test_analytics_returns_total_questions(self):
        """GET /api/analytics should return totalQuestions using SQL COUNT"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/analytics", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "totalQuestions" in data, "Missing 'totalQuestions' in analytics"
        assert isinstance(data["totalQuestions"], int), "totalQuestions should be integer"
        assert data["totalQuestions"] >= 0, "totalQuestions should be non-negative"
        print(f"PASS: GET /api/analytics returns totalQuestions={data['totalQuestions']}")


class TestAcademicCoverage:
    """Test GET /api/departments/:id/academic-coverage returns coverage data"""
    
    def test_academic_coverage_endpoint(self):
        """GET /api/departments/:id/academic-coverage should return coverage data"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/departments/{DEPARTMENT_ID}/academic-coverage",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Should have coverage data structure
        assert "departmentId" in data or "sections" in data or "lessons" in data or "coverage" in data, \
            f"Missing expected coverage fields in response: {list(data.keys())}"
        print(f"PASS: GET /api/departments/:id/academic-coverage returns coverage data with keys: {list(data.keys())}")


class TestHodLessonStats:
    """Test GET /api/hod/lesson-stats with departmentId returns stats"""
    
    def test_hod_lesson_stats_with_department(self):
        """GET /api/hod/lesson-stats?departmentId=X&subject=Y should return lesson stats"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Subject is required for this endpoint
        response = requests.get(
            f"{BASE_URL}/api/hod/lesson-stats?departmentId={DEPARTMENT_ID}&subject=Science",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Should return stats (array or object)
        assert data is not None, "Response should not be null"
        print(f"PASS: GET /api/hod/lesson-stats?departmentId&subject returns stats: {type(data)}")


class TestValidateMultiset:
    """Test POST /api/tests/:id/validate-multiset still works correctly"""
    
    def test_validate_multiset_endpoint(self):
        """POST /api/tests/:id/validate-multiset should return capacity analysis"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # First get a test with blueprint
        response = requests.get(f"{BASE_URL}/api/tests", headers=headers)
        assert response.status_code == 200
        tests = response.json()
        
        # Find a test with blueprintId
        test_with_blueprint = None
        for t in tests:
            if t.get("blueprintId"):
                test_with_blueprint = t
                break
        
        if not test_with_blueprint:
            pytest.skip("No test with blueprint found for validate-multiset test")
        
        response = requests.post(
            f"{BASE_URL}/api/tests/{test_with_blueprint['id']}/validate-multiset",
            headers=headers,
            json={"setCount": 2}
        )
        # Should return 200 or 400 with validation info
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}, {response.text}"
        data = response.json()
        # Should have capacity analysis fields
        if response.status_code == 200:
            assert "sectionAnalysis" in data or "maxSetsNoOverlap" in data or "canGenerate" in data, \
                f"Missing expected fields in validate-multiset response: {list(data.keys())}"
        print(f"PASS: POST /api/tests/:id/validate-multiset returns status={response.status_code}")


class TestCheckDuplicate:
    """Test POST /api/questions/check-duplicate with departmentId works"""
    
    def test_check_duplicate_with_department(self):
        """POST /api/questions/check-duplicate with departmentId should work"""
        creds = CREDENTIALS["teacher"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/questions/check-duplicate",
            headers=headers,
            json={
                "content": "What is the capital of France?",
                "departmentId": DEPARTMENT_ID
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Should return duplicate check result
        assert "status" in data or "isDuplicate" in data or "result" in data, \
            f"Missing expected fields in check-duplicate response: {list(data.keys())}"
        print(f"PASS: POST /api/questions/check-duplicate with departmentId works")


class TestExportQuestions:
    """Test GET /api/export/questions with departmentId works"""
    
    def test_export_questions_with_department(self):
        """GET /api/export/questions?departmentId=X should return CSV"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/export/questions?departmentId={DEPARTMENT_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        # Should return CSV content
        content_type = response.headers.get("Content-Type", "")
        assert "text/csv" in content_type or "application/octet-stream" in content_type or response.text.startswith("ID,"), \
            f"Expected CSV content, got Content-Type: {content_type}"
        print(f"PASS: GET /api/export/questions?departmentId returns CSV ({len(response.text)} bytes)")


class TestSessionExpiry:
    """Test session expiry still works (401 SESSION_EXPIRED for expired tokens)"""
    
    def test_expired_token_returns_session_expired(self):
        """Expired token should return 401 with SESSION_EXPIRED code"""
        # First login to get a valid user ID
        creds = CREDENTIALS["student"]  # Student has 3h TTL
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        user_id = response.json()["user"]["id"]
        
        # Create a token with valid user ID but expired timestamp (4 hours ago for student)
        expired_timestamp = int(time.time() * 1000) - (4 * 60 * 60 * 1000)  # 4 hours ago
        fake_expired_token = f"token-{user_id}-{expired_timestamp}"
        headers = {"Authorization": f"Bearer {fake_expired_token}"}
        
        response = requests.get(f"{BASE_URL}/api/questions?departmentId={DEPARTMENT_ID}", headers=headers)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        # Should have SESSION_EXPIRED code
        assert data.get("code") == "SESSION_EXPIRED" or "expired" in data.get("error", "").lower(), \
            f"Expected SESSION_EXPIRED code, got: {data}"
        print(f"PASS: Expired token returns 401 with SESSION_EXPIRED")
    
    def test_valid_token_access(self):
        """Valid token should allow access to protected endpoints"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/questions?departmentId={DEPARTMENT_ID}", headers=headers)
        assert response.status_code == 200, f"Valid token should allow access, got {response.status_code}"
        print(f"PASS: Valid token allows access to protected endpoints")


class TestHodDashboardLoads:
    """Test HOD Dashboard loads correctly"""
    
    def test_hod_pending_questions(self):
        """GET /api/hod/questions/pending should work for HOD"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/hod/questions/pending", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"PASS: GET /api/hod/questions/pending returns {len(data)} pending questions")
    
    def test_blueprints_endpoint(self):
        """GET /api/blueprints should work for HOD"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"PASS: GET /api/blueprints returns {len(data)} blueprints")
    
    def test_my_departments_endpoint(self):
        """GET /api/my-departments should work for HOD"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/my-departments", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"PASS: GET /api/my-departments returns {len(data)} departments")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
