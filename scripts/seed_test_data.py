#!/usr/bin/env python3
"""Seeds test data for Prashnakosh: tenant, users, classes, subjects, departments, user-department assignments."""
import requests, json, sys, os

API_URL = os.environ.get("API_URL", "https://paper-gen-3.preview.emergentagent.com")

def login(school_code, email, password):
    r = requests.post(f"{API_URL}/api/auth/login", json={"schoolCode": school_code, "email": email, "password": password})
    r.raise_for_status()
    return r.json()["token"]

def api(method, path, token, data=None):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    r = getattr(requests, method)(f"{API_URL}{path}", headers=headers, json=data)
    if r.status_code >= 400:
        print(f"  WARN: {method.upper()} {path} -> {r.status_code}: {r.text[:200]}")
        return None
    try:
        return r.json()
    except Exception:
        return {"status": "ok"}

# Step 1: Login as super admin
print("1. Logging in as Super Admin...")
sa_token = login("SUPERADMIN", "superadmin@safal.com", "SuperAdmin@123")

# Step 2: Get tenant (already created)
print("2. Finding MVMCHN tenant...")
tenants = api("get", "/api/tenants", sa_token) or []
tenant = next((t for t in tenants if t["code"] == "MVMCHN"), None)
if not tenant:
    print("ERROR: MVMCHN tenant not found!")
    sys.exit(1)
tenant_id = tenant["id"]
print(f"   Tenant ID: {tenant_id}")

# Step 3: Create admin user via superadmin endpoint
print("3. Creating admin user...")
admin_data = api("post", "/api/superadmin/users", sa_token, {
    "tenantId": tenant_id,
    "name": "School Admin",
    "email": "admin@mvm.com",
    "password": "Admin@123",
    "role": "admin"
})
if admin_data:
    print(f"   Admin created: {admin_data.get('id', 'OK')}")
else:
    print("   Admin may already exist, trying login...")

# Login as admin
print("4. Logging in as Admin...")
try:
    admin_token = login("MVMCHN", "admin@mvm.com", "Admin@123")
    print(f"   Admin token: {admin_token[:30]}...")
except Exception as e:
    print(f"   Admin login failed: {e}")
    # Try alternate: create via users endpoint
    admin_data = api("post", f"/api/tenants/{tenant_id}/users", sa_token, {
        "name": "School Admin", "email": "admin@mvm.com", "password": "Admin@123", "role": "admin"
    })
    if admin_data:
        admin_token = login("MVMCHN", "admin@mvm.com", "Admin@123")
    else:
        print("FATAL: Cannot create admin user"); sys.exit(1)

# Step 5: Create school classes
print("5. Creating school classes...")
classes = {}
for name, grade in [("IX", 9), ("X", 10), ("XI", 11), ("XII", 12)]:
    result = api("post", "/api/admin/classes", admin_token, {"name": name, "numericGrade": grade, "sortOrder": grade})
    if result:
        classes[name] = result["id"]
        print(f"   Created class: {name} -> {result['id']}")
    else:
        # Try to get existing
        existing = api("get", "/api/admin/classes", admin_token) or []
        for c in existing:
            if c["name"] == name:
                classes[name] = c["id"]
                print(f"   Found existing class: {name} -> {c['id']}")

print(f"   Classes: {list(classes.keys())}")

# Step 6: Create subjects
print("6. Creating school subjects...")
subjects = {}
for name, code in [("Science", "SCI"), ("Mathematics", "MAT"), ("English", "ENG"), ("Hindi", "HIN"), ("Sanskrit", "SKT"), ("Social Science", "SSC"), ("Computer Science", "CSC")]:
    result = api("post", "/api/admin/subjects", admin_token, {"name": name, "code": code})
    if result:
        subjects[name] = result["id"]
        print(f"   Created subject: {name} -> {result['id']}")
    else:
        existing = api("get", "/api/admin/subjects", admin_token) or []
        for s in existing:
            if s["name"] == name:
                subjects[name] = s["id"]
                print(f"   Found existing subject: {name} -> {s['id']}")

print(f"   Subjects: {list(subjects.keys())}")

# Step 7: Create HOD user
print("7. Creating HOD user...")
hod_data = api("post", "/api/superadmin/users", sa_token, {
    "tenantId": tenant_id,
    "name": "Dr. Ram Kumar", "email": "hod.science@mvm.com", "password": "Hod@12345", "role": "hod"
})
hod_id = None
if hod_data:
    hod_id = hod_data["id"]
    print(f"   HOD created: {hod_id}")
else:
    users = api("get", "/api/users", admin_token) or []
    hod_user = next((u for u in users if u["email"] == "hod.science@mvm.com"), None)
    if hod_user:
        hod_id = hod_user["id"]
        print(f"   Found existing HOD: {hod_id}")

# Step 8: Create Teacher user
print("8. Creating Teacher user...")
teacher_data = api("post", "/api/superadmin/users", sa_token, {
    "tenantId": tenant_id,
    "name": "Priya Singh", "email": "teacher.science@mvm.com", "password": "Teacher@123", "role": "teacher", "subjects": ["Science"]
})
teacher_id = None
if teacher_data:
    teacher_id = teacher_data["id"]
    print(f"   Teacher created: {teacher_id}")
else:
    users = api("get", "/api/users", admin_token) or []
    teacher_user = next((u for u in users if u["email"] == "teacher.science@mvm.com"), None)
    if teacher_user:
        teacher_id = teacher_user["id"]
        print(f"   Found existing Teacher: {teacher_id}")

# Step 9: Generate departments
print("9. Generating departments...")
dept_data = api("post", "/api/admin/departments/generate", admin_token, {
    "classIds": list(classes.values()),
    "subjectIds": list(subjects.values())
})
if dept_data:
    print(f"   Generated {dept_data.get('created', '?')} departments")
else:
    print("   Departments may already exist")

# Step 10: Get departments and assign users
print("10. Getting departments...")
departments = api("get", "/api/admin/departments", admin_token) or []
print(f"   Found {len(departments)} departments")

# Find IX_Science department
ix_science = next((d for d in departments if "IX_Science" in d.get("name", "") or (d.get("className") == "IX" and d.get("subjectName") == "Science")), None)
x_science = next((d for d in departments if "X_Science" in d.get("name", "") or (d.get("className") == "X" and d.get("subjectName") == "Science")), None)

if ix_science and hod_id:
    print(f"   Assigning HOD to IX_Science ({ix_science['id']})...")
    # Set HOD as department head
    api("patch", f"/api/admin/departments/{ix_science['id']}", admin_token, {"headId": hod_id})
    # Add HOD as member
    api("post", f"/api/admin/departments/{ix_science['id']}/members", admin_token, {"userId": hod_id, "role": "hod"})
    print("   HOD assigned to IX_Science")

if ix_science and teacher_id:
    print(f"   Assigning Teacher to IX_Science ({ix_science['id']})...")
    api("post", f"/api/admin/departments/{ix_science['id']}/members", admin_token, {"userId": teacher_id, "role": "teacher"})
    print("   Teacher assigned to IX_Science")

if x_science and hod_id:
    print(f"   Assigning HOD to X_Science ({x_science['id']})...")
    api("post", f"/api/admin/departments/{x_science['id']}/members", admin_token, {"userId": hod_id, "role": "hod"})
    print("   HOD assigned to X_Science")

if x_science and teacher_id:
    print(f"   Assigning Teacher to X_Science ({x_science['id']})...")
    api("post", f"/api/admin/departments/{x_science['id']}/members", admin_token, {"userId": teacher_id, "role": "teacher"})
    print("   Teacher assigned to X_Science")

# Step 11: Verify login with departmentIds
print("\n11. Verification - Login as HOD...")
try:
    hod_token = login("MVMCHN", "hod.science@mvm.com", "Hod@12345")
    hod_resp = requests.post(f"{API_URL}/api/auth/login", json={"schoolCode": "MVMCHN", "email": "hod.science@mvm.com", "password": "Hod@12345"}).json()
    print(f"   HOD departmentIds: {hod_resp['user'].get('departmentIds', [])}")
    print(f"   HOD activeDepartmentId: {hod_resp['user'].get('activeDepartmentId')}")
except Exception as e:
    print(f"   HOD login failed: {e}")

print("\n12. Verification - Login as Teacher...")
try:
    teacher_resp = requests.post(f"{API_URL}/api/auth/login", json={"schoolCode": "MVMCHN", "email": "teacher.science@mvm.com", "password": "Teacher@123"}).json()
    print(f"   Teacher departmentIds: {teacher_resp['user'].get('departmentIds', [])}")
    print(f"   Teacher activeDepartmentId: {teacher_resp['user'].get('activeDepartmentId')}")
except Exception as e:
    print(f"   Teacher login failed: {e}")

print("\n=== Seed complete! ===")
