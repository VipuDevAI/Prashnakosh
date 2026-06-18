#!/usr/bin/env python3
"""Seeds test questions for Academic Coverage Dashboard testing."""
import requests, json, sys, os

API_URL = os.environ.get("API_URL", "https://paper-gen-3.preview.emergentagent.com")
DEPT_ID = "3bedf6c1-d838-4851-a27d-9774fa2b027a"  # IX_Science

def login(school_code, email, password):
    r = requests.post(f"{API_URL}/api/auth/login", json={"schoolCode": school_code, "email": email, "password": password})
    r.raise_for_status()
    return r.json()["token"]

def create_q(token, content, section, lesson, topic, qtype="mcq", marks=1, diff="easy"):
    data = {
        "content": content, "type": qtype, "subject": "Science", "grade": "9",
        "section": section, "lesson": lesson, "topic": topic, "marks": marks,
        "difficulty": diff, "departmentId": DEPT_ID, "status": "pending_approval",
        "options": ["Opt A", "Opt B", "Opt C", "Opt D"] if qtype == "mcq" else None,
        "correctAnswer": "A" if qtype == "mcq" else "Answer text",
    }
    r = requests.post(f"{API_URL}/api/questions", json=data, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    if r.status_code >= 400:
        print(f"  ERR: {r.status_code} {r.text[:100]}")
        return None
    return r.json().get("id")

def approve_q(token, qid):
    r = requests.post(f"{API_URL}/api/questions/{qid}/approve", json={"status": "approved"}, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return r.status_code < 400

print("Logging in...")
teacher_token = login("MVMCHN", "teacher.science@mvm.com", "Teacher@123")
hod_token = login("MVMCHN", "hod.science@mvm.com", "Hod@12345")

# Section A (MCQ, 1 mark, Required: 20)
# - Life Processes / Nutrition: 5 questions (approve 4)
# - Life Processes / Respiration: 4 questions (approve 3)
# - Motion / Velocity: 4 questions (approve 3)
# - Motion / Distance: 3 questions (approve 2)
# Total: 16 questions, 12 approved

section_a_questions = []
print("\nSection A - Life Processes / Nutrition...")
for i in range(1, 6):
    qid = create_q(teacher_token, f"Nutrition MCQ {i}: What is the role of enzymes?", "A", "Life Processes", "Nutrition")
    if qid: section_a_questions.append(("nutrition", qid))
    
print("Section A - Life Processes / Respiration...")
for i in range(1, 5):
    qid = create_q(teacher_token, f"Respiration MCQ {i}: Where does aerobic respiration occur?", "A", "Life Processes", "Respiration")
    if qid: section_a_questions.append(("respiration", qid))

print("Section A - Motion / Velocity...")
for i in range(1, 5):
    qid = create_q(teacher_token, f"Velocity MCQ {i}: Define velocity with SI unit.", "A", "Motion", "Velocity")
    if qid: section_a_questions.append(("velocity", qid))

print("Section A - Motion / Distance...")
for i in range(1, 4):
    qid = create_q(teacher_token, f"Distance MCQ {i}: What is the difference between distance and displacement?", "A", "Motion", "Distance")
    if qid: section_a_questions.append(("distance", qid))

# Approve selected questions
approved_count = 0
for i, (tag, qid) in enumerate(section_a_questions):
    # Approve 4 nutrition, 3 respiration, 3 velocity, 2 distance = 12/16
    should_approve = (
        (tag == "nutrition" and i < 4) or
        (tag == "respiration" and approved_count < 7) or
        (tag == "velocity" and approved_count < 10) or
        (tag == "distance" and approved_count < 12)
    )
    if should_approve:
        if approve_q(hod_token, qid):
            approved_count += 1
            print(f"  Approved {tag}: {qid}")

print(f"Section A: {len(section_a_questions)} created, {approved_count} approved")

# Section B (Short Answer, 2 marks, Required: 15)
# - Force and Laws / Balanced Forces: 3 questions (approve 2)
# - Force and Laws / Unbalanced Forces: 2 questions (approve 1)
# Total: 5 questions, 3 approved
section_b_questions = []
print("\nSection B - Force and Laws / Balanced Forces...")
for i in range(1, 4):
    qid = create_q(teacher_token, f"Balanced Forces SA {i}: Explain balanced forces with examples.", "B", "Force and Laws of Motion", "Balanced Forces", "short_answer", 2, "medium")
    if qid: section_b_questions.append(("balanced", qid))

print("Section B - Force and Laws / Unbalanced Forces...")
for i in range(1, 3):
    qid = create_q(teacher_token, f"Unbalanced Forces SA {i}: What happens when forces are unbalanced?", "B", "Force and Laws of Motion", "Unbalanced Forces", "short_answer", 2, "medium")
    if qid: section_b_questions.append(("unbalanced", qid))

approved_b = 0
for tag, qid in section_b_questions:
    if (tag == "balanced" and approved_b < 2) or (tag == "unbalanced" and approved_b < 3):
        if approve_q(hod_token, qid):
            approved_b += 1
            print(f"  Approved {tag}: {qid}")

print(f"Section B: {len(section_b_questions)} created, {approved_b} approved")

# Section C (Long Answer, 5 marks, Required: 6) — leave empty for coverage gap
print("\nSection C: No questions uploaded (intentional gap)")

# Test the coverage endpoint
print("\n--- Testing Academic Coverage Endpoint ---")
r = requests.get(f"{API_URL}/api/departments/{DEPT_ID}/academic-coverage", headers={"Authorization": f"Bearer {hod_token}"})
if r.status_code == 200:
    data = r.json()
    print(f"Department: {data['departmentName']}")
    print(f"Total Questions: {data['totalQuestions']}")
    print(f"Approved: {data['totalApprovedQuestions']}")
    print(f"Pending: {data['totalPendingQuestions']}")
    s = data['summary']
    print(f"Overall Coverage: {s['overallCoverage']}% ({s['status']})")
    print(f"Weak Sections: {len(s['weakSections'])}")
    print(f"Weak Lessons: {len(s['weakLessons'])}")
    for bp in data['blueprints']:
        print(f"\n  Blueprint: {bp['blueprintName']} ({bp['overallCoverage']}%)")
        for sec in bp['sections']:
            print(f"    Section {sec['sectionName']}: Req={sec['required']} App={sec['approved']} Pend={sec['pending']} Cov={sec['coverage']}% Need={sec['need']} ({sec['status']})")
            for les in sec['lessons']:
                print(f"      Lesson: {les['name']}: Req={les['required']} App={les['approved']} Cov={les['coverage']}% Need={les['need']} ({les['status']})")
                for top in les['topics']:
                    print(f"        Topic: {top['name']}: Req={top['required']} App={top['approved']} Cov={top['coverage']}% Need={top['need']}")
else:
    print(f"ERROR: {r.status_code} {r.text[:300]}")

print("\n=== Seed coverage test data complete! ===")
