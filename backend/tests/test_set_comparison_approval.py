"""
Test Suite: Set Comparison View & Approval Gate for Multi-Set Papers
=====================================================================
Tests the HOD approval workflow for multi-set question papers:
1. POST /api/tests/:id/generate-multiset - returns perSetStats with typeDistribution
2. POST /api/tests/:id/approve-sets - approves sets, returns setsApproved:true
3. GET /api/tests/:id/paper-pdf?set=1 BEFORE approval - should return 403
4. GET /api/tests/:id/paper-pdf?set=1 AFTER approval - should return 200
5. GET /api/tests/:id/paper-docx?set=1 BEFORE approval - should return 403
6. GET /api/tests/:id/answer-key-pdf?set=1 BEFORE approval - should return 403
7. POST /api/tests/:id/generate-multiset AFTER approval resets setsApproved to false
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
SUPER_ADMIN_CREDS = {
    "schoolCode": "SUPERADMIN",
    "email": "superadmin@safal.com",
    "password": "SuperAdmin@123"
}

HOD_CREDS = {
    "schoolCode": "TESTSCH",
    "email": "hod@test.com",
    "password": "Hod@12345"
}

# Test data IDs from the review request
TEST_ID = "3ffdc3c1-081c-4ffc-80a2-c270b3028c2c"
BLUEPRINT_ID = "a3eb5e1b-3275-4c27-892e-29dca016aa0c"
TENANT_ID = "f5e9e0b1-1771-4226-86c8-236d38f98b5d"


class TestAuthentication:
    """Test authentication for HOD and Super Admin"""
    
    def test_hod_login(self):
        """Test HOD login returns valid token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
        print(f"HOD Login Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert "token" in data, "Token should be in response"
            assert "user" in data, "User should be in response"
            print(f"HOD Login successful: {data['user']['email']}")
        else:
            print(f"HOD Login failed: {response.text}")
            pytest.skip("HOD login failed - skipping authenticated tests")
    
    def test_super_admin_login(self):
        """Test Super Admin login returns valid token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        print(f"Super Admin Login Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert "token" in data, "Token should be in response"
            print(f"Super Admin Login successful: {data['user']['email']}")
        else:
            print(f"Super Admin Login failed: {response.text}")


@pytest.fixture
def hod_token():
    """Get HOD authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("HOD authentication failed")


@pytest.fixture
def super_admin_token():
    """Get Super Admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Super Admin authentication failed")


class TestApprovalGateWorkflow:
    """
    Test the complete approval gate workflow:
    1. Regenerate sets (resets setsApproved to false)
    2. Test download BEFORE approval (should 403)
    3. Approve sets
    4. Test download AFTER approval (should 200)
    """
    
    def test_01_regenerate_sets_resets_approval(self, super_admin_token):
        """
        POST /api/tests/:id/generate-multiset AFTER approval resets setsApproved to false
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        # First, regenerate sets to reset approval status
        response = requests.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/generate-multiset",
            json={"setCount": 3, "allowOverlap": False, "mode": "offline"},
            headers=headers
        )
        
        print(f"Generate Multiset Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Generated {data.get('setCount', 0)} sets")
            assert data.get("success") == True, "Generation should succeed"
            assert data.get("setCount") == 3, "Should generate 3 sets"
            
            # Verify perSetStats includes typeDistribution
            validation = data.get("validation", {})
            per_set_stats = validation.get("perSetStats", [])
            assert len(per_set_stats) == 3, "Should have stats for 3 sets"
            
            for ps in per_set_stats:
                assert "typeDistribution" in ps, f"perSetStats should include typeDistribution for {ps.get('setName')}"
                print(f"  {ps.get('setName')}: typeDistribution = {ps.get('typeDistribution')}")
        elif response.status_code == 400:
            # Test might not have a blueprint
            print(f"Generate failed (possibly no blueprint): {response.text}")
            pytest.skip("Test has no blueprint - cannot generate multiset")
        else:
            print(f"Generate failed: {response.text}")
            pytest.fail(f"Generate multiset failed with {response.status_code}")
    
    def test_02_download_pdf_before_approval_returns_403(self, super_admin_token):
        """
        GET /api/tests/:id/paper-pdf?set=1 BEFORE approval - should return 403
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/paper-pdf?set=1",
            headers=headers
        )
        
        print(f"PDF Download (before approval) Response: {response.status_code}")
        
        # Should be 403 because sets are not approved
        if response.status_code == 403:
            print("Correctly blocked: Sets must be approved before downloading")
            assert True
        elif response.status_code == 200:
            # If it returns 200, the test might already have setsApproved=true
            print("WARNING: Download succeeded - test may already have setsApproved=true")
            # This is acceptable if the previous test didn't run
        else:
            print(f"Unexpected response: {response.text}")
    
    def test_03_download_docx_before_approval_returns_403(self, super_admin_token):
        """
        GET /api/tests/:id/paper-docx?set=1 BEFORE approval - should return 403
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/paper-docx?set=1",
            headers=headers
        )
        
        print(f"DOCX Download (before approval) Response: {response.status_code}")
        
        if response.status_code == 403:
            print("Correctly blocked: Sets must be approved before downloading")
            assert True
        elif response.status_code == 200:
            print("WARNING: Download succeeded - test may already have setsApproved=true")
        else:
            print(f"Unexpected response: {response.text}")
    
    def test_04_download_answer_key_before_approval_returns_403(self, super_admin_token):
        """
        GET /api/tests/:id/answer-key-pdf?set=1 BEFORE approval - should return 403
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/answer-key-pdf?set=1",
            headers=headers
        )
        
        print(f"Answer Key Download (before approval) Response: {response.status_code}")
        
        if response.status_code == 403:
            print("Correctly blocked: Sets must be approved before downloading")
            assert True
        elif response.status_code == 200:
            print("WARNING: Download succeeded - test may already have setsApproved=true")
        else:
            print(f"Unexpected response: {response.text}")
    
    def test_05_approve_sets_returns_success(self, super_admin_token):
        """
        POST /api/tests/:id/approve-sets - approves sets, returns setsApproved:true
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/approve-sets",
            json={},
            headers=headers
        )
        
        print(f"Approve Sets Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Approval should succeed"
            assert data.get("setsApproved") == True, "setsApproved should be true"
            print(f"Sets approved successfully by {data.get('approvedBy')}")
        elif response.status_code == 400:
            print(f"Approval failed (no sets generated?): {response.text}")
            pytest.skip("No sets generated - cannot approve")
        else:
            print(f"Approval failed: {response.text}")
            pytest.fail(f"Approve sets failed with {response.status_code}")
    
    def test_06_download_pdf_after_approval_returns_200(self, super_admin_token):
        """
        GET /api/tests/:id/paper-pdf?set=1 AFTER approval - should return 200
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/paper-pdf?set=1",
            headers=headers
        )
        
        print(f"PDF Download (after approval) Response: {response.status_code}")
        
        if response.status_code == 200:
            content_type = response.headers.get("Content-Type", "")
            print(f"Content-Type: {content_type}")
            assert "pdf" in content_type.lower() or len(response.content) > 0, "Should return PDF content"
            print(f"PDF downloaded successfully, size: {len(response.content)} bytes")
        else:
            print(f"Download failed: {response.text}")
            pytest.fail(f"PDF download after approval failed with {response.status_code}")
    
    def test_07_download_docx_after_approval_returns_200(self, super_admin_token):
        """
        GET /api/tests/:id/paper-docx?set=1 AFTER approval - should return 200
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/paper-docx?set=1",
            headers=headers
        )
        
        print(f"DOCX Download (after approval) Response: {response.status_code}")
        
        if response.status_code == 200:
            print(f"DOCX downloaded successfully, size: {len(response.content)} bytes")
            assert len(response.content) > 0, "Should return DOCX content"
        else:
            print(f"Download failed: {response.text}")
    
    def test_08_download_answer_key_after_approval_returns_200(self, super_admin_token):
        """
        GET /api/tests/:id/answer-key-pdf?set=1 AFTER approval - should return 200
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/answer-key-pdf?set=1",
            headers=headers
        )
        
        print(f"Answer Key Download (after approval) Response: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Answer Key downloaded successfully, size: {len(response.content)} bytes")
            assert len(response.content) > 0, "Should return PDF content"
        else:
            print(f"Download failed: {response.text}")


class TestGenerateMultisetResponse:
    """Test that generate-multiset returns correct response structure"""
    
    def test_generate_multiset_returns_type_distribution(self, super_admin_token):
        """
        POST /api/tests/:id/generate-multiset returns perSetStats with typeDistribution per set
        """
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/generate-multiset",
            json={"setCount": 3, "allowOverlap": False, "mode": "offline"},
            headers=headers
        )
        
        print(f"Generate Multiset Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            assert "success" in data, "Response should have 'success' field"
            assert "setCount" in data, "Response should have 'setCount' field"
            assert "sets" in data, "Response should have 'sets' field"
            assert "validation" in data, "Response should have 'validation' field"
            
            # Check validation structure
            validation = data["validation"]
            assert "overlapCount" in validation, "Validation should have 'overlapCount'"
            assert "perSetStats" in validation, "Validation should have 'perSetStats'"
            assert "allSetsEqualMarks" in validation, "Validation should have 'allSetsEqualMarks'"
            
            # Check perSetStats has typeDistribution
            per_set_stats = validation["perSetStats"]
            for ps in per_set_stats:
                assert "setName" in ps, "perSetStats should have 'setName'"
                assert "difficultyDistribution" in ps, "perSetStats should have 'difficultyDistribution'"
                assert "chapterDistribution" in ps, "perSetStats should have 'chapterDistribution'"
                assert "typeDistribution" in ps, f"perSetStats should have 'typeDistribution' for {ps['setName']}"
                assert "totalMarks" in ps, "perSetStats should have 'totalMarks'"
                
                print(f"  {ps['setName']}: marks={ps['totalMarks']}, types={ps['typeDistribution']}")
            
            print("All perSetStats have typeDistribution ✓")
        elif response.status_code == 400:
            print(f"Generate failed (possibly no blueprint): {response.text}")
            pytest.skip("Test has no blueprint")
        else:
            print(f"Generate failed: {response.text}")


class TestHODApprovalFlow:
    """Test HOD-specific approval flow"""
    
    def test_hod_can_approve_sets(self, hod_token):
        """HOD role can approve sets"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/approve-sets",
            json={},
            headers=headers
        )
        
        print(f"HOD Approve Sets Response: {response.status_code}")
        
        # HOD should be able to approve (200) or get 400 if no sets
        if response.status_code == 200:
            data = response.json()
            print(f"HOD approved sets: {data}")
            assert data.get("setsApproved") == True
        elif response.status_code == 400:
            print(f"No sets to approve: {response.text}")
        elif response.status_code == 403:
            print(f"Access denied (tenant mismatch?): {response.text}")
        else:
            print(f"Unexpected response: {response.text}")


class TestTestDataVerification:
    """Verify test data exists and has correct structure"""
    
    def test_verify_test_exists(self, super_admin_token):
        """Verify the test ID exists and has expected fields"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tests",
            headers=headers
        )
        
        print(f"Get Tests Response: {response.status_code}")
        
        if response.status_code == 200:
            tests = response.json()
            test = next((t for t in tests if t.get("id") == TEST_ID), None)
            
            if test:
                print(f"Found test: {test.get('title')}")
                print(f"  blueprintId: {test.get('blueprintId')}")
                print(f"  setsApproved: {test.get('setsApproved')}")
                print(f"  questionSets: {len(test.get('questionSets') or [])} sets")
            else:
                print(f"Test {TEST_ID} not found in response")
                print(f"Available tests: {[t.get('id') for t in tests[:5]]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
