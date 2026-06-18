# Test Credentials - Prashnakosh V1

## Super Admin
- School Code: `SUPERADMIN`
- Email: `superadmin@safal.com`
- Password: `SuperAdmin@123`

## School: MVM Chennai (MVMCHN)

### Admin
- School Code: `MVMCHN`
- Email: `admin@mvm.com`
- Password: `Admin@123`

### HOD (Dr. Ram Kumar)
- School Code: `MVMCHN`
- Email: `hod.science@mvm.com`
- Password: `Hod@12345`
- User ID: `b31a962c-18e3-4694-b661-addf4d6a80ec`
- Departments: IX_Science, X_Science

### Teacher (Priya Singh)
- School Code: `MVMCHN`
- Email: `teacher.science@mvm.com`
- Password: `Teacher@123`
- User ID: `32dfe62c-cce7-44d0-9c5c-13df3cdf061f`
- Departments: IX_Science, X_Science

### Student (Rahul Sharma)
- School Code: `MVMCHN`
- Email: `student1@mvm.com`
- Password: `Student@123`
- User ID: `2aa87359-8317-4a6c-aac2-1c4064e0d9bb`
- Grade: 9

## Department IDs
- IX_Science: `3bedf6c1-d838-4851-a27d-9774fa2b027a`
- X_Science: `85ab55f2-1145-41bf-b6c7-c61ee0813dae`
- IX_Mathematics: `41c720e0-4fe3-480f-9026-9fd1763cf457`

## Tenant
- Tenant ID: `f09533f9-49ed-460f-b6fb-fcf9fdba009e`
- Code: `MVMCHN`

## Blueprint
- IX Science Half Yearly 2026: `11d1d880-0913-4a68-89bf-70c23872df1d`
  - Section A: MCQ, 1 mark, 20 required
  - Section B: Short Answer, 2 marks, 15 required
  - Section C: Long Answer, 5 marks, 6 required

## Test
- IX Sci Mock 2026: `ec3919f4-90ec-464e-9081-d1f408b953f1`

## Test Data (IX_Science Department)
- Total questions: ~22
- Approved: ~15
- Pending: ~7
- Section A: 12 approved / 20 required (60%)
- Section B: 3 approved / 15 required (20%)
- Section C: 0 approved / 6 required (0%)

## S3 Environment Variables (Required for image upload)
```
AWS_S3_BUCKET=<bucket-name>
AWS_S3_REGION=<region>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
```
