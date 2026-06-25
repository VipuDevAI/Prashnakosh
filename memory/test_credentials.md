# Test Credentials

## Super Admin
- **Email**: superadmin@safal.com
- **Password**: SuperAdmin@123
- **School Code**: SUPERADMIN
- **Session TTL**: 24 hours

## HOD (Head of Department)
- **Email**: hod.science@mvm.com
- **Password**: Hod@12345
- **School Code**: MVMCHN
- **Department**: IX Science
- **Session TTL**: 24 hours

## Teacher
- **Email**: teacher.science@mvm.com
- **Password**: Teacher@123
- **School Code**: MVMCHN
- **Session TTL**: 24 hours

## Student
- **Email**: student1@mvm.com
- **Password**: Student@123
- **School Code**: MVMCHN
- **Session TTL**: 3 hours

## Storage Architecture
- **Type**: Local server filesystem
- **Root Path**: Configurable via `STORAGE_ROOT` env var (default: `./data`)
- **Production Default**: `E:\PrashnakoshData` (Windows) or `/data` (Docker)
- **Subdirectories**: uploads, exports, backups, logs, postgres
