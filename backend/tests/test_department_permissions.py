"""
Test Suite: Department Permissions & Context Selector
Tests for Prashnakosh V1 - Department-based access control

Test Scenarios:
1. Login responses include departmentIds array
2. GET /api/my-departments returns enriched department info
3. Department-filtered queries work correctly
4. Security: Users cannot access departments they're not assigned to
5. POST endpoints require departmentId
6. Admin bypass works correctly
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
CREDENTIALS = {
    "super_admin": {
        "schoolCode": "SUPERADMIN",
        "email": "superadmin@safal.com",
        "password": "SuperAdmin@123"
    },
    "admin": {
        "schoolCode": "MVMCHN",
        "email": "admin@mvm.com",
        "password": "Admin@123"
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
    }
}

# Known department IDs from seed data
IX_SCIENCE_ID = "9e5da805-3d9b-4ab4-9ca5-c8b6a983a716"
X_SCIENCE_ID = "a5822520-0f9c-4225-b47e-86e8a453c5f7"


class TestLoginResponses:
    """Test 1-2: Login responses include departmentIds array"""
    
    def test_hod_login_includes_department_ids(self):
        """Test 1: Login as HOD - verify response includes departmentIds array and activeDepartmentId"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["hod"])
        assert response.status_code == 200, f"HOD login failed: {response.text}"
        
        data = response.json()
        assert "user" in data, "Response missing 'user' field"
        assert "token" in data, "Response missing 'token' field"
        
        user = data["user"]
        assert "departmentIds" in user, "User missing 'departmentIds' field"
        assert isinstance(user["departmentIds"], list), "departmentIds should be a list"
        assert len(user["departmentIds"]) >= 1, "HOD should have at least 1 department"
        
        # HOD should have activeDepartmentId
        assert "activeDepartmentId" in user, "User missing 'activeDepartmentId' field"
        assert user["activeDepartmentId"] is not None, "activeDepartmentId should not be None"
        
        # Verify the expected departments are present
        assert IX_SCIENCE_ID in user["departmentIds"], f"IX_Science ({IX_SCIENCE_ID}) not in HOD's departments"
        assert X_SCIENCE_ID in user["departmentIds"], f"X_Science ({X_SCIENCE_ID}) not in HOD's departments"
        
        print(f"✓ HOD login successful with {len(user['departmentIds'])} departments")
        print(f"  departmentIds: {user['departmentIds']}")
        print(f"  activeDepartmentId: {user['activeDepartmentId']}")
    
    def test_teacher_login_includes_department_ids(self):
        """Test 2: Login as Teacher - verify response includes departmentIds array"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["teacher"])
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        
        data = response.json()
        user = data["user"]
        
        assert "departmentIds" in user, "User missing 'departmentIds' field"
        assert isinstance(user["departmentIds"], list), "departmentIds should be a list"
        
        print(f"✓ Teacher login successful with {len(user['departmentIds'])} departments")
        print(f"  departmentIds: {user['departmentIds']}")


class TestMyDepartmentsEndpoint:
    """Test 3: GET /api/my-departments returns enriched department info"""
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["hod"])
        return response.json()["token"]
    
    def test_my_departments_returns_enriched_info(self, hod_token):
        """Test 3: GET /api/my-departments with HOD token - should return 2 departments with enriched info"""
        response = requests.get(
            f"{BASE_URL}/api/my-departments",
            headers={"Authorization": f"Bearer {hod_token}"}
        )
        assert response.status_code == 200, f"GET /api/my-departments failed: {response.text}"
        
        departments = response.json()
        assert isinstance(departments, list), "Response should be a list"
        assert len(departments) >= 2, f"HOD should have at least 2 departments, got {len(departments)}"
        
        # Check enriched fields
        for dept in departments:
            assert "departmentId" in dept, "Missing departmentId"
            assert "departmentName" in dept, "Missing departmentName"
            assert "className" in dept, "Missing className"
            assert "subjectName" in dept, "Missing subjectName"
            assert "role" in dept, "Missing role"
            assert "headRoleLabel" in dept, "Missing headRoleLabel"
            
            print(f"  Department: {dept['className']} - {dept['subjectName']} (role: {dept['role']})")
        
        # Verify IX_Science and X_Science are present
        dept_ids = [d["departmentId"] for d in departments]
        assert IX_SCIENCE_ID in dept_ids, "IX_Science not in HOD's departments"
        assert X_SCIENCE_ID in dept_ids, "X_Science not in HOD's departments"
        
        print(f"✓ GET /api/my-departments returned {len(departments)} enriched departments")


class TestDepartmentFilteredQueries:
    """Tests 4-6: Department-filtered queries work correctly"""
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["hod"])
        return response.json()["token"]
    
    def test_questions_with_department_filter(self, hod_token):
        """Test 4: GET /api/questions?departmentId=<IX_SCI_ID> with HOD token - should return empty array but NOT 403"""
        response = requests.get(
            f"{BASE_URL}/api/questions?departmentId={IX_SCIENCE_ID}",
            headers={"Authorization": f"Bearer {hod_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/questions?departmentId={IX_SCIENCE_ID} returned {len(data)} questions (empty is OK)")
    
    def test_blueprints_with_department_filter(self, hod_token):
        """Test 5: GET /api/blueprints?departmentId=<IX_SCI_ID> with HOD token - should return empty array but NOT 403"""
        response = requests.get(
            f"{BASE_URL}/api/blueprints?departmentId={IX_SCIENCE_ID}",
            headers={"Authorization": f"Bearer {hod_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/blueprints?departmentId={IX_SCIENCE_ID} returned {len(data)} blueprints (empty is OK)")
    
    def test_tests_with_department_filter(self, hod_token):
        """Test 6: GET /api/tests?departmentId=<IX_SCI_ID> with HOD token - should return empty array but NOT 403"""
        response = requests.get(
            f"{BASE_URL}/api/tests?departmentId={IX_SCIENCE_ID}",
            headers={"Authorization": f"Bearer {hod_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/tests?departmentId={IX_SCIENCE_ID} returned {len(data)} tests (empty is OK)")


class TestSecurityDepartmentAccess:
    """Tests 7-8: Security - Users cannot access departments they're not assigned to"""
    
    @pytest.fixture
    def teacher_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["teacher"])
        return response.json()["token"]
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["hod"])
        return response.json()["token"]
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        return response.json()["token"]
    
    @pytest.fixture
    def ix_english_id(self, admin_token):
        """Get IX_English department ID from admin API"""
        response = requests.get(
            f"{BASE_URL}/api/admin/departments",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if response.status_code != 200:
            pytest.skip("Could not fetch departments to find IX_English")
        
        departments = response.json()
        for dept in departments:
            # Look for IX_English department
            if "IX" in str(dept.get("name", "")) and "English" in str(dept.get("name", "")):
                return dept["id"]
            # Also check className and subjectName
            if dept.get("className") == "IX" and dept.get("subjectName") == "English":
                return dept["id"]
        
        # If not found by name, try to find any department not in HOD's list
        # HOD has IX_Science and X_Science
        for dept in departments:
            if dept["id"] not in [IX_SCIENCE_ID, X_SCIENCE_ID]:
                return dept["id"]
        
        pytest.skip("Could not find IX_English or any other department for negative test")
    
    def test_teacher_cannot_access_unassigned_department_questions(self, teacher_token, ix_english_id):
        """Test 7: SECURITY - GET /api/questions?departmentId=<IX_ENGLISH_ID> with Teacher token - should return 403"""
        response = requests.get(
            f"{BASE_URL}/api/questions?departmentId={ix_english_id}",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert response.status_code == 403, f"Expected 403 for unauthorized department access, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "error" in data, "Response should contain error message"
        assert "access" in data["error"].lower() or "department" in data["error"].lower(), \
            f"Error message should mention access/department: {data['error']}"
        
        print(f"✓ Teacher correctly denied access to unassigned department: {data['error']}")
    
    def test_hod_cannot_access_unassigned_department_blueprints(self, hod_token, ix_english_id):
        """Test 8: SECURITY - GET /api/blueprints?departmentId=<IX_ENGLISH_ID> with HOD token - should return 403"""
        response = requests.get(
            f"{BASE_URL}/api/blueprints?departmentId={ix_english_id}",
            headers={"Authorization": f"Bearer {hod_token}"}
        )
        assert response.status_code == 403, f"Expected 403 for unauthorized department access, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "error" in data, "Response should contain error message"
        print(f"✓ HOD correctly denied access to unassigned department: {data['error']}")


class TestDepartmentIdRequired:
    """Tests 9-10: POST endpoints require departmentId"""
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["hod"])
        return response.json()["token"]
    
    def test_post_questions_requires_department_id(self, hod_token):
        """Test 9: POST /api/questions without departmentId - should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/questions",
            headers={"Authorization": f"Bearer {hod_token}"},
            json={
                "content": "Test question without departmentId",
                "type": "mcq",
                "subject": "Science",
                "grade": "9",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": "A"
            }
        )
        assert response.status_code == 400, f"Expected 400 when departmentId missing, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "error" in data, "Response should contain error message"
        assert "departmentId" in data["error"].lower() or "required" in data["error"].lower(), \
            f"Error should mention departmentId is required: {data['error']}"
        
        print(f"✓ POST /api/questions correctly requires departmentId: {data['error']}")
    
    def test_post_blueprints_requires_department_id(self, hod_token):
        """Test 10: POST /api/blueprints without departmentId - should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/blueprints",
            headers={"Authorization": f"Bearer {hod_token}"},
            json={
                "name": "Test Blueprint",
                "subject": "Science",
                "grade": "9",
                "totalMarks": 40
            }
        )
        assert response.status_code == 400, f"Expected 400 when departmentId missing, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "error" in data, "Response should contain error message"
        assert "departmentId" in data["error"].lower() or "required" in data["error"].lower(), \
            f"Error should mention departmentId is required: {data['error']}"
        
        print(f"✓ POST /api/blueprints correctly requires departmentId: {data['error']}")


class TestAdminBypass:
    """Test 11: Admin can bypass department restrictions"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        return response.json()["token"]
    
    def test_admin_can_get_questions_without_department_filter(self, admin_token):
        """Test 11: Admin should be able to GET /api/questions without departmentId (admin bypass)"""
        response = requests.get(
            f"{BASE_URL}/api/questions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Admin should be able to get all questions, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Admin can access questions without department filter: {len(data)} questions returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
