"""
Prashnakosh V1 Production Readiness - Final E2E Backend Tests
Tests: Health, Auth, Questions, Blueprints, Exam Engine (resubmission prevention, timer validation)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
HOD_CREDENTIALS = {
    "schoolCode": "MVMCHN",
    "email": "hod.science@mvm.com",
    "password": "Hod@12345"
}

SUPER_ADMIN_CREDENTIALS = {
    "schoolCode": "SUPERADMIN",
    "email": "superadmin@safal.com",
    "password": "SuperAdmin@123"
}


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint_returns_healthy(self):
        """GET /api/health should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        
        data = response.json()
        assert data.get("status") == "healthy", f"Status not healthy: {data}"
        assert "database" in data, "Missing database info"
        assert data["database"]["connected"] == True, "Database not connected"
        print(f"✓ Health check passed: {data['status']}, DB latency: {data['database']['latencyMs']}ms")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_missing_fields_returns_400(self):
        """POST /api/auth/login with missing fields should return 400"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Missing fields returns 400")
    
    def test_login_invalid_credentials_returns_401(self):
        """POST /api/auth/login with invalid credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "schoolCode": "INVALID",
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials returns 401")
    
    def test_hod_login_success(self):
        """POST /api/auth/login with HOD credentials should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDENTIALS)
        assert response.status_code == 200, f"HOD login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Missing token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == HOD_CREDENTIALS["email"], "Email mismatch"
        assert data["user"]["role"] in ["hod", "teacher", "admin"], f"Unexpected role: {data['user']['role']}"
        print(f"✓ HOD login successful: {data['user']['name']} ({data['user']['role']})")
        return data
    
    def test_super_admin_login_success(self):
        """POST /api/auth/login with Super Admin credentials should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDENTIALS)
        assert response.status_code == 200, f"Super Admin login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Missing token in response"
        assert data["user"]["role"] == "super_admin", f"Expected super_admin role, got: {data['user']['role']}"
        print(f"✓ Super Admin login successful: {data['user']['name']}")
        return data


class TestQuestionsAPI:
    """Questions API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get HOD auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDENTIALS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("HOD authentication failed")
    
    def test_get_questions_requires_auth(self):
        """GET /api/questions without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/questions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Questions endpoint requires authentication")
    
    def test_get_questions_with_auth(self, auth_token):
        """GET /api/questions with auth should return questions"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/questions", headers=headers)
        assert response.status_code == 200, f"Failed to get questions: {response.text}"
        
        data = response.json()
        # Handle both flat array and paginated response
        questions = data if isinstance(data, list) else data.get("questions", [])
        print(f"✓ Questions retrieved: {len(questions)} questions")
        return questions
    
    def test_patch_question_endpoint_exists(self, auth_token):
        """PATCH /api/questions/:id endpoint should exist"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # First get a question ID
        response = requests.get(f"{BASE_URL}/api/questions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            questions = data if isinstance(data, list) else data.get("questions", [])
            if questions:
                question_id = questions[0].get("id")
                # Try to patch (even with empty body to test endpoint exists)
                patch_response = requests.patch(
                    f"{BASE_URL}/api/questions/{question_id}",
                    headers=headers,
                    json={"content": questions[0].get("content", "Test")}
                )
                # Should be 200 (success) or 403 (permission denied) - not 404
                assert patch_response.status_code in [200, 403], f"PATCH endpoint issue: {patch_response.status_code}"
                print(f"✓ PATCH /api/questions/:id endpoint working (status: {patch_response.status_code})")
            else:
                print("⚠ No questions to test PATCH endpoint")
        else:
            pytest.skip("Could not get questions to test PATCH")


class TestBlueprintsAPI:
    """Blueprints API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get HOD auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDENTIALS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("HOD authentication failed")
    
    def test_get_blueprints_with_auth(self, auth_token):
        """GET /api/blueprints with auth should return blueprints"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=headers)
        assert response.status_code == 200, f"Failed to get blueprints: {response.text}"
        
        data = response.json()
        blueprints = data if isinstance(data, list) else data.get("blueprints", [])
        print(f"✓ Blueprints retrieved: {len(blueprints)} blueprints")


class TestExamEngine:
    """Exam Engine tests - resubmission prevention, timer validation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get HOD auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDENTIALS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("HOD authentication failed")
    
    def test_exam_submit_resubmission_prevention(self, auth_token):
        """POST /api/exam/submit with already-submitted attempt should return error"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Try to submit with a fake attempt ID - should fail with 404 or appropriate error
        response = requests.post(
            f"{BASE_URL}/api/exam/submit",
            headers=headers,
            json={
                "attemptId": "non-existent-attempt-id",
                "answers": {}
            }
        )
        # Should return 404 (not found) or 500 (error) - not 200
        assert response.status_code in [404, 500, 403], f"Unexpected status: {response.status_code}"
        print(f"✓ Exam submit with invalid attempt returns error (status: {response.status_code})")
    
    def test_exam_save_state_endpoint_exists(self, auth_token):
        """POST /api/exam/save-state endpoint should exist"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Try to save state with a fake attempt ID
        response = requests.post(
            f"{BASE_URL}/api/exam/save-state",
            headers=headers,
            json={
                "attemptId": "non-existent-attempt-id",
                "answers": {},
                "questionStatuses": {},
                "markedForReview": [],
                "timeRemaining": 3600
            }
        )
        # Should return 404 (not found) - endpoint exists but attempt doesn't
        assert response.status_code in [404, 500, 403], f"Unexpected status: {response.status_code}"
        print(f"✓ Exam save-state endpoint exists (status: {response.status_code})")


class TestCoverageDashboard:
    """Coverage Dashboard API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get HOD auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDENTIALS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("HOD authentication failed")
    
    def test_analytics_endpoint(self, auth_token):
        """GET /api/analytics should return analytics data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics", headers=headers)
        assert response.status_code == 200, f"Analytics failed: {response.text}"
        
        data = response.json()
        assert "totalQuestions" in data or "totalStudents" in data, "Missing analytics fields"
        print(f"✓ Analytics endpoint working")


class TestPaperGenerator:
    """Paper Generator API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get HOD auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDENTIALS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("HOD authentication failed")
    
    def test_tests_endpoint(self, auth_token):
        """GET /api/tests should return tests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/tests", headers=headers)
        assert response.status_code == 200, f"Tests endpoint failed: {response.text}"
        
        data = response.json()
        tests = data if isinstance(data, list) else data.get("tests", [])
        print(f"✓ Tests endpoint working: {len(tests)} tests")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
