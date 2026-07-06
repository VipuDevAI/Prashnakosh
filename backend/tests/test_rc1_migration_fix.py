"""
Prashnakosh RC1 Migration Fix Tests
Tests for the critical production bug fix: database schema creation via Drizzle migrations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
SUPER_ADMIN = {
    "schoolCode": "SUPERADMIN",
    "email": "superadmin@safal.com",
    "password": "SuperAdmin@123"
}

HOD = {
    "schoolCode": "MVMCHN",
    "email": "hod.science@mvm.com",
    "password": "Hod@12345"
}

TEACHER = {
    "schoolCode": "MVMCHN",
    "email": "teacher.science@mvm.com",
    "password": "Teacher@123"
}


class TestHealthEndpoint:
    """Test /api/health endpoint - verifies database connection"""
    
    def test_health_returns_healthy(self):
        """GET /api/health - verify healthy with database connected"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"]["connected"] is True
        assert "latencyMs" in data["database"]
        print(f"✓ Health endpoint: status={data['status']}, db_connected={data['database']['connected']}")


class TestLoginFlows:
    """Test all login flows with seeded credentials"""
    
    def test_super_admin_login(self):
        """Super Admin login (schoolCode: SUPERADMIN, email: superadmin@safal.com)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["email"] == SUPER_ADMIN["email"]
        print(f"✓ Super Admin login: role={data['user']['role']}, token_prefix={data['token'][:20]}...")
        return data["token"]
    
    def test_hod_login(self):
        """HOD login (schoolCode: MVMCHN, email: hod.science@mvm.com)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD)
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["role"] == "hod"
        assert data["user"]["email"] == HOD["email"]
        print(f"✓ HOD login: role={data['user']['role']}, name={data['user']['name']}")
        return data["token"]
    
    def test_teacher_login(self):
        """Teacher login (schoolCode: MVMCHN, email: teacher.science@mvm.com)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER)
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["role"] == "teacher"
        assert data["user"]["email"] == TEACHER["email"]
        print(f"✓ Teacher login: role={data['user']['role']}, name={data['user']['name']}")
        return data["token"]


class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""
    
    @pytest.fixture
    def super_admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        return response.json()["token"]
    
    @pytest.fixture
    def hod_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HOD)
        return response.json()["token"]
    
    @pytest.fixture
    def teacher_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER)
        return response.json()["token"]
    
    def test_questions_api_with_auth(self, hod_token):
        """GET /api/questions with auth - returns question data"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        response = requests.get(f"{BASE_URL}/api/questions", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        # API returns {questions: [...]}
        assert "questions" in data
        assert isinstance(data["questions"], list)
        print(f"✓ Questions API: returned {len(data['questions'])} questions")
    
    def test_blueprints_api_with_auth(self, hod_token):
        """GET /api/blueprints with auth - responds"""
        headers = {"Authorization": f"Bearer {hod_token}"}
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Blueprints API: returned {len(data)} blueprints")
    
    def test_storage_status_with_super_admin(self, super_admin_token):
        """GET /api/storage/status with super admin auth - local storage configured"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/storage/status", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["storageType"] == "local"
        assert data["configured"] is True
        assert "directories" in data
        print(f"✓ Storage status: type={data['storageType']}, configured={data['configured']}")


class TestMigrationArtifacts:
    """Test that migration artifacts exist and are correct"""
    
    def test_migrations_directory_exists(self):
        """Verify migrations/ directory exists and contains SQL files"""
        import os
        migrations_dir = "/app/migrations"
        assert os.path.isdir(migrations_dir), f"migrations/ directory not found at {migrations_dir}"
        
        sql_files = [f for f in os.listdir(migrations_dir) if f.endswith('.sql')]
        assert len(sql_files) > 0, "No SQL migration files found"
        print(f"✓ Migrations directory: found {len(sql_files)} SQL files: {sql_files}")
    
    def test_migration_sql_has_if_not_exists(self):
        """Verify migration SQL uses CREATE TABLE IF NOT EXISTS"""
        migration_file = "/app/migrations/0000_loving_gateway.sql"
        with open(migration_file, 'r') as f:
            content = f.read()
        
        # Check for IF NOT EXISTS pattern
        assert "CREATE TABLE IF NOT EXISTS" in content, "Migration SQL should use IF NOT EXISTS"
        
        # Count tables
        table_count = content.count("CREATE TABLE IF NOT EXISTS")
        print(f"✓ Migration SQL: contains {table_count} CREATE TABLE IF NOT EXISTS statements")
    
    def test_migration_journal_exists(self):
        """Verify migration journal exists"""
        journal_file = "/app/migrations/meta/_journal.json"
        import json
        with open(journal_file, 'r') as f:
            journal = json.load(f)
        
        assert "entries" in journal
        assert len(journal["entries"]) > 0
        print(f"✓ Migration journal: {len(journal['entries'])} entries, dialect={journal.get('dialect')}")


class TestDockerfileConfiguration:
    """Test Dockerfile has correct migration configuration"""
    
    def test_dockerfile_copies_migrations(self):
        """Verify Dockerfile includes COPY --from=builder /app/migrations ./migrations"""
        dockerfile_path = "/app/Dockerfile"
        with open(dockerfile_path, 'r') as f:
            content = f.read()
        
        # Check for migrations copy
        assert "COPY --from=builder /app/migrations ./migrations" in content, \
            "Dockerfile should copy migrations directory"
        print("✓ Dockerfile: migrations copy directive found")
    
    def test_dockerfile_generates_migrations(self):
        """Verify Dockerfile runs drizzle-kit generate during build"""
        dockerfile_path = "/app/Dockerfile"
        with open(dockerfile_path, 'r') as f:
            content = f.read()
        
        # Check for drizzle-kit generate
        assert "drizzle-kit generate" in content, \
            "Dockerfile should run drizzle-kit generate"
        print("✓ Dockerfile: drizzle-kit generate directive found")


class TestStartupSequence:
    """Test startup sequence: migrate → seed → routes"""
    
    def test_index_ts_startup_order(self):
        """Verify server/index.ts has correct startup order"""
        index_file = "/app/server/index.ts"
        with open(index_file, 'r') as f:
            content = f.read()
        
        # Check imports
        assert "import { runMigrations } from" in content, "Should import runMigrations"
        assert "import { seedSuperAdmin } from" in content, "Should import seedSuperAdmin"
        
        # Check startup order (migrations before seed)
        migrate_pos = content.find("await runMigrations()")
        seed_pos = content.find("await seedSuperAdmin()")
        routes_pos = content.find("await registerRoutes(")
        
        assert migrate_pos < seed_pos, "Migrations should run before seed"
        assert seed_pos < routes_pos, "Seed should run before routes"
        print("✓ Startup sequence: migrate → seed → routes (correct order)")
    
    def test_migrate_ts_exists(self):
        """Verify server/migrate.ts exists and exports runMigrations"""
        migrate_file = "/app/server/migrate.ts"
        with open(migrate_file, 'r') as f:
            content = f.read()
        
        assert "export async function runMigrations" in content, \
            "migrate.ts should export runMigrations function"
        assert "drizzle-orm/node-postgres/migrator" in content, \
            "migrate.ts should use drizzle-orm migrator"
        print("✓ migrate.ts: runMigrations function exported, uses drizzle-orm migrator")


class TestDatabaseTables:
    """Test that database tables exist (via API responses)"""
    
    @pytest.fixture
    def super_admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        return response.json()["token"]
    
    def test_users_table_exists(self, super_admin_token):
        """Verify users table exists by checking login works"""
        # If login works, users table exists
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200
        print("✓ users table: exists (login successful)")
    
    def test_tenants_table_exists(self, super_admin_token):
        """Verify tenants table exists by checking schools API"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/schools", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ tenants table: exists ({len(data)} schools found)")
    
    def test_questions_table_exists(self, super_admin_token):
        """Verify questions table exists"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/questions", headers=headers)
        assert response.status_code == 200
        print("✓ questions table: exists")
    
    def test_blueprints_table_exists(self, super_admin_token):
        """Verify blueprints table exists"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/blueprints", headers=headers)
        assert response.status_code == 200
        print("✓ blueprints table: exists")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
