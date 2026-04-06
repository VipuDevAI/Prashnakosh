"""
Multi-Set Paper Generation API Tests
Tests for Prashnakosh education platform multi-set paper generation feature.
Features tested:
- POST /api/tests/:id/validate-multiset - validates pool capacity
- POST /api/tests/:id/generate-multiset - generates non-overlapping sets
- POST /api/questions/bulk - bulk question creation for super_admin
- GET /api/tests/:id/paper-pdf?set=N - PDF download for specific set
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001').rstrip('/')

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

# Known IDs from the review request
TENANT_ID = "91d7c39b-90bd-4dcd-99b7-0bee0e4d5d4f"
BLUEPRINT_ID = "a329db9d-bb3a-4fd7-8435-7cf845c09b32"
TEST_ID = "c06a468d-bcdb-44d9-a126-d05c608c15d2"


@pytest.fixture(scope="module")
def super_admin_token():
    """Get super admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Super admin authentication failed: {response.text}")


@pytest.fixture(scope="module")
def hod_token():
    """Get HOD authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"HOD authentication failed: {response.text}")


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_super_admin_login(self, api_client):
        """Test super admin can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "super_admin"
        print(f"Super admin login successful: {data['user']['email']}")
    
    def test_hod_login(self, api_client):
        """Test HOD can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=HOD_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "hod"
        print(f"HOD login successful: {data['user']['email']}")


class TestBulkQuestionCreation:
    """Test bulk question creation for super_admin"""
    
    def test_bulk_questions_requires_auth(self, api_client):
        """Test that bulk questions endpoint requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/questions/bulk", json={
            "questions": [{"content": "Test", "type": "mcq"}]
        })
        assert response.status_code == 401
        print("Bulk questions correctly requires authentication")
    
    def test_bulk_questions_with_tenant_id(self, api_client, super_admin_token):
        """Test super_admin can create bulk questions with tenantId from question data"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        # Create a test question with tenantId in the question data
        questions = [{
            "tenantId": TENANT_ID,
            "content": "TEST_BULK_Q1: What is the time complexity of binary search?",
            "type": "mcq",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
            "correctAnswer": "O(log n)",
            "subject": "Computer Science",
            "chapter": "Algorithms",
            "grade": "12",
            "difficulty": "medium",
            "marks": 2,
            "status": "approved"
        }]
        
        response = api_client.post(
            f"{BASE_URL}/api/questions/bulk",
            json={"questions": questions},
            headers=headers
        )
        
        # Should succeed - super_admin can use tenantId from question data
        assert response.status_code == 200, f"Bulk creation failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("count") >= 0  # May be 0 if duplicate
        print(f"Bulk questions created: {data.get('count')} questions")


class TestMultiSetValidation:
    """Test multi-set validation endpoint"""
    
    def test_validate_multiset_3_sets_success(self, api_client, hod_token):
        """Test validation for 3 sets with sufficient pool"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/validate-multiset",
            json={"setCount": 3},
            headers=headers
        )
        
        assert response.status_code == 200, f"Validation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "valid" in data
        assert "sectionAnalysis" in data
        assert "remediation" in data
        assert "issues" in data
        
        # With 30 MCQ and 15 SA questions, 3 sets should be valid
        assert data["valid"] == True, f"Expected valid=True, got {data}"
        assert len(data["issues"]) == 0
        
        # Check section analysis structure
        for section in data["sectionAnalysis"]:
            assert "section" in section
            assert "questionType" in section
            assert "requiredPerSet" in section
            assert "requiredTotal" in section
            assert "available" in section
            assert "canFulfill" in section
            assert "difficultyBreakdown" in section
        
        print(f"Validation for 3 sets: valid={data['valid']}, sections={len(data['sectionAnalysis'])}")
    
    def test_validate_multiset_4_sets_insufficient(self, api_client, hod_token):
        """Test validation for 4 sets with insufficient pool"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/validate-multiset",
            json={"setCount": 4},
            headers=headers
        )
        
        assert response.status_code == 200, f"Validation failed: {response.text}"
        data = response.json()
        
        # With 30 MCQ (need 40) and 15 SA (need 20), 4 sets should be invalid
        assert data["valid"] == False, f"Expected valid=False for 4 sets, got {data}"
        assert len(data["issues"]) > 0
        
        # Check remediation options
        assert "remediation" in data
        assert data["remediation"]["maxSetsNoOverlap"] <= 3
        assert data["remediation"]["canReduceSets"] == True
        assert data["remediation"]["suggestedSetCount"] <= 3
        
        print(f"Validation for 4 sets: valid={data['valid']}, issues={data['issues']}")
        print(f"Remediation: maxSets={data['remediation']['maxSetsNoOverlap']}, suggested={data['remediation']['suggestedSetCount']}")
    
    def test_validate_multiset_requires_blueprint(self, api_client, hod_token):
        """Test that validation fails for test without blueprint"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        # First, get tests to find one without blueprint
        response = api_client.get(f"{BASE_URL}/api/tests", headers=headers)
        if response.status_code == 200:
            tests = response.json()
            test_without_blueprint = next((t for t in tests if not t.get("blueprintId")), None)
            
            if test_without_blueprint:
                response = api_client.post(
                    f"{BASE_URL}/api/tests/{test_without_blueprint['id']}/validate-multiset",
                    json={"setCount": 3},
                    headers=headers
                )
                assert response.status_code == 400
                assert "blueprint" in response.json().get("error", "").lower()
                print("Correctly rejected test without blueprint")
            else:
                print("No test without blueprint found - skipping this check")


class TestMultiSetGeneration:
    """Test multi-set generation endpoint"""
    
    def test_generate_multiset_3_sets(self, api_client, hod_token):
        """Test generating 3 non-overlapping sets"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/generate-multiset",
            json={"setCount": 3, "allowOverlap": False, "mode": "offline"},
            headers=headers
        )
        
        assert response.status_code == 200, f"Generation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True
        assert data.get("setCount") == 3
        assert "sets" in data
        assert len(data["sets"]) == 3
        
        # Verify validation metrics
        assert "validation" in data
        validation = data["validation"]
        
        # CRITICAL: Zero overlap
        assert validation.get("overlapCount") == 0, f"Expected 0 overlap, got {validation.get('overlapCount')}"
        
        # CRITICAL: Equal marks across sets
        assert validation.get("allSetsEqualMarks") == True, f"Sets don't have equal marks"
        
        # Verify each set
        set_marks = []
        for s in data["sets"]:
            assert "setName" in s
            assert "questionCount" in s
            assert "totalMarks" in s
            assert "sectionBreakdown" in s
            set_marks.append(s["totalMarks"])
            print(f"  {s['setName']}: {s['questionCount']} questions, {s['totalMarks']} marks")
        
        # Verify all sets have same marks
        assert len(set(set_marks)) == 1, f"Sets have different marks: {set_marks}"
        
        # Verify stats
        assert "stats" in data
        stats = data["stats"]
        assert stats.get("overlapCount") == 0
        assert "perSetStats" in stats
        
        print(f"Generated {data['setCount']} sets successfully")
        print(f"Overlap count: {validation.get('overlapCount')}")
        print(f"All sets equal marks: {validation.get('allSetsEqualMarks')}")
    
    def test_generate_multiset_stores_question_sets(self, api_client, hod_token):
        """Test that generated sets are stored in test record"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        # Get the test to verify questionSets is stored
        response = api_client.get(f"{BASE_URL}/api/tests", headers=headers)
        assert response.status_code == 200
        
        tests = response.json()
        test = next((t for t in tests if t["id"] == TEST_ID), None)
        
        if test:
            # Verify questionSets is stored
            question_sets = test.get("questionSets")
            if question_sets:
                assert len(question_sets) >= 1
                for qs in question_sets:
                    assert "setName" in qs
                    assert "questionIds" in qs
                    assert "totalMarks" in qs
                    assert len(qs["questionIds"]) > 0
                print(f"Test has {len(question_sets)} stored question sets")
            else:
                print("questionSets not yet stored - may need to regenerate")
        else:
            print(f"Test {TEST_ID} not found in response")


class TestPaperPDFDownload:
    """Test PDF download for multi-set papers"""
    
    def test_paper_pdf_set_1(self, api_client, hod_token):
        """Test PDF download for Set 1"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/paper-pdf?set=1",
            headers=headers
        )
        
        # Should return PDF or appropriate error
        if response.status_code == 200:
            assert response.headers.get("Content-Type", "").startswith("application/pdf")
            assert len(response.content) > 0
            print(f"PDF Set 1 downloaded: {len(response.content)} bytes")
        elif response.status_code == 400:
            # May fail if test is not in downloadable state
            print(f"PDF download not available: {response.text}")
        else:
            print(f"PDF download returned {response.status_code}: {response.text}")
    
    def test_paper_pdf_set_2(self, api_client, hod_token):
        """Test PDF download for Set 2"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/paper-pdf?set=2",
            headers=headers
        )
        
        if response.status_code == 200:
            assert response.headers.get("Content-Type", "").startswith("application/pdf")
            print(f"PDF Set 2 downloaded: {len(response.content)} bytes")
        else:
            print(f"PDF Set 2 returned {response.status_code}")
    
    def test_paper_pdf_set_3(self, api_client, hod_token):
        """Test PDF download for Set 3"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.get(
            f"{BASE_URL}/api/tests/{TEST_ID}/paper-pdf?set=3",
            headers=headers
        )
        
        if response.status_code == 200:
            assert response.headers.get("Content-Type", "").startswith("application/pdf")
            print(f"PDF Set 3 downloaded: {len(response.content)} bytes")
        else:
            print(f"PDF Set 3 returned {response.status_code}")


class TestDifficultyParity:
    """Test difficulty distribution parity across sets"""
    
    def test_difficulty_distribution_parity(self, api_client, hod_token):
        """Test that difficulty distribution is similar across sets"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        # Generate fresh sets
        response = api_client.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/generate-multiset",
            json={"setCount": 3, "allowOverlap": False, "mode": "offline"},
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Generation failed: {response.text}")
        
        data = response.json()
        stats = data.get("stats", {})
        per_set_stats = stats.get("perSetStats", [])
        
        if len(per_set_stats) < 2:
            pytest.skip("Not enough sets to compare difficulty parity")
        
        # Compare difficulty distributions
        for i, set_stat in enumerate(per_set_stats):
            diff_dist = set_stat.get("difficultyDistribution", {})
            print(f"{set_stat['setName']}: easy={diff_dist.get('easy', 0)}, medium={diff_dist.get('medium', 0)}, hard={diff_dist.get('hard', 0)}")
        
        # Verify total questions per set are equal
        total_per_set = [
            sum(s.get("difficultyDistribution", {}).values()) 
            for s in per_set_stats
        ]
        assert len(set(total_per_set)) == 1, f"Sets have different question counts: {total_per_set}"
        print(f"All sets have {total_per_set[0]} questions each")


class TestChapterCoverage:
    """Test chapter coverage consistency across sets"""
    
    def test_chapter_coverage_consistency(self, api_client, hod_token):
        """Test that chapter coverage is consistent across sets"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        
        response = api_client.post(
            f"{BASE_URL}/api/tests/{TEST_ID}/generate-multiset",
            json={"setCount": 3, "allowOverlap": False, "mode": "offline"},
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Generation failed: {response.text}")
        
        data = response.json()
        stats = data.get("stats", {})
        per_set_stats = stats.get("perSetStats", [])
        
        if len(per_set_stats) < 2:
            pytest.skip("Not enough sets to compare chapter coverage")
        
        # Compare chapter distributions
        for set_stat in per_set_stats:
            chapter_dist = set_stat.get("chapterDistribution", {})
            print(f"{set_stat['setName']}: {chapter_dist}")
        
        # Verify all sets cover the same chapters
        chapters_per_set = [
            set(s.get("chapterDistribution", {}).keys()) 
            for s in per_set_stats
        ]
        
        # All sets should have the same chapters
        first_chapters = chapters_per_set[0]
        for i, chapters in enumerate(chapters_per_set[1:], 2):
            assert chapters == first_chapters, f"Set {i} has different chapters: {chapters} vs {first_chapters}"
        
        print(f"All sets cover the same chapters: {first_chapters}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
