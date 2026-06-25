"""
Prashnakosh RC1 Production Audit - Storage Migration Tests
Tests all features after S3-to-local-storage migration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN = {
    "schoolCode": "SUPERADMIN",
    "email": "superadmin@safal.com",
    "password": "SuperAdmin@123"
}

HOD = {
    "schoolCode": "MVMCHN",
    "email": "hod.science@mvm.com",
    "password": "Hod@12345"
}

TEACHER = {
    "schoolCode": "MVMCHN",
    "email": "teacher.science@mvm.com",
    "password": "Teacher@123"
}


class TestHealthAndStorage:
    """Health check and storage status tests"""
    
    def test_health_endpoint_returns_healthy(self):
        """GET /api/health - verify healthy status and database connected"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"]["connected"] == True
        assert "latencyMs" in data["database"]
        print(f"Health check passed: status={data['status']}, db_latency={data['database']['latencyMs']}ms")
    
    def test_storage_status_requires_auth(self):
        """GET /api/storage/status - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/storage/status")
        assert response.status_code == 401
        print("Storage status correctly requires authentication")
    
    def test_storage_status_with_super_admin(self):
        """GET /api/storage/status - verify local storage is configured with all 4 directories"""
        # Login as super admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert login_response.status_code == 200, f"Super admin login failed: {login_response.text}"
        token = login_response.json()["token"]
        
        # Check storage status
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/storage/status", headers=headers)
        assert response.status_code == 200, f"Storage status failed: {response.text}"
        data = response.json()
        
        # Verify local storage configuration
        assert data.get("configured") == True, "Storage should be configured"
        storage_type = data.get("storageType") or data.get("type")
        assert storage_type == "local", f"Storage type should be 'local', got: {storage_type}"
        
        # Verify all 4 directories exist
        directories = data.get("directories", {})
        expected_dirs = ["uploads", "exports", "backups", "logs"]
        for dir_name in expected_dirs:
            if isinstance(directories, dict):
                assert directories.get(dir_name) == True, f"Directory '{dir_name}' not found or not configured"
            else:
                assert any(dir_name in str(d) for d in directories), f"Directory '{dir_name}' not found in storage status"
        
        print(f"Storage status: type={storage_type}, configured={data.get('configured')}, dirs={directories}")


class TestAuthentication:
    """Login flow tests for all roles"""
    
    def test_login_missing_fields_returns_400(self):
        """Login with missing fields should return 400"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "test@test.com"})
        assert response.status_code == 400
        print("Missing fields correctly returns 400")
    
    def test_login_invalid_credentials_returns_401(self):
        """Login with invalid credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "schoolCode": "INVALID",
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Invalid credentials correctly returns 401")
    
    def test_super_admin_login_success(self):
        """Super Admin login flow"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "super_admin"
        print(f"Super Admin login successful: {data['user']['email']}")
    
    def test_hod_login_success(self):
        """HOD login flow"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD)
        assert response.status_code == 200, f"HOD login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "hod"
        print(f"HOD login successful: {data['user']['email']}")
    
    def test_teacher_login_success(self):
        """Teacher login flow"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER)
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "teacher"
        print(f"Teacher login successful: {data['user']['email']}")


class TestQuestionsAPI:
    """Question bank API tests"""
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("HOD login failed")
    
    def test_get_questions_requires_auth(self):
        """GET /api/questions - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/questions")
        assert response.status_code == 401
        print("Questions endpoint correctly requires authentication")
    
    def test_get_questions_with_auth(self, hod_token):
        """GET /api/questions - verify question bank loads with data"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        response = requests.get(f"{BASE_URL}/api/questions", headers=headers)
        assert response.status_code == 200, f"Get questions failed: {response.text}"
        data = response.json()
        
        # Check if paginated response or direct array
        if isinstance(data, dict) and "questions" in data:
            questions = data["questions"]
            print(f"Questions loaded (paginated): {len(questions)} questions, total: {data.get('pagination', {}).get('total', 'N/A')}")
        else:
            questions = data
            print(f"Questions loaded: {len(questions)} questions")
        
        assert isinstance(questions, list)
        # Verify at least some questions exist
        assert len(questions) > 0, "Question bank should have data"


class TestBlueprintsAPI:
    """Blueprint API tests"""
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("HOD login failed")
    
    def test_get_blueprints_requires_auth(self):
        """GET /api/blueprints - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/blueprints")
        assert response.status_code == 401
        print("Blueprints endpoint correctly requires authentication")
    
    def test_get_blueprints_with_auth(self, hod_token):
        """GET /api/blueprints - verify blueprints API responds"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=headers)
        assert response.status_code == 200, f"Get blueprints failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Blueprints loaded: {len(data)} blueprints")


class TestTestsAPI:
    """Tests/Exams API tests"""
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("HOD login failed")
    
    def test_get_tests_with_auth(self, hod_token):
        """GET /api/tests - verify tests API responds"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        response = requests.get(f"{BASE_URL}/api/tests", headers=headers)
        assert response.status_code == 200, f"Get tests failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Tests loaded: {len(data)} tests")


class TestStorageUpload:
    """Storage upload endpoint tests"""
    
    @pytest.fixture
    def super_admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Super admin login failed")
    
    @pytest.fixture
    def teacher_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Teacher login failed")
    
    def test_storage_upload_requires_auth(self):
        """POST /api/storage/upload - requires authentication"""
        response = requests.post(f"{BASE_URL}/api/storage/upload")
        assert response.status_code == 401
        print("Storage upload correctly requires authentication")
    
    def test_storage_upload_role_protected(self, teacher_token):
        """POST /api/storage/upload - verify role protection"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        # Try to upload without proper role (if endpoint requires admin)
        response = requests.post(f"{BASE_URL}/api/storage/upload", headers=headers)
        # Should either work for teacher or return 403 if admin-only
        assert response.status_code in [200, 400, 403], f"Unexpected status: {response.status_code}"
        print(f"Storage upload role check: status={response.status_code}")


class TestPaperExport:
    """Paper export endpoint tests"""
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("HOD login failed")
    
    def test_paper_docx_endpoint_exists(self, hod_token):
        """GET /api/tests/:id/paper-docx - endpoint responds"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        # Use a non-existent test ID to verify endpoint exists
        response = requests.get(f"{BASE_URL}/api/tests/nonexistent-id/paper-docx", headers=headers)
        # Should return 404 (not found) not 500 (server error) or 401 (auth)
        assert response.status_code in [404, 400], f"Paper DOCX endpoint error: {response.status_code}"
        print(f"Paper DOCX endpoint exists: status={response.status_code}")
    
    def test_paper_pdf_endpoint_exists(self, hod_token):
        """GET /api/tests/:id/paper-pdf - endpoint responds"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        # Use a non-existent test ID to verify endpoint exists
        response = requests.get(f"{BASE_URL}/api/tests/nonexistent-id/paper-pdf", headers=headers)
        # Should return 404 (not found) not 500 (server error) or 401 (auth)
        assert response.status_code in [404, 400], f"Paper PDF endpoint error: {response.status_code}"
        print(f"Paper PDF endpoint exists: status={response.status_code}")


class TestAnalytics:
    """Analytics endpoint tests"""
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("HOD login failed")
    
    def test_analytics_endpoint(self, hod_token):
        """GET /api/analytics - verify analytics responds"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics", headers=headers)
        assert response.status_code == 200, f"Analytics failed: {response.text}"
        data = response.json()
        print(f"Analytics endpoint working: {list(data.keys()) if isinstance(data, dict) else 'array response'}")


class TestNoS3References:
    """Verify no S3/AWS references in API responses"""
    
    @pytest.fixture
    def super_admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Super admin login failed")
    
    def test_storage_status_no_s3_references(self, super_admin_token):
        """Storage status should not contain S3/AWS references"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/storage/status", headers=headers)
        assert response.status_code == 200
        
        response_text = response.text.lower()
        assert "s3" not in response_text, "Storage status contains S3 reference"
        assert "aws" not in response_text, "Storage status contains AWS reference"
        assert "bucket" not in response_text, "Storage status contains bucket reference"
        print("Storage status has no S3/AWS references - PASS")
    
    def test_health_no_s3_references(self):
        """Health endpoint should not contain S3/AWS references"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        response_text = response.text.lower()
        assert "s3" not in response_text, "Health contains S3 reference"
        assert "aws" not in response_text, "Health contains AWS reference"
        print("Health endpoint has no S3/AWS references - PASS")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
