"""
Prashnakosh Load Test - Accurate Simulation
Separates student/teacher/HOD behaviors correctly.
Handles rate limits by using unique user tokens.
"""
import json
import time
import os
import sys
from locust import HttpUser, task, between, events, tag

DEPT_ID = "3bedf6c1-d838-4851-a27d-9774fa2b027a"

# Shared token cache to avoid re-login spam
_token_cache = {}

def get_token(client, account, role_key):
    if role_key in _token_cache:
        return _token_cache[role_key]
    resp = client.post("/api/auth/login", json=account, name="/api/auth/login")
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token", "")
        _token_cache[role_key] = token
        return token
    return ""


class StudentExamUser(HttpUser):
    """70% weight — Students viewing tests and taking exams"""
    weight = 7
    wait_time = between(2, 5)

    def on_start(self):
        self.token = get_token(
            self.client,
            {"email": "student1@mvm.com", "password": "Student@123", "schoolCode": "MVMCHN"},
            "student"
        )
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(5)
    def view_tests(self):
        if not self.token: return
        self.client.get("/api/tests", headers=self.headers, name="[student] GET /api/tests")

    @task(2)
    def health_check(self):
        self.client.get("/api/health", name="[all] GET /api/health")


class TeacherUser(HttpUser):
    """20% weight — Teachers managing questions"""
    weight = 2
    wait_time = between(3, 8)

    def on_start(self):
        self.token = get_token(
            self.client,
            {"email": "teacher.science@mvm.com", "password": "Teacher@123", "schoolCode": "MVMCHN"},
            "teacher"
        )
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(4)
    def view_my_questions(self):
        if not self.token: return
        self.client.get("/api/teacher/questions", headers=self.headers, name="[teacher] GET /api/teacher/questions")

    @task(3)
    def view_dept_questions(self):
        if not self.token: return
        self.client.get(f"/api/questions?departmentId={DEPT_ID}", headers=self.headers, name="[teacher] GET /api/questions?dept")

    @task(2)
    def view_blueprints(self):
        if not self.token: return
        self.client.get("/api/blueprints", headers=self.headers, name="[teacher] GET /api/blueprints")


class HODUser(HttpUser):
    """10% weight — HODs viewing coverage and analytics"""
    weight = 1
    wait_time = between(5, 10)

    def on_start(self):
        self.token = get_token(
            self.client,
            {"email": "hod.science@mvm.com", "password": "Hod@12345", "schoolCode": "MVMCHN"},
            "hod"
        )
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(4)
    def view_coverage(self):
        if not self.token: return
        self.client.get(
            f"/api/departments/{DEPT_ID}/academic-coverage",
            headers=self.headers,
            name="[hod] GET /api/departments/:id/academic-coverage"
        )

    @task(3)
    def view_questions(self):
        if not self.token: return
        self.client.get(f"/api/questions?departmentId={DEPT_ID}", headers=self.headers, name="[hod] GET /api/questions?dept")

    @task(2)
    def view_tests(self):
        if not self.token: return
        self.client.get("/api/tests", headers=self.headers, name="[hod] GET /api/tests")

    @task(1)
    def view_analytics(self):
        if not self.token: return
        self.client.get("/api/analytics", headers=self.headers, name="[hod] GET /api/analytics")
