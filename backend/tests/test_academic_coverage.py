"""
Test Academic Coverage Dashboard API
Tests for GET /api/departments/:id/academic-coverage endpoint

Features tested:
- Hierarchical coverage data (Department → Section → Lesson → Topic)
- Only approved questions count for coverage
- Weak areas identification (weakSections, weakLessons, weakTopics)
- Coverage calculations (required/approved/pending/need/coverage/status)
- Department access validation (403 for unauthorized)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
HOD_CREDENTIALS = {
    "schoolCode": "MVMCHN",
    "email": "hod.science@mvm.com",
    "password": "Hod@12345"
}

TEACHER_CREDENTIALS = {
    "schoolCode": "MVMCHN",
    "email": "teacher.science@mvm.com",
    "password": "Teacher@123"
}

# Department IDs
IX_SCIENCE_DEPT_ID = "3bedf6c1-d838-4851-a27d-9774fa2b027a"
IX_MATHEMATICS_DEPT_ID = "41c720e0-4fe3-480f-9026-9fd1763cf457"  # HOD doesn't have access
BLUEPRINT_ID = "11d1d880-0913-4a68-89bf-70c23872df1d"


class TestAcademicCoverageAPI:
    """Tests for Academic Coverage Dashboard API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures - login as HOD"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as HOD
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json=HOD_CREDENTIALS
        )
        assert response.status_code == 200, f"HOD login failed: {response.text}"
        data = response.json()
        self.hod_token = data.get("token")
        self.hod_user = data.get("user")
        self.session.headers.update({"Authorization": f"Bearer {self.hod_token}"})
        
    def test_academic_coverage_returns_200(self):
        """Test 1: GET /api/departments/:id/academic-coverage returns 200"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "departmentId" in data
        assert "departmentName" in data
        assert "blueprints" in data
        assert "summary" in data
        print("Test 1 PASSED: Academic coverage endpoint returns 200 with correct structure")
        
    def test_coverage_has_correct_department_info(self):
        """Test 2: Response contains correct department information"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["departmentId"] == IX_SCIENCE_DEPT_ID
        assert data["departmentName"] == "IX_Science"
        assert "totalQuestions" in data
        assert "totalApprovedQuestions" in data
        assert "totalPendingQuestions" in data
        print(f"Test 2 PASSED: Department info correct - {data['departmentName']}, Total: {data['totalQuestions']}, Approved: {data['totalApprovedQuestions']}, Pending: {data['totalPendingQuestions']}")
        
    def test_coverage_uses_only_approved_questions(self):
        """Test 3: Coverage calculation uses ONLY approved questions (not draft/pending/rejected)"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify approved count is used for coverage, not total
        total_approved = data["totalApprovedQuestions"]
        total_pending = data["totalPendingQuestions"]
        total_questions = data["totalQuestions"]
        
        # Total should be >= approved + pending (may have other statuses)
        assert total_questions >= total_approved + total_pending
        
        # Check blueprint coverage uses approved only
        if data["blueprints"]:
            bp = data["blueprints"][0]
            # Coverage should be based on approved/required, not total/required
            expected_coverage = round((bp["totalApproved"] / bp["totalRequired"]) * 100) if bp["totalRequired"] > 0 else 0
            assert bp["overallCoverage"] == expected_coverage, f"Coverage mismatch: expected {expected_coverage}, got {bp['overallCoverage']}"
        
        print(f"Test 3 PASSED: Coverage uses only approved questions ({total_approved} approved out of {total_questions} total)")
        
    def test_blueprint_coverage_structure(self):
        """Test 4: Blueprint coverage has correct structure with sections"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["blueprints"]) > 0, "No blueprints found"
        bp = data["blueprints"][0]
        
        # Check blueprint fields
        assert "blueprintId" in bp
        assert "blueprintName" in bp
        assert "subject" in bp
        assert "grade" in bp
        assert "totalMarks" in bp
        assert "totalRequired" in bp
        assert "totalApproved" in bp
        assert "totalPending" in bp
        assert "overallCoverage" in bp
        assert "sections" in bp
        
        print(f"Test 4 PASSED: Blueprint '{bp['blueprintName']}' has correct structure with {len(bp['sections'])} sections")
        
    def test_section_coverage_fields(self):
        """Test 5: Section coverage has required/approved/pending/coverage/status/need fields"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        bp = data["blueprints"][0]
        assert len(bp["sections"]) > 0, "No sections found"
        
        for section in bp["sections"]:
            assert "sectionName" in section
            assert "marks" in section
            assert "questionType" in section
            assert "questionCount" in section
            assert "required" in section
            assert "approved" in section
            assert "pending" in section
            assert "coverage" in section
            assert "need" in section
            assert "status" in section
            assert "lessons" in section
            
            # Verify status is one of green/yellow/red
            assert section["status"] in ["green", "yellow", "red"]
            
            # Verify need calculation
            expected_need = max(0, section["required"] - section["approved"])
            assert section["need"] == expected_need, f"Need mismatch for section {section['sectionName']}"
            
        print(f"Test 5 PASSED: All {len(bp['sections'])} sections have correct coverage fields")
        
    def test_lesson_breakdown_within_sections(self):
        """Test 6: Lesson breakdowns are correct within each section"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        bp = data["blueprints"][0]
        lessons_found = 0
        
        for section in bp["sections"]:
            for lesson in section["lessons"]:
                lessons_found += 1
                assert "name" in lesson
                assert "required" in lesson
                assert "approved" in lesson
                assert "pending" in lesson
                assert "total" in lesson
                assert "coverage" in lesson
                assert "need" in lesson
                assert "status" in lesson
                assert "topics" in lesson
                
                # Verify status
                assert lesson["status"] in ["green", "yellow", "red"]
                
        print(f"Test 6 PASSED: Found {lessons_found} lessons with correct breakdown structure")
        
    def test_topic_breakdown_within_lessons(self):
        """Test 7: Topic breakdowns are correct within each lesson"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        bp = data["blueprints"][0]
        topics_found = 0
        
        for section in bp["sections"]:
            for lesson in section["lessons"]:
                for topic in lesson["topics"]:
                    topics_found += 1
                    assert "name" in topic
                    assert "required" in topic
                    assert "approved" in topic
                    assert "pending" in topic
                    assert "total" in topic
                    assert "coverage" in topic
                    assert "need" in topic
                    assert "status" in topic
                    
                    # Verify status
                    assert topic["status"] in ["green", "yellow", "red"]
                    
        print(f"Test 7 PASSED: Found {topics_found} topics with correct breakdown structure")
        
    def test_weak_sections_sorted_by_coverage(self):
        """Test 8: weakSections are sorted by coverage (ascending)"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        weak_sections = data["summary"]["weakSections"]
        
        # Verify sorted by coverage ascending
        for i in range(len(weak_sections) - 1):
            assert weak_sections[i]["coverage"] <= weak_sections[i + 1]["coverage"], \
                f"weakSections not sorted: {weak_sections[i]['coverage']} > {weak_sections[i + 1]['coverage']}"
        
        # Verify each weak section has required fields
        for ws in weak_sections:
            assert "blueprint" in ws
            assert "section" in ws
            assert "coverage" in ws
            assert "need" in ws
            
        print(f"Test 8 PASSED: {len(weak_sections)} weak sections sorted by coverage (ascending)")
        
    def test_weak_lessons_sorted_by_coverage(self):
        """Test 9: weakLessons are sorted by coverage (ascending)"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        weak_lessons = data["summary"]["weakLessons"]
        
        # Verify sorted by coverage ascending
        for i in range(len(weak_lessons) - 1):
            assert weak_lessons[i]["coverage"] <= weak_lessons[i + 1]["coverage"], \
                f"weakLessons not sorted: {weak_lessons[i]['coverage']} > {weak_lessons[i + 1]['coverage']}"
        
        # Verify each weak lesson has required fields
        for wl in weak_lessons:
            assert "blueprint" in wl
            assert "section" in wl
            assert "lesson" in wl
            assert "coverage" in wl
            assert "need" in wl
            
        print(f"Test 9 PASSED: {len(weak_lessons)} weak lessons sorted by coverage (ascending)")
        
    def test_weak_topics_sorted_by_coverage(self):
        """Test 10: weakTopics are sorted by coverage (ascending)"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        weak_topics = data["summary"]["weakTopics"]
        
        # Verify sorted by coverage ascending
        for i in range(len(weak_topics) - 1):
            assert weak_topics[i]["coverage"] <= weak_topics[i + 1]["coverage"], \
                f"weakTopics not sorted: {weak_topics[i]['coverage']} > {weak_topics[i + 1]['coverage']}"
        
        # Verify each weak topic has required fields
        for wt in weak_topics:
            assert "blueprint" in wt
            assert "section" in wt
            assert "lesson" in wt
            assert "topic" in wt
            assert "coverage" in wt
            assert "need" in wt
            
        print(f"Test 10 PASSED: {len(weak_topics)} weak topics sorted by coverage (ascending)")
        
    def test_summary_overall_coverage(self):
        """Test 11: Summary has correct overall coverage and status"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        summary = data["summary"]
        assert "totalRequired" in summary
        assert "totalApproved" in summary
        assert "totalPending" in summary
        assert "overallCoverage" in summary
        assert "status" in summary
        
        # Verify status based on coverage
        coverage = summary["overallCoverage"]
        expected_status = "green" if coverage >= 100 else "yellow" if coverage >= 50 else "red"
        assert summary["status"] == expected_status, f"Status mismatch: expected {expected_status}, got {summary['status']}"
        
        print(f"Test 11 PASSED: Summary coverage {coverage}% with status '{summary['status']}'")
        
    def test_unauthorized_department_access_returns_403(self):
        """Test 12: Accessing unauthorized department returns 403"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_MATHEMATICS_DEPT_ID}/academic-coverage"
        )
        # Should return 403 Forbidden since HOD doesn't have access to IX_Mathematics
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data
        print(f"Test 12 PASSED: Unauthorized department access returns 403 - '{data['error']}'")
        
    def test_unauthenticated_request_returns_401(self):
        """Test 13: Unauthenticated request returns 401"""
        # Create new session without auth
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Test 13 PASSED: Unauthenticated request returns 401")
        
    def test_section_a_coverage_matches_expected(self):
        """Test 14: Section A coverage matches expected values from test data"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        bp = data["blueprints"][0]
        section_a = next((s for s in bp["sections"] if s["sectionName"] == "A"), None)
        
        assert section_a is not None, "Section A not found"
        
        # Based on test_credentials.md: Section A has 12 approved / 20 required (60%)
        assert section_a["required"] == 20, f"Section A required mismatch: expected 20, got {section_a['required']}"
        assert section_a["approved"] == 12, f"Section A approved mismatch: expected 12, got {section_a['approved']}"
        assert section_a["coverage"] == 60, f"Section A coverage mismatch: expected 60, got {section_a['coverage']}"
        assert section_a["need"] == 8, f"Section A need mismatch: expected 8, got {section_a['need']}"
        assert section_a["status"] == "yellow", f"Section A status mismatch: expected yellow, got {section_a['status']}"
        
        print(f"Test 14 PASSED: Section A coverage matches expected - {section_a['approved']}/{section_a['required']} = {section_a['coverage']}%")
        
    def test_section_b_coverage_matches_expected(self):
        """Test 15: Section B coverage matches expected values from test data"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        bp = data["blueprints"][0]
        section_b = next((s for s in bp["sections"] if s["sectionName"] == "B"), None)
        
        assert section_b is not None, "Section B not found"
        
        # Based on test_credentials.md: Section B has 3 approved / 15 required (20%)
        assert section_b["required"] == 15, f"Section B required mismatch: expected 15, got {section_b['required']}"
        assert section_b["approved"] == 3, f"Section B approved mismatch: expected 3, got {section_b['approved']}"
        assert section_b["coverage"] == 20, f"Section B coverage mismatch: expected 20, got {section_b['coverage']}"
        assert section_b["need"] == 12, f"Section B need mismatch: expected 12, got {section_b['need']}"
        assert section_b["status"] == "red", f"Section B status mismatch: expected red, got {section_b['status']}"
        
        print(f"Test 15 PASSED: Section B coverage matches expected - {section_b['approved']}/{section_b['required']} = {section_b['coverage']}%")
        
    def test_section_c_coverage_matches_expected(self):
        """Test 16: Section C coverage matches expected values from test data"""
        response = self.session.get(
            f"{BASE_URL}/api/departments/{IX_SCIENCE_DEPT_ID}/academic-coverage"
        )
        assert response.status_code == 200
        data = response.json()
        
        bp = data["blueprints"][0]
        section_c = next((s for s in bp["sections"] if s["sectionName"] == "C"), None)
        
        assert section_c is not None, "Section C not found"
        
        # Based on test_credentials.md: Section C has 0 approved / 6 required (0%)
        assert section_c["required"] == 6, f"Section C required mismatch: expected 6, got {section_c['required']}"
        assert section_c["approved"] == 0, f"Section C approved mismatch: expected 0, got {section_c['approved']}"
        assert section_c["coverage"] == 0, f"Section C coverage mismatch: expected 0, got {section_c['coverage']}"
        assert section_c["need"] == 6, f"Section C need mismatch: expected 6, got {section_c['need']}"
        assert section_c["status"] == "red", f"Section C status mismatch: expected red, got {section_c['status']}"
        
        print(f"Test 16 PASSED: Section C coverage matches expected - {section_c['approved']}/{section_c['required']} = {section_c['coverage']}%")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
