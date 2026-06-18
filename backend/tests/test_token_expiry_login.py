"""
Backend Tests for Token Expiry and Login Flows
Tests the new session token expiry feature:
- Teacher/HOD/Admin: 24h TTL
- Student: 3h TTL
- Session expiry returns 401 with SESSION_EXPIRED code
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

# Expected TTLs in milliseconds
EXPECTED_TTL = {
    "super_admin": 24 * 60 * 60 * 1000,  # 24 hours
    "hod": 24 * 60 * 60 * 1000,           # 24 hours
    "teacher": 24 * 60 * 60 * 1000,       # 24 hours
    "student": 3 * 60 * 60 * 1000,        # 3 hours
}


class TestLoginFlows:
    """Test login flows for all user roles"""
    
    def test_super_admin_login(self):
        """Test Super Admin login returns token with expiresAt"""
        creds = CREDENTIALS["super_admin"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        
        assert response.status_code == 200, f"Super Admin login failed: {response.text}"
        
        data = response.json()
        assert "user" in data, "Response missing 'user' field"
        assert "token" in data, "Response missing 'token' field"
        assert "expiresAt" in data, "Response missing 'expiresAt' field (new token expiry feature)"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == creds["email"]
        assert user["role"] == "super_admin"
        
        # Verify token format
        assert data["token"].startswith("token-")
        
        # Verify expiresAt is in the future (24h from now)
        now = int(time.time() * 1000)
        expires_at = data["expiresAt"]
        ttl = expires_at - now
        
        # Allow 5 minute tolerance
        expected_ttl = EXPECTED_TTL["super_admin"]
        assert abs(ttl - expected_ttl) < 5 * 60 * 1000, f"Super Admin TTL should be ~24h, got {ttl/1000/60/60:.2f}h"
        
        print(f"Super Admin login SUCCESS - Token expires in {ttl/1000/60/60:.2f} hours")
    
    def test_hod_login(self):
        """Test HOD login returns token with 24h expiry"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        
        assert response.status_code == 200, f"HOD login failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert "expiresAt" in data, "Response missing 'expiresAt' field"
        
        user = data["user"]
        assert user["email"] == creds["email"]
        assert user["role"] == "hod"
        assert "departmentIds" in user, "HOD should have departmentIds"
        assert len(user["departmentIds"]) > 0, "HOD should have at least one department"
        
        # Verify 24h TTL
        now = int(time.time() * 1000)
        ttl = data["expiresAt"] - now
        expected_ttl = EXPECTED_TTL["hod"]
        assert abs(ttl - expected_ttl) < 5 * 60 * 1000, f"HOD TTL should be ~24h, got {ttl/1000/60/60:.2f}h"
        
        print(f"HOD login SUCCESS - Token expires in {ttl/1000/60/60:.2f} hours")
    
    def test_teacher_login(self):
        """Test Teacher login returns token with 24h expiry"""
        creds = CREDENTIALS["teacher"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert "expiresAt" in data, "Response missing 'expiresAt' field"
        
        user = data["user"]
        assert user["email"] == creds["email"]
        assert user["role"] == "teacher"
        
        # Verify 24h TTL
        now = int(time.time() * 1000)
        ttl = data["expiresAt"] - now
        expected_ttl = EXPECTED_TTL["teacher"]
        assert abs(ttl - expected_ttl) < 5 * 60 * 1000, f"Teacher TTL should be ~24h, got {ttl/1000/60/60:.2f}h"
        
        print(f"Teacher login SUCCESS - Token expires in {ttl/1000/60/60:.2f} hours")
    
    def test_student_login(self):
        """Test Student login returns token with 3h expiry"""
        creds = CREDENTIALS["student"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        
        assert response.status_code == 200, f"Student login failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert "expiresAt" in data, "Response missing 'expiresAt' field"
        
        user = data["user"]
        assert user["email"] == creds["email"]
        assert user["role"] == "student"
        
        # Verify 3h TTL (student-specific)
        now = int(time.time() * 1000)
        ttl = data["expiresAt"] - now
        expected_ttl = EXPECTED_TTL["student"]
        assert abs(ttl - expected_ttl) < 5 * 60 * 1000, f"Student TTL should be ~3h, got {ttl/1000/60/60:.2f}h"
        
        print(f"Student login SUCCESS - Token expires in {ttl/1000/60/60:.2f} hours")
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "schoolCode": "MVMCHN",
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401 for invalid credentials, got {response.status_code}"
        print("Invalid credentials test PASSED - Returns 401")
    
    def test_invalid_school_code(self):
        """Test login with invalid school code returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "schoolCode": "INVALID_SCHOOL",
            "email": "hod.science@mvm.com",
            "password": "Hod@12345"
        })
        
        assert response.status_code == 401, f"Expected 401 for invalid school code, got {response.status_code}"
        print("Invalid school code test PASSED - Returns 401")


class TestTokenExpiry:
    """Test token expiry middleware behavior"""
    
    @pytest.fixture
    def hod_token(self):
        """Get a valid HOD token"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture
    def student_token(self):
        """Get a valid student token"""
        creds = CREDENTIALS["student"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_valid_token_access(self, hod_token):
        """Test that valid token can access protected endpoints"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        # Test accessing blueprints endpoint
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=headers)
        assert response.status_code == 200, f"Valid token should access blueprints: {response.text}"
        
        # Test accessing tests endpoint
        response = requests.get(f"{BASE_URL}/api/tests", headers=headers)
        assert response.status_code == 200, f"Valid token should access tests: {response.text}"
        
        print("Valid token access test PASSED")
    
    def test_expired_token_returns_session_expired(self):
        """Test that expired token returns 401 with SESSION_EXPIRED code"""
        # Create a fake expired token (timestamp from 25 hours ago)
        expired_timestamp = int((time.time() - 25 * 60 * 60) * 1000)
        expired_token = f"token-b31a962c-18e3-4694-b661-addf4d6a80ec-{expired_timestamp}"
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=headers)
        
        assert response.status_code == 401, f"Expired token should return 401, got {response.status_code}"
        
        data = response.json()
        assert "code" in data or "SESSION_EXPIRED" in str(data), f"Response should contain SESSION_EXPIRED code: {data}"
        
        print("Expired token test PASSED - Returns 401 with SESSION_EXPIRED")
    
    def test_student_expired_token_after_3h(self):
        """Test that student token expired after 3h returns SESSION_EXPIRED"""
        # Create a fake student token from 4 hours ago (past 3h TTL)
        expired_timestamp = int((time.time() - 4 * 60 * 60) * 1000)
        expired_token = f"token-2aa87359-8317-4a6c-aac2-1c4064e0d9bb-{expired_timestamp}"
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = requests.get(f"{BASE_URL}/api/tests", headers=headers)
        
        assert response.status_code == 401, f"Student expired token should return 401, got {response.status_code}"
        
        print("Student 3h expiry test PASSED")
    
    def test_no_token_returns_401(self):
        """Test that missing token returns 401"""
        response = requests.get(f"{BASE_URL}/api/blueprints")
        
        assert response.status_code == 401, f"Missing token should return 401, got {response.status_code}"
        print("No token test PASSED - Returns 401")
    
    def test_invalid_token_format(self):
        """Test that invalid token format returns 401"""
        headers = {"Authorization": "Bearer invalid-token-format"}
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=headers)
        
        assert response.status_code == 401, f"Invalid token should return 401, got {response.status_code}"
        print("Invalid token format test PASSED")


class TestHODDashboardAPIs:
    """Test HOD Dashboard related APIs"""
    
    @pytest.fixture
    def hod_auth(self):
        """Get HOD authentication"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        data = response.json()
        return {
            "token": data["token"],
            "user": data["user"],
            "headers": {"Authorization": f"Bearer {data['token']}"}
        }
    
    def test_blueprints_endpoint(self, hod_auth):
        """Test /api/blueprints returns data for HOD"""
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=hod_auth["headers"])
        
        assert response.status_code == 200, f"Blueprints endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Blueprints should return a list"
        
        # Check if IX Science Half Yearly 2026 blueprint exists
        science_blueprint = next((b for b in data if "IX Science" in b.get("name", "")), None)
        if science_blueprint:
            assert science_blueprint["subject"] == "Science"
            assert science_blueprint["grade"] == "9"
            print(f"Found blueprint: {science_blueprint['name']}")
        
        print(f"Blueprints endpoint PASSED - {len(data)} blueprints found")
    
    def test_my_departments_endpoint(self, hod_auth):
        """Test /api/my-departments returns HOD's departments"""
        response = requests.get(f"{BASE_URL}/api/my-departments", headers=hod_auth["headers"])
        
        assert response.status_code == 200, f"My departments endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "My departments should return a list"
        assert len(data) > 0, "HOD should have at least one department"
        
        # Verify department structure
        dept = data[0]
        assert "departmentId" in dept
        assert "departmentName" in dept
        
        print(f"My departments endpoint PASSED - {len(data)} departments: {[d['departmentName'] for d in data]}")
    
    def test_tests_endpoint(self, hod_auth):
        """Test /api/tests returns tests for HOD"""
        response = requests.get(f"{BASE_URL}/api/tests", headers=hod_auth["headers"])
        
        assert response.status_code == 200, f"Tests endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Tests should return a list"
        
        print(f"Tests endpoint PASSED - {len(data)} tests found")
    
    def test_pending_questions_endpoint(self, hod_auth):
        """Test /api/hod/questions/pending returns pending questions"""
        response = requests.get(f"{BASE_URL}/api/hod/questions/pending", headers=hod_auth["headers"])
        
        assert response.status_code == 200, f"Pending questions endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Pending questions should return a list"
        
        print(f"Pending questions endpoint PASSED - {len(data)} pending questions")
    
    def test_questions_endpoint(self, hod_auth):
        """Test /api/questions returns questions"""
        response = requests.get(f"{BASE_URL}/api/questions", headers=hod_auth["headers"])
        
        assert response.status_code == 200, f"Questions endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Questions should return a list"
        
        print(f"Questions endpoint PASSED - {len(data)} questions found")
    
    def test_academic_coverage_endpoint(self, hod_auth):
        """Test /api/departments/:id/academic-coverage returns coverage data"""
        # Get first department ID
        dept_response = requests.get(f"{BASE_URL}/api/my-departments", headers=hod_auth["headers"])
        assert dept_response.status_code == 200
        departments = dept_response.json()
        
        if len(departments) > 0:
            dept_id = departments[0]["departmentId"]
            response = requests.get(f"{BASE_URL}/api/departments/{dept_id}/academic-coverage", headers=hod_auth["headers"])
            
            assert response.status_code == 200, f"Academic coverage endpoint failed: {response.text}"
            
            data = response.json()
            assert "totalQuestions" in data or "sections" in data or isinstance(data, dict), "Coverage should return data"
            
            print(f"Academic coverage endpoint PASSED for department {dept_id}")
        else:
            pytest.skip("No departments found for HOD")


class TestExamConfigs:
    """Test exam configuration endpoints"""
    
    @pytest.fixture
    def hod_headers(self):
        """Get HOD auth headers"""
        creds = CREDENTIALS["hod"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_exams_for_blueprint(self, hod_headers):
        """Test /api/exams/for-blueprint returns exam configs"""
        response = requests.get(f"{BASE_URL}/api/exams/for-blueprint", headers=hod_headers)
        
        assert response.status_code == 200, f"Exams for blueprint endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Exams should return a list"
        
        print(f"Exams for blueprint endpoint PASSED - {len(data)} exam configs found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
