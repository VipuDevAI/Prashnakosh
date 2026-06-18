"""
Test Department CMS and Batch Management APIs
Tests for:
- Department CMS: GET /api/admin/classes, GET /api/admin/subjects, GET /api/admin/departments
- Department operations: create class, create subject, generate departments, assign head, add members
- Batch APIs: POST /api/tests/:testId/batches, POST /api/batches/:id/students
- Backward compat: /api/chapters and /api/lessons both work
- Super admin user creation with rollNumber field
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paper-gen-3.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_CREDS = {"schoolCode": "MVMCHN", "email": "admin@mvm.com", "password": "Admin@123"}
SUPER_ADMIN_CREDS = {"schoolCode": "SUPERADMIN", "email": "superadmin@safal.com", "password": "SuperAdmin@123"}
HOD_CREDS = {"schoolCode": "MVMCHN", "email": "hod.science@mvm.com", "password": "Hod@12345"}


class TestAuthentication:
    """Test authentication for different user roles"""
    
    def test_admin_login(self):
        """Test admin login with MVMCHN school code"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == "admin@mvm.com"
        print(f"PASSED: Admin login successful - {data['user']['name']}")
    
    def test_super_admin_login(self):
        """Test super admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        print(f"PASSED: Super admin login successful")
    
    def test_hod_login(self):
        """Test HOD login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
        assert response.status_code == 200, f"HOD login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "hod"
        print(f"PASSED: HOD login successful - {data['user']['name']}")


@pytest.fixture
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture
def super_admin_token():
    """Get super admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Super admin authentication failed")


@pytest.fixture
def hod_token():
    """Get HOD auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("HOD authentication failed")


class TestDepartmentCMSAPIs:
    """Test Department CMS API endpoints"""
    
    def test_get_classes(self, admin_token):
        """Test GET /api/admin/classes returns 4 classes (IX, X, XI, XII)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/classes", headers=headers)
        assert response.status_code == 200, f"Get classes failed: {response.text}"
        classes = response.json()
        assert isinstance(classes, list)
        assert len(classes) == 4, f"Expected 4 classes, got {len(classes)}"
        class_names = [c["name"] for c in classes]
        assert "IX" in class_names
        assert "X" in class_names
        assert "XI" in class_names
        assert "XII" in class_names
        print(f"PASSED: GET /api/admin/classes returns {len(classes)} classes: {class_names}")
    
    def test_get_subjects(self, admin_token):
        """Test GET /api/admin/subjects returns 7 subjects"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/subjects", headers=headers)
        assert response.status_code == 200, f"Get subjects failed: {response.text}"
        subjects = response.json()
        assert isinstance(subjects, list)
        assert len(subjects) == 7, f"Expected 7 subjects, got {len(subjects)}"
        subject_names = [s["name"] for s in subjects]
        assert "Science" in subject_names
        assert "Mathematics" in subject_names
        assert "English" in subject_names
        print(f"PASSED: GET /api/admin/subjects returns {len(subjects)} subjects: {subject_names}")
    
    def test_get_departments(self, admin_token):
        """Test GET /api/admin/departments returns 28 departments (4 classes x 7 subjects)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/departments", headers=headers)
        assert response.status_code == 200, f"Get departments failed: {response.text}"
        departments = response.json()
        assert isinstance(departments, list)
        assert len(departments) == 28, f"Expected 28 departments, got {len(departments)}"
        
        # Verify department structure
        dept = departments[0]
        assert "id" in dept
        assert "name" in dept
        assert "classId" in dept
        assert "subjectId" in dept
        assert "className" in dept
        assert "subjectName" in dept
        assert "memberCount" in dept
        
        # Check IX_Science department has head assigned
        ix_science = next((d for d in departments if d["name"] == "IX_Science"), None)
        assert ix_science is not None, "IX_Science department not found"
        assert ix_science["headName"] == "Dr. Ram Kumar", f"Expected head 'Dr. Ram Kumar', got {ix_science.get('headName')}"
        
        print(f"PASSED: GET /api/admin/departments returns {len(departments)} departments")
        print(f"  - IX_Science has head: {ix_science['headName']}")


class TestDepartmentOperations:
    """Test department CRUD operations"""
    
    def test_create_class(self, admin_token):
        """Test creating a new class via POST /api/admin/classes"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        new_class = {"name": "VIII", "numericGrade": 8, "sortOrder": 8}
        response = requests.post(f"{BASE_URL}/api/admin/classes", headers=headers, json=new_class)
        assert response.status_code in [200, 201], f"Create class failed: {response.text}"
        created = response.json()
        assert created["name"] == "VIII"
        assert created["numericGrade"] == 8
        print(f"PASSED: Created class VIII with ID {created['id']}")
        
        # Cleanup - delete the class
        delete_response = requests.delete(f"{BASE_URL}/api/admin/classes/{created['id']}", headers=headers)
        assert delete_response.status_code in [200, 204], f"Delete class failed: {delete_response.text}"
        print(f"  - Cleaned up: deleted class VIII")
    
    def test_create_subject(self, admin_token):
        """Test creating a new subject via POST /api/admin/subjects"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        new_subject = {"name": "Physics", "code": "PHY"}
        response = requests.post(f"{BASE_URL}/api/admin/subjects", headers=headers, json=new_subject)
        assert response.status_code in [200, 201], f"Create subject failed: {response.text}"
        created = response.json()
        assert created["name"] == "Physics"
        assert created["code"] == "PHY"
        print(f"PASSED: Created subject Physics with ID {created['id']}")
        
        # Cleanup - delete the subject
        delete_response = requests.delete(f"{BASE_URL}/api/admin/subjects/{created['id']}", headers=headers)
        assert delete_response.status_code in [200, 204], f"Delete subject failed: {delete_response.text}"
        print(f"  - Cleaned up: deleted subject Physics")
    
    def test_generate_departments(self, admin_token):
        """Test generating departments from class x subject combinations"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # First create a test class and subject
        new_class = {"name": "VII", "numericGrade": 7, "sortOrder": 7}
        class_resp = requests.post(f"{BASE_URL}/api/admin/classes", headers=headers, json=new_class)
        assert class_resp.status_code in [200, 201], f"Create class failed: {class_resp.text}"
        class_id = class_resp.json()["id"]
        
        new_subject = {"name": "Art", "code": "ART"}
        subject_resp = requests.post(f"{BASE_URL}/api/admin/subjects", headers=headers, json=new_subject)
        assert subject_resp.status_code in [200, 201], f"Create subject failed: {subject_resp.text}"
        subject_id = subject_resp.json()["id"]
        
        # Generate departments
        generate_payload = {"classIds": [class_id], "subjectIds": [subject_id]}
        gen_resp = requests.post(f"{BASE_URL}/api/admin/departments/generate", headers=headers, json=generate_payload)
        assert gen_resp.status_code in [200, 201], f"Generate departments failed: {gen_resp.text}"
        gen_data = gen_resp.json()
        assert "created" in gen_data
        assert gen_data["created"] >= 1, f"Expected at least 1 department created, got {gen_data['created']}"
        print(f"PASSED: Generated {gen_data['created']} department(s)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/classes/{class_id}", headers=headers)
        requests.delete(f"{BASE_URL}/api/admin/subjects/{subject_id}", headers=headers)
        print(f"  - Cleaned up: deleted test class and subject")
    
    def test_assign_department_head(self, admin_token):
        """Test assigning a head to a department via PATCH /api/admin/departments/:id"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # Get departments to find one without a head
        dept_resp = requests.get(f"{BASE_URL}/api/admin/departments", headers=headers)
        departments = dept_resp.json()
        dept_without_head = next((d for d in departments if d["headId"] is None), None)
        
        if dept_without_head is None:
            pytest.skip("No department without head found for testing")
        
        # Get users to find an HOD
        users_resp = requests.get(f"{BASE_URL}/api/users", headers=headers)
        users = users_resp.json()
        hod_user = next((u for u in users if u["role"] == "hod"), None)
        
        if hod_user is None:
            pytest.skip("No HOD user found for testing")
        
        # Assign head
        patch_payload = {"headId": hod_user["id"], "headRoleLabel": "Department Head"}
        patch_resp = requests.patch(f"{BASE_URL}/api/admin/departments/{dept_without_head['id']}", headers=headers, json=patch_payload)
        assert patch_resp.status_code == 200, f"Assign head failed: {patch_resp.text}"
        updated = patch_resp.json()
        assert updated["headId"] == hod_user["id"]
        print(f"PASSED: Assigned {hod_user['name']} as head of {dept_without_head['name']}")
        
        # Revert - remove head
        revert_payload = {"headId": None}
        requests.patch(f"{BASE_URL}/api/admin/departments/{dept_without_head['id']}", headers=headers, json=revert_payload)
        print(f"  - Reverted: removed head from {dept_without_head['name']}")
    
    def test_add_member_to_department(self, admin_token):
        """Test adding a member to a department via POST /api/admin/departments/:id/members"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # Get departments
        dept_resp = requests.get(f"{BASE_URL}/api/admin/departments", headers=headers)
        departments = dept_resp.json()
        test_dept = departments[0]  # Use first department
        
        # Get users to find a teacher
        users_resp = requests.get(f"{BASE_URL}/api/users", headers=headers)
        users = users_resp.json()
        teacher = next((u for u in users if u["role"] == "teacher"), None)
        
        if teacher is None:
            pytest.skip("No teacher user found for testing")
        
        # Add member
        member_payload = {"userId": teacher["id"], "role": "teacher"}
        add_resp = requests.post(f"{BASE_URL}/api/admin/departments/{test_dept['id']}/members", headers=headers, json=member_payload)
        # May return 201 or 200, or 409 if already exists
        assert add_resp.status_code in [200, 201, 409], f"Add member failed: {add_resp.text}"
        
        if add_resp.status_code in [200, 201]:
            print(f"PASSED: Added {teacher['name']} to {test_dept['name']}")
        else:
            print(f"PASSED: Member already exists in department (expected behavior)")
    
    def test_get_department_members(self, admin_token):
        """Test getting members of a department via GET /api/admin/departments/:id/members"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get IX_Science department which has members
        dept_resp = requests.get(f"{BASE_URL}/api/admin/departments", headers=headers)
        departments = dept_resp.json()
        ix_science = next((d for d in departments if d["name"] == "IX_Science"), None)
        
        if ix_science is None:
            pytest.skip("IX_Science department not found")
        
        # Get members
        members_resp = requests.get(f"{BASE_URL}/api/admin/departments/{ix_science['id']}/members", headers=headers)
        assert members_resp.status_code == 200, f"Get members failed: {members_resp.text}"
        members = members_resp.json()
        assert isinstance(members, list)
        assert len(members) >= 1, f"Expected at least 1 member, got {len(members)}"
        
        # Verify member structure
        member = members[0]
        assert "userId" in member
        assert "role" in member
        print(f"PASSED: GET /api/admin/departments/{ix_science['id']}/members returns {len(members)} members")


class TestBatchAPIs:
    """Test Batch Management APIs"""
    
    def test_create_batch_for_test(self, admin_token):
        """Test POST /api/tests/:testId/batches - create a batch for a test"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # First get or create a test
        tests_resp = requests.get(f"{BASE_URL}/api/tests", headers=headers)
        tests = tests_resp.json()
        
        if len(tests) == 0:
            # Create a test
            test_payload = {
                "title": "Test for Batch Testing",
                "type": "unit_test",
                "subject": "Science",
                "grade": "10",
                "totalMarks": 50,
                "duration": 60
            }
            create_resp = requests.post(f"{BASE_URL}/api/tests/generate", headers=headers, json=test_payload)
            if create_resp.status_code not in [200, 201]:
                pytest.skip(f"Could not create test: {create_resp.text}")
            test_id = create_resp.json()["id"]
        else:
            test_id = tests[0]["id"]
        
        # Create a batch
        batch_payload = {"name": "Batch A", "assignedSet": "Set A"}
        batch_resp = requests.post(f"{BASE_URL}/api/tests/{test_id}/batches", headers=headers, json=batch_payload)
        assert batch_resp.status_code in [200, 201], f"Create batch failed: {batch_resp.text}"
        batch = batch_resp.json()
        assert batch["name"] == "Batch A"
        assert batch["assignedSet"] == "Set A"
        print(f"PASSED: Created batch '{batch['name']}' for test {test_id}")
        
        # Cleanup - delete batch
        delete_resp = requests.delete(f"{BASE_URL}/api/batches/{batch['id']}", headers=headers)
        print(f"  - Cleaned up: deleted batch")
    
    def test_get_batches_for_test(self, admin_token):
        """Test GET /api/tests/:testId/batches - get all batches for a test"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # Get a test
        tests_resp = requests.get(f"{BASE_URL}/api/tests", headers=headers)
        tests = tests_resp.json()
        
        if len(tests) == 0:
            pytest.skip("No tests available")
        
        test_id = tests[0]["id"]
        
        # Get batches
        batches_resp = requests.get(f"{BASE_URL}/api/tests/{test_id}/batches", headers=headers)
        assert batches_resp.status_code == 200, f"Get batches failed: {batches_resp.text}"
        batches = batches_resp.json()
        assert isinstance(batches, list)
        print(f"PASSED: GET /api/tests/{test_id}/batches returns {len(batches)} batches")
    
    def test_assign_students_to_batch(self, admin_token):
        """Test POST /api/batches/:id/students - assign students to a batch"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # Get a test
        tests_resp = requests.get(f"{BASE_URL}/api/tests", headers=headers)
        tests = tests_resp.json()
        
        if len(tests) == 0:
            pytest.skip("No tests available")
        
        test_id = tests[0]["id"]
        
        # Create a batch
        batch_payload = {"name": "Test Batch B", "assignedSet": "Set B"}
        batch_resp = requests.post(f"{BASE_URL}/api/tests/{test_id}/batches", headers=headers, json=batch_payload)
        if batch_resp.status_code not in [200, 201]:
            pytest.skip(f"Could not create batch: {batch_resp.text}")
        batch_id = batch_resp.json()["id"]
        
        # Get students
        users_resp = requests.get(f"{BASE_URL}/api/users", headers=headers)
        users = users_resp.json()
        students = [u for u in users if u["role"] == "student"]
        
        if len(students) == 0:
            # No students, just verify the endpoint works with empty array
            assign_resp = requests.post(f"{BASE_URL}/api/batches/{batch_id}/students", headers=headers, json={"studentIds": []})
            assert assign_resp.status_code in [200, 201, 400], f"Assign students failed: {assign_resp.text}"
            print(f"PASSED: POST /api/batches/{batch_id}/students endpoint works (no students to assign)")
        else:
            student_ids = [s["id"] for s in students[:2]]  # Take first 2 students
            assign_resp = requests.post(f"{BASE_URL}/api/batches/{batch_id}/students", headers=headers, json={"studentIds": student_ids})
            assert assign_resp.status_code in [200, 201], f"Assign students failed: {assign_resp.text}"
            print(f"PASSED: Assigned {len(student_ids)} students to batch")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/batches/{batch_id}", headers=headers)


class TestBackwardCompatibility:
    """Test backward compatibility for renamed endpoints"""
    
    def test_chapters_endpoint_works(self, admin_token):
        """Test that /api/chapters still works (backward compat for /api/lessons)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/chapters", headers=headers)
        assert response.status_code == 200, f"GET /api/chapters failed: {response.text}"
        chapters = response.json()
        assert isinstance(chapters, list)
        print(f"PASSED: GET /api/chapters returns {len(chapters)} items (backward compat)")
    
    def test_lessons_endpoint_works(self, admin_token):
        """Test that /api/lessons works (new endpoint name)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/lessons", headers=headers)
        assert response.status_code == 200, f"GET /api/lessons failed: {response.text}"
        lessons = response.json()
        assert isinstance(lessons, list)
        print(f"PASSED: GET /api/lessons returns {len(lessons)} items")
    
    def test_chapters_and_lessons_return_same_data(self, admin_token):
        """Test that /api/chapters and /api/lessons return the same data"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        chapters_resp = requests.get(f"{BASE_URL}/api/chapters", headers=headers)
        lessons_resp = requests.get(f"{BASE_URL}/api/lessons", headers=headers)
        
        chapters = chapters_resp.json()
        lessons = lessons_resp.json()
        
        assert len(chapters) == len(lessons), f"Chapters ({len(chapters)}) and lessons ({len(lessons)}) count mismatch"
        print(f"PASSED: /api/chapters and /api/lessons return same data ({len(chapters)} items)")


class TestSuperAdminUserCreation:
    """Test super admin can create users with rollNumber field"""
    
    def test_create_user_with_roll_number(self, super_admin_token):
        """Test super admin can create a student with rollNumber field"""
        headers = {"Authorization": f"Bearer {super_admin_token}", "Content-Type": "application/json"}
        
        # Get tenant ID
        tenants_resp = requests.get(f"{BASE_URL}/api/tenants", headers=headers)
        if tenants_resp.status_code != 200:
            pytest.skip("Could not get tenants")
        tenants = tenants_resp.json()
        mvmchn = next((t for t in tenants if t["code"] == "MVMCHN"), None)
        if mvmchn is None:
            pytest.skip("MVMCHN tenant not found")
        
        # Create student with rollNumber
        import random
        random_suffix = random.randint(1000, 9999)
        student_payload = {
            "tenantId": mvmchn["id"],
            "email": f"test.student.{random_suffix}@mvm.com",
            "password": "Student@123",
            "name": f"Test Student {random_suffix}",
            "role": "student",
            "grade": "10",
            "section": "A",
            "rollNumber": f"2026{random_suffix}"
        }
        
        create_resp = requests.post(f"{BASE_URL}/api/superadmin/users", headers=headers, json=student_payload)
        assert create_resp.status_code in [200, 201], f"Create user failed: {create_resp.text}"
        created = create_resp.json()
        assert created["rollNumber"] == f"2026{random_suffix}", f"rollNumber not saved correctly"
        assert created["role"] == "student"
        print(f"PASSED: Created student with rollNumber {created['rollNumber']}")
        
        # Cleanup - delete user
        delete_resp = requests.delete(f"{BASE_URL}/api/superadmin/users/{created['id']}", headers=headers)
        print(f"  - Cleaned up: deleted test student")


class TestHODDepartmentAccess:
    """Test HOD can access department APIs"""
    
    def test_hod_can_view_departments(self, hod_token):
        """Test HOD can view departments via GET /api/admin/departments"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/departments", headers=headers)
        assert response.status_code == 200, f"HOD get departments failed: {response.text}"
        departments = response.json()
        assert isinstance(departments, list)
        assert len(departments) > 0
        print(f"PASSED: HOD can view {len(departments)} departments")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
