"""
Test Wing RC1 Features:
- Wings API for SuperAdmin
- User creation with wing selection for Teachers/HODs
- Auto-seeding of default wings on school creation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paper-gen-3.preview.emergentagent.com').rstrip('/')

# Test credentials from test_credentials.md
SUPER_ADMIN_CREDS = {
    "schoolCode": "SUPERADMIN",
    "email": "superadmin@safal.com",
    "password": "SuperAdmin@123"
}

# Known school IDs
MVMCHN_SCHOOL_ID = "f09533f9-49ed-460f-b6fb-fcf9fdba009e"
SCH001_SCHOOL_ID = "372b7d09-7b5a-4cfd-8080-14901c8e2276"


class TestWingRC1:
    """Wing RC1 Feature Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as super admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        data = login_response.json()
        self.token = data.get("token")
        assert self.token, "No token in login response"
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        print(f"Logged in as super admin, token obtained")
    
    def test_01_health_check(self):
        """Test health endpoint"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database", {}).get("connected") == True
        print("Health check passed")
    
    def test_02_get_wings_for_mvmchn(self):
        """Test GET /api/superadmin/wings?schoolId=MVMCHN returns at least 4 wings"""
        response = self.session.get(f"{BASE_URL}/api/superadmin/wings?schoolId={MVMCHN_SCHOOL_ID}")
        assert response.status_code == 200, f"Failed to get wings: {response.text}"
        
        wings = response.json()
        assert isinstance(wings, list), "Wings should be a list"
        assert len(wings) >= 4, f"Expected at least 4 wings, got {len(wings)}"
        
        # Check for expected wing names
        wing_names = [w.get("name", "").lower() for w in wings]
        expected_wings = ["primary", "middle", "secondary", "senior_secondary"]
        
        for expected in expected_wings:
            assert expected in wing_names, f"Missing wing: {expected}. Found: {wing_names}"
        
        print(f"Found {len(wings)} wings for MVMCHN: {wing_names}")
    
    def test_03_get_schools_list(self):
        """Test GET /api/superadmin/schools returns schools"""
        response = self.session.get(f"{BASE_URL}/api/superadmin/schools")
        assert response.status_code == 200, f"Failed to get schools: {response.text}"
        
        schools = response.json()
        assert isinstance(schools, list), "Schools should be a list"
        assert len(schools) >= 1, "Should have at least one school"
        
        # Check MVMCHN exists
        mvmchn = next((s for s in schools if s.get("id") == MVMCHN_SCHOOL_ID), None)
        assert mvmchn is not None, "MVMCHN school not found"
        assert mvmchn.get("code") == "MVMCHN", f"Expected code MVMCHN, got {mvmchn.get('code')}"
        
        print(f"Found {len(schools)} schools, MVMCHN verified")
    
    def test_04_create_teacher_with_wing(self):
        """Test creating a teacher with wing and subjects selection"""
        # First get wings for MVMCHN
        wings_response = self.session.get(f"{BASE_URL}/api/superadmin/wings?schoolId={MVMCHN_SCHOOL_ID}")
        assert wings_response.status_code == 200
        wings = wings_response.json()
        assert len(wings) > 0, "No wings available"
        
        # Pick the first wing
        wing_id = wings[0].get("id")
        wing_name = wings[0].get("displayName") or wings[0].get("name")
        
        # Create a test teacher
        unique_email = f"test_teacher_{uuid.uuid4().hex[:8]}@test.com"
        teacher_data = {
            "tenantId": MVMCHN_SCHOOL_ID,
            "email": unique_email,
            "name": "Test Teacher RC1",
            "password": "TestTeacher@123",
            "role": "teacher",
            "wingId": wing_id,
            "subjects": ["Mathematics", "Science"]
        }
        
        response = self.session.post(f"{BASE_URL}/api/superadmin/users", json=teacher_data)
        assert response.status_code == 201, f"Failed to create teacher: {response.text}"
        
        created_user = response.json()
        assert created_user.get("email") == unique_email
        assert created_user.get("role") == "teacher"
        assert created_user.get("wingId") == wing_id
        assert "Mathematics" in created_user.get("subjects", [])
        
        print(f"Created teacher {unique_email} with wing {wing_name}")
        
        # Cleanup - delete the test user
        user_id = created_user.get("id")
        if user_id:
            delete_response = self.session.delete(f"{BASE_URL}/api/superadmin/users/{user_id}")
            assert delete_response.status_code == 200, f"Failed to delete test user: {delete_response.text}"
            print(f"Cleaned up test teacher {user_id}")
    
    def test_05_create_hod_with_wing(self):
        """Test creating an HOD with wing selection"""
        # Get wings for MVMCHN
        wings_response = self.session.get(f"{BASE_URL}/api/superadmin/wings?schoolId={MVMCHN_SCHOOL_ID}")
        assert wings_response.status_code == 200
        wings = wings_response.json()
        assert len(wings) > 0, "No wings available"
        
        # Pick a wing (use secondary if available)
        wing = next((w for w in wings if "secondary" in w.get("name", "").lower()), wings[0])
        wing_id = wing.get("id")
        
        # Create a test HOD
        unique_email = f"test_hod_{uuid.uuid4().hex[:8]}@test.com"
        hod_data = {
            "tenantId": MVMCHN_SCHOOL_ID,
            "email": unique_email,
            "name": "Test HOD RC1",
            "password": "TestHOD@123",
            "role": "hod",
            "wingId": wing_id,
            "subjects": ["Physics", "Chemistry"]
        }
        
        response = self.session.post(f"{BASE_URL}/api/superadmin/users", json=hod_data)
        assert response.status_code == 201, f"Failed to create HOD: {response.text}"
        
        created_user = response.json()
        assert created_user.get("email") == unique_email
        assert created_user.get("role") == "hod"
        # Note: HOD may or may not have wingId based on implementation
        
        print(f"Created HOD {unique_email}")
        
        # Cleanup
        user_id = created_user.get("id")
        if user_id:
            delete_response = self.session.delete(f"{BASE_URL}/api/superadmin/users/{user_id}")
            assert delete_response.status_code == 200
            print(f"Cleaned up test HOD {user_id}")
    
    def test_06_teacher_requires_wing(self):
        """Test that creating a teacher without wing fails"""
        unique_email = f"test_teacher_nowng_{uuid.uuid4().hex[:8]}@test.com"
        teacher_data = {
            "tenantId": MVMCHN_SCHOOL_ID,
            "email": unique_email,
            "name": "Test Teacher No Wing",
            "password": "TestTeacher@123",
            "role": "teacher",
            # Missing wingId
            "subjects": ["Mathematics"]
        }
        
        response = self.session.post(f"{BASE_URL}/api/superadmin/users", json=teacher_data)
        # Should fail with 400
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        error_data = response.json()
        assert "wing" in error_data.get("error", "").lower() or "wingId" in error_data.get("error", "").lower(), \
            f"Error should mention wing requirement: {error_data}"
        
        print("Correctly rejected teacher without wing")
    
    def test_07_teacher_requires_subjects(self):
        """Test that creating a teacher without subjects fails"""
        # Get a wing first
        wings_response = self.session.get(f"{BASE_URL}/api/superadmin/wings?schoolId={MVMCHN_SCHOOL_ID}")
        wings = wings_response.json()
        wing_id = wings[0].get("id") if wings else None
        
        unique_email = f"test_teacher_nosubj_{uuid.uuid4().hex[:8]}@test.com"
        teacher_data = {
            "tenantId": MVMCHN_SCHOOL_ID,
            "email": unique_email,
            "name": "Test Teacher No Subjects",
            "password": "TestTeacher@123",
            "role": "teacher",
            "wingId": wing_id,
            "subjects": []  # Empty subjects
        }
        
        response = self.session.post(f"{BASE_URL}/api/superadmin/users", json=teacher_data)
        # Should fail with 400
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        error_data = response.json()
        assert "subject" in error_data.get("error", "").lower(), \
            f"Error should mention subject requirement: {error_data}"
        
        print("Correctly rejected teacher without subjects")
    
    def test_08_wing_crud_operations(self):
        """Test wing CRUD operations"""
        # Create a new wing
        wing_data = {
            "tenantId": MVMCHN_SCHOOL_ID,
            "name": f"test_wing_{uuid.uuid4().hex[:6]}",
            "displayName": "Test Wing RC1",
            "grades": ["1", "2"]
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/superadmin/wings", json=wing_data)
        assert create_response.status_code == 201, f"Failed to create wing: {create_response.text}"
        
        created_wing = create_response.json()
        wing_id = created_wing.get("id")
        assert wing_id, "No wing ID returned"
        assert created_wing.get("displayName") == "Test Wing RC1"
        print(f"Created test wing: {wing_id}")
        
        # Update the wing
        update_response = self.session.patch(f"{BASE_URL}/api/superadmin/wings/{wing_id}", json={
            "displayName": "Test Wing RC1 Updated"
        })
        assert update_response.status_code == 200, f"Failed to update wing: {update_response.text}"
        
        updated_wing = update_response.json()
        assert updated_wing.get("displayName") == "Test Wing RC1 Updated"
        print(f"Updated wing displayName")
        
        # Delete the wing
        delete_response = self.session.delete(f"{BASE_URL}/api/superadmin/wings/{wing_id}")
        assert delete_response.status_code == 200, f"Failed to delete wing: {delete_response.text}"
        print(f"Deleted test wing: {wing_id}")
    
    def test_09_school_creation_auto_seeds_wings(self):
        """Test that creating a new school auto-seeds default wings"""
        # Create a new school
        unique_code = f"TST{uuid.uuid4().hex[:4].upper()}"
        school_data = {
            "name": f"Test School {unique_code}",
            "code": unique_code
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/superadmin/schools", json=school_data)
        assert create_response.status_code == 201, f"Failed to create school: {create_response.text}"
        
        created_school = create_response.json()
        school_id = created_school.get("id")
        assert school_id, "No school ID returned"
        print(f"Created test school: {school_id} ({unique_code})")
        
        # Check that wings were auto-seeded
        wings_response = self.session.get(f"{BASE_URL}/api/superadmin/wings?schoolId={school_id}")
        assert wings_response.status_code == 200, f"Failed to get wings: {wings_response.text}"
        
        wings = wings_response.json()
        assert len(wings) >= 4, f"Expected at least 4 auto-seeded wings, got {len(wings)}"
        
        wing_names = [w.get("name", "").lower() for w in wings]
        expected_wings = ["primary", "middle", "secondary", "senior_secondary"]
        
        for expected in expected_wings:
            assert expected in wing_names, f"Missing auto-seeded wing: {expected}. Found: {wing_names}"
        
        print(f"Verified {len(wings)} auto-seeded wings for new school")
        
        # Cleanup - delete the test school
        delete_response = self.session.delete(f"{BASE_URL}/api/superadmin/schools/{school_id}")
        assert delete_response.status_code == 200, f"Failed to delete test school: {delete_response.text}"
        print(f"Cleaned up test school: {school_id}")
    
    def test_10_get_users_for_school(self):
        """Test GET /api/superadmin/users returns users for a school"""
        response = self.session.get(f"{BASE_URL}/api/superadmin/users?schoolId={MVMCHN_SCHOOL_ID}")
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        
        users = response.json()
        assert isinstance(users, list), "Users should be a list"
        print(f"Found {len(users)} users for MVMCHN")
        
        # Check that super_admin users are filtered out
        super_admins = [u for u in users if u.get("role") == "super_admin"]
        assert len(super_admins) == 0, "Super admin users should be filtered out"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
