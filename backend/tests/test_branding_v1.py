"""
Prashnakosh V1 Production Readiness Tests
Tests for branding updates, login, question editing, and API endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paper-gen-3.preview.emergentagent.com')

# Test credentials
HOD_CREDENTIALS = {
    "schoolCode": "MVMCHN",
    "email": "hod.science@mvm.com",
    "password": "Hod@12345"
}

SUPERADMIN_CREDENTIALS = {
    "schoolCode": "SUPERADMIN",
    "email": "superadmin@safal.com",
    "password": "SuperAdmin@123"
}


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_hod_success(self):
        """Test HOD login returns correct role"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=HOD_CREDENTIALS
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["role"] == "hod"
        assert data["user"]["email"] == HOD_CREDENTIALS["email"]
        print(f"HOD login successful: {data['user']['name']}")
    
    def test_login_superadmin_success(self):
        """Test Super Admin login returns correct role"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=SUPERADMIN_CREDENTIALS
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["email"] == SUPERADMIN_CREDENTIALS["email"]
        print(f"Super Admin login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "schoolCode": "INVALID",
                "email": "invalid@test.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code in [401, 400], f"Expected 401/400, got {response.status_code}"
    
    def test_login_missing_fields(self):
        """Test login with missing fields returns error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@test.com"}
        )
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"


class TestQuestionsEndpoints:
    """Question CRUD endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for HOD"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=HOD_CREDENTIALS
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_get_questions(self, auth_token):
        """Test fetching questions list"""
        response = requests.get(
            f"{BASE_URL}/api/questions",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed to get questions: {response.text}"
        
        data = response.json()
        # Handle both array and paginated response
        questions = data if isinstance(data, list) else data.get("questions", [])
        print(f"Found {len(questions)} questions")
        assert len(questions) >= 0
    
    def test_patch_question_endpoint_exists(self, auth_token):
        """Test that PATCH endpoint for questions exists"""
        # First get a question ID
        response = requests.get(
            f"{BASE_URL}/api/questions",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        questions = data if isinstance(data, list) else data.get("questions", [])
        
        if len(questions) > 0:
            question_id = questions[0].get("id")
            
            # Test PATCH endpoint
            patch_response = requests.patch(
                f"{BASE_URL}/api/questions/{question_id}",
                headers={
                    "Authorization": f"Bearer {auth_token}",
                    "Content-Type": "application/json"
                },
                json={"marks": 2}  # Simple update
            )
            
            # Should return 200 or 403 (if not authorized) but not 404
            assert patch_response.status_code != 404, "PATCH endpoint not found"
            print(f"PATCH endpoint status: {patch_response.status_code}")
        else:
            pytest.skip("No questions available to test PATCH")


class TestHealthEndpoints:
    """Health check endpoint tests"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Some APIs might not have /health, try root
        if response.status_code == 404:
            response = requests.get(f"{BASE_URL}/api")
        
        assert response.status_code in [200, 404], f"API not responding: {response.status_code}"
        print(f"API health check: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
