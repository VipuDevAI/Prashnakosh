import { 
  type User, type InsertUser,
  type Tenant, type InsertTenant,
  type Question, type InsertQuestion,
  type Chapter, type InsertChapter,
  type Test, type InsertTest,
  type Attempt, type InsertAttempt,
  type PracticeSession, type InsertPracticeSession,
  type Portion, type InsertPortion,
  type Passage, type InsertPassage,
  type ExamConfig, type InsertExamConfig,
  type Upload, type InsertUpload,
  type Grade, type InsertGrade,
  type Blueprint, type InsertBlueprint,
  type ActivityLog, type InsertActivityLog,
  type QuestionReview, type InsertQuestionReview,
  type ExamAuditLog, type InsertExamAuditLog,
  type StudentNotification, type InsertStudentNotification,
  type AcademicYear, type InsertAcademicYear,
  type GradeConfig, type InsertGradeConfig,
  type ExamFramework, type InsertExamFramework,
  type BlueprintPolicy, type InsertBlueprintPolicy,
  type ReferenceLibrary, type InsertReferenceLibrary,
  type PaperGenerationAudit, type InsertPaperGenerationAudit,
  type StorageUsage, type InsertStorageUsage,
  type AuthUser,
  type QuestionStatus,
  type UserRole,
  type QuestionType,
  type DifficultyLevel,
  type BloomLevel,
  type TestType,
  type WorkflowState,
  type GradeGroup,
  calculateExamDuration
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Auth
  authenticateUser(email: string, password: string, schoolCode: string): Promise<{ user: AuthUser; token: string } | null>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getStudentsByTenant(tenantId: string): Promise<{ id: string; name: string }[]>;
  getAllStudents(): Promise<{ id: string; name: string }[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByCode(code: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | undefined>;
  deleteTenant(id: string): Promise<boolean>;
  
  // Questions
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByIds(ids: string[]): Promise<Question[]>;
  getQuestionsByTenant(tenantId: string): Promise<Question[]>;
  getPracticeQuestions(tenantId: string, subject?: string, chapter?: string): Promise<Question[]>;
  getAssessmentQuestions(tenantId: string, subject: string, grade?: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  updateQuestion(id: string, data: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;
  approveQuestion(id: string): Promise<Question | undefined>;
  
  // Passages
  getPassage(id: string): Promise<Passage | undefined>;
  getPassagesByTenant(tenantId: string): Promise<Passage[]>;
  createPassage(passage: InsertPassage): Promise<Passage>;
  
  // Chapters
  getChapter(id: string): Promise<Chapter | undefined>;
  getChaptersByTenant(tenantId: string): Promise<Chapter[]>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: string, data: Partial<Chapter>): Promise<Chapter | undefined>;
  unlockChapter(id: string): Promise<Chapter | undefined>;
  lockChapter(id: string): Promise<Chapter | undefined>;
  setChapterDeadline(id: string, deadline: Date): Promise<Chapter | undefined>;
  revealChapterScores(id: string): Promise<Chapter | undefined>;
  
  // Tests
  getTest(id: string): Promise<Test | undefined>;
  getTestsByTenant(tenantId: string): Promise<Test[]>;
  getAvailableMockTests(tenantId: string): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: string, data: Partial<Test>): Promise<Test | undefined>;
  activateTest(id: string): Promise<Test | undefined>;
  revealTestResults(id: string): Promise<Test | undefined>;
  
  // Attempts
  getAttempt(id: string): Promise<Attempt | undefined>;
  getAttemptsByStudent(studentId: string): Promise<Attempt[]>;
  getAttemptsByTest(testId: string): Promise<Attempt[]>;
  getActiveAttempt(testId: string, studentId: string): Promise<Attempt | undefined>;
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  updateAttempt(id: string, data: Partial<Attempt>): Promise<Attempt | undefined>;
  
  // Exam Config
  getConfig(tenantId: string, key: string): Promise<string | null>;
  setConfig(tenantId: string, key: string, value: string): Promise<void>;
  getAllConfig(tenantId: string): Promise<Record<string, string>>;
  
  // Uploads
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUploadsByTenant(tenantId: string): Promise<Upload[]>;
  deleteUpload(id: string): Promise<boolean>;
  
  // Practice
  startPracticeSession(tenantId: string, studentId: string, subject: string, chapter?: string): Promise<{ session: PracticeSession; questions: Question[] }>;
  submitPractice(answers: Record<string, string>, questionIds: string[]): Promise<{ correct: number; total: number }>;
  
  // Exam Engine
  startExam(tenantId: string, testId: string, studentId: string): Promise<{ attempt: Attempt; questions: Question[]; duration: number }>;
  saveExamState(attemptId: string, answers: Record<string, string>, questionStatuses: Record<string, QuestionStatus>, markedForReview: string[], timeRemaining: number): Promise<Attempt | undefined>;
  submitExam(attemptId: string, answers: Record<string, string>): Promise<{ score: number; total: number; percentage: number; needsManualMarking: boolean }>;
  
  // Manual Marking
  markQuestion(attemptId: string, questionId: string, score: number): Promise<Attempt | undefined>;
  finalizeMarking(attemptId: string, remarks?: string): Promise<Attempt | undefined>;
  
  // Reports
  getReportData(userId: string): Promise<{
    attempts: Attempt[];
    summary: { totalTests: number; averageScore: number; bestScore: number; trend: "up" | "down" | "stable" };
    topicAccuracy: { topic: string; accuracy: number; attempted: number }[];
  }>;
  
  // Grades
  createGrade(grade: InsertGrade): Promise<Grade>;
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  getGradesByTest(testId: string): Promise<Grade[]>;
  
  // Analytics
  getAnalytics(tenantId: string, daysBack?: number): Promise<{
    totalStudents: number;
    totalQuestions: number;
    totalTests: number;
    averageScore: number;
    subjectPerformance: { subject: string; avgScore: number; attempts: number }[];
    recentActivity: { date: string; tests: number; avgScore: number }[];
  }>;
  
  // Blueprints
  getBlueprint(id: string): Promise<Blueprint | undefined>;
  getBlueprintsByTenant(tenantId: string): Promise<Blueprint[]>;
  createBlueprint(blueprint: InsertBlueprint): Promise<Blueprint>;
  updateBlueprint(id: string, data: Partial<Blueprint>): Promise<Blueprint | undefined>;
  approveBlueprint(id: string, approvedBy: string): Promise<Blueprint | undefined>;
  
  // Activity Logs
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(tenantId: string, entityType?: string, entityId?: string): Promise<ActivityLog[]>;
  
  // Question Reviews (HOD)
  createQuestionReview(review: InsertQuestionReview): Promise<QuestionReview>;
  getQuestionReviews(questionId: string): Promise<QuestionReview[]>;
  getPendingQuestions(tenantId: string): Promise<Question[]>;
  getPendingQuestionsForReview(tenantId: string): Promise<Question[]>;
  approveQuestionByHOD(questionId: string, reviewerId: string, comments?: string): Promise<Question | undefined>;
  rejectQuestionByHOD(questionId: string, reviewerId: string, comments: string): Promise<Question | undefined>;
  
  // Workflow Management
  updateTestWorkflow(testId: string, state: WorkflowState, userId: string, comments?: string): Promise<Test | undefined>;
  getTestsByWorkflowState(tenantId: string, states: WorkflowState[]): Promise<Test[]>;
  sendTestToCommittee(testId: string): Promise<Test | undefined>;
  lockTest(testId: string): Promise<Test | undefined>;
  markTestConfidential(testId: string): Promise<Test | undefined>;
  markPrintingReady(testId: string): Promise<Test | undefined>;
  
  // Paper Generation
  generateQuestionPaper(testId: string, format: "A4" | "Legal"): Promise<{ paperUrl: string; answerKeyUrl: string }>;
  
  // Blueprint-based Question Selection
  selectQuestionsForBlueprint(
    tenantId: string,
    subject: string,
    grade: string,
    sections: { name: string; marks: number; questionCount: number; questionType: string; difficulty?: string; chapters?: string[] }[]
  ): Promise<Question[]>;
  
  // Additional Methods for New Pages
  deleteBlueprint(id: string): Promise<boolean>;
  updateChapterPortions(id: string, completedTopics: string[]): Promise<Chapter | undefined>;
  getSubjectsByTenant(tenantId: string): Promise<{ id: string; name: string; classLevel: string }[]>;
  getMakeupTestsByTenant(tenantId: string): Promise<any[]>;
  createMakeupTest(data: any): Promise<any>;
  getSubmissionsByTenant(tenantId: string): Promise<any[]>;
  updateSubmissionMarks(id: string, marks: Record<string, number>, feedback: Record<string, string>): Promise<any>;
  completeSubmissionMarking(id: string): Promise<any>;
  getResultsByUser(tenantId: string, userId?: string): Promise<any[]>;
  getChildrenByParent(parentId: string): Promise<any[]>;
  getResultsByParent(parentId: string): Promise<any[]>;
  getProgressByParent(parentId: string): Promise<any[]>;
  getNotificationsByParent(parentId: string): Promise<any[]>;
  getRiskAlertsByTenant(tenantId: string): Promise<any[]>;
  acknowledgeRiskAlert(id: string): Promise<any>;
  getAllAttempts(tenantId: string): Promise<Attempt[]>;
  createRiskAlert(alert: any): Promise<any>;
  
  // Exam Audit Logs
  createExamAuditLog(log: InsertExamAuditLog): Promise<ExamAuditLog>;
  getExamAuditLogs(examId: string): Promise<ExamAuditLog[]>;
  getExamAuditLogsByTenant(tenantId: string): Promise<ExamAuditLog[]>;
  
  // Student Dashboard - Results & Attempt Lock
  hasCompletedAttempt(testId: string, studentId: string): Promise<boolean>;
  getStudentResultsWithDetails(studentId: string): Promise<{
    attemptId: string;
    testId: string;
    testTitle: string;
    testType: string;
    subject: string;
    chapter: string | null;
    score: number | null;
    totalMarks: number | null;
    percentage: string | null;
    status: string;
    submittedAt: Date | null;
  }[]>;
  getAvailableStudentTests(tenantId: string, studentId: string): Promise<(Test & { hasCompletedAttempt: boolean; hasActiveAttempt: boolean })[]>;
  
  // Student Notifications
  createStudentNotification(notification: InsertStudentNotification): Promise<StudentNotification>;
  getStudentNotifications(studentId: string): Promise<StudentNotification[]>;
  markNotificationRead(notificationId: string): Promise<StudentNotification | undefined>;
  markAllNotificationsRead(studentId: string): Promise<void>;
  
  // Principal Dashboard Analytics (read-only)
  getPrincipalSchoolSnapshot(tenantId: string): Promise<{
    totalStudents: number;
    testsThisMonth: number;
    averageScore: number;
    atRiskCount: number;
  }>;
  getPrincipalGradePerformance(tenantId: string): Promise<{
    grade: string;
    averageScore: number;
    passPercentage: number;
    totalAttempts: number;
    trend: 'up' | 'down' | 'stable';
  }[]>;
  getPrincipalSubjectHealth(tenantId: string, grade?: string): Promise<{
    subject: string;
    grade: string;
    averagePercentage: number;
    totalAttempts: number;
    isWeak: boolean;
  }[]>;
  getPrincipalAtRiskStudents(tenantId: string): Promise<{
    studentId: string;
    studentName: string;
    grade: string;
    lowScoreCount: number;
    averagePercentage: number;
    trend: 'declining' | 'stable' | 'improving';
  }[]>;
  getPrincipalRiskAlerts(tenantId: string): Promise<{
    type: 'tab_switch' | 'absence' | 'sudden_drop';
    studentId: string;
    studentName: string;
    grade: string;
    details: string;
    count: number;
    createdAt: Date | null;
  }[]>;
  
  // Academic Years
  getAcademicYear(id: string): Promise<AcademicYear | undefined>;
  getAcademicYearsByTenant(tenantId: string): Promise<AcademicYear[]>;
  getActiveAcademicYear(tenantId: string): Promise<AcademicYear | undefined>;
  createAcademicYear(year: InsertAcademicYear): Promise<AcademicYear>;
  updateAcademicYear(id: string, data: Partial<AcademicYear>): Promise<AcademicYear | undefined>;
  activateAcademicYear(tenantId: string, yearId: string): Promise<AcademicYear | undefined>;
  lockAcademicYear(id: string, lockedBy: string): Promise<AcademicYear | undefined>;
  
  // Grade Configurations
  getGradeConfig(id: string): Promise<GradeConfig | undefined>;
  getGradeConfigsByTenant(tenantId: string, academicYearId?: string): Promise<GradeConfig[]>;
  createGradeConfig(config: InsertGradeConfig): Promise<GradeConfig>;
  createGradeConfigsBulk(configs: InsertGradeConfig[]): Promise<GradeConfig[]>;
  updateGradeConfig(id: string, data: Partial<GradeConfig>): Promise<GradeConfig | undefined>;
  
  // User Code Generation
  generateUserCode(tenantId: string): Promise<string>;
  
  // Soft Delete Usage Checks
  isQuestionInUse(questionId: string): Promise<boolean>;
  isBlueprintInUse(blueprintId: string): Promise<boolean>;
  isUserInUse(userId: string): Promise<boolean>;
  isUploadInUse(uploadId: string): Promise<boolean>;
  
  // Soft Delete Operations (replaces hard delete)
  softDeleteQuestion(id: string, deletedBy: string): Promise<boolean>;
  softDeleteBlueprint(id: string, deletedBy: string): Promise<boolean>;
  softDeleteUser(id: string, deletedBy: string): Promise<boolean>;
  softDeleteUpload(id: string, deletedBy: string): Promise<boolean>;
  
  // =====================================================
  // PHASE 2+3: SUPER ADMIN GOVERNANCE
  // =====================================================
  
  // Exam Frameworks
  getExamFramework(id: string): Promise<ExamFramework | undefined>;
  getExamFrameworksByTenant(tenantId: string, academicYearId?: string, gradeGroup?: GradeGroup): Promise<ExamFramework[]>;
  createExamFramework(framework: InsertExamFramework): Promise<ExamFramework>;
  updateExamFramework(id: string, data: Partial<ExamFramework>): Promise<ExamFramework | undefined>;
  deleteExamFramework(id: string): Promise<boolean>;
  
  // Blueprint Policies
  getBlueprintPolicy(id: string): Promise<BlueprintPolicy | undefined>;
  getBlueprintPolicyByTenant(tenantId: string, academicYearId?: string): Promise<BlueprintPolicy | undefined>;
  createBlueprintPolicy(policy: InsertBlueprintPolicy): Promise<BlueprintPolicy>;
  updateBlueprintPolicy(id: string, data: Partial<BlueprintPolicy>): Promise<BlueprintPolicy | undefined>;
  
  // Reference Library
  getReferenceItem(id: string): Promise<ReferenceLibrary | undefined>;
  getReferenceLibrary(tenantId: string, grade?: string, subject?: string): Promise<ReferenceLibrary[]>;
  getStudentReferenceMaterials(tenantId: string, grade: string, subject?: string): Promise<ReferenceLibrary[]>;
  createReferenceItem(item: InsertReferenceLibrary): Promise<ReferenceLibrary>;
  updateReferenceItem(id: string, data: Partial<ReferenceLibrary>): Promise<ReferenceLibrary | undefined>;
  softDeleteReferenceItem(id: string, deletedBy: string): Promise<boolean>;
  restoreReferenceItem(id: string): Promise<ReferenceLibrary | undefined>;
  
  // Paper Generation Audit
  createPaperGenerationAudit(audit: InsertPaperGenerationAudit): Promise<PaperGenerationAudit>;
  getPaperGenerationAudit(testId: string): Promise<PaperGenerationAudit[]>;
  
  // Storage Usage
  getStorageUsage(tenantId: string): Promise<StorageUsage | undefined>;
  updateStorageUsage(tenantId: string, data: Partial<StorageUsage>): Promise<StorageUsage | undefined>;
  recalculateStorageUsage(tenantId: string): Promise<StorageUsage>;
  
  // =====================================================
  // SUPER ADMIN EXAM CONFIGURATION
  // =====================================================
  
  // Admin Exam Configs
  getAdminExamConfig(id: string): Promise<AdminExamConfig | undefined>;
  getAdminExamConfigsByTenant(tenantId: string, wing?: WingType): Promise<AdminExamConfig[]>;
  getActiveExamsForBlueprint(tenantId: string): Promise<AdminExamConfig[]>;
  getMockTestExams(tenantId: string): Promise<AdminExamConfig[]>;
  createAdminExamConfig(config: InsertAdminExamConfig): Promise<AdminExamConfig>;
  updateAdminExamConfig(id: string, data: Partial<AdminExamConfig>): Promise<AdminExamConfig | undefined>;
  softDeleteAdminExamConfig(id: string, deletedBy: string): Promise<boolean>;
  isExamConfigInUse(examConfigId: string): Promise<boolean>;
  
  // School Storage Configs
  getSchoolStorageConfig(tenantId: string): Promise<SchoolStorageConfig | undefined>;
  createOrUpdateSchoolStorageConfig(tenantId: string, data: Partial<SchoolStorageConfig>): Promise<SchoolStorageConfig>;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tenants: Map<string, Tenant>;
  private questions: Map<string, Question>;
  private passages: Map<string, Passage>;
  private chapters: Map<string, Chapter>;
  private tests: Map<string, Test>;
  private attempts: Map<string, Attempt>;
  private practiceSessions: Map<string, PracticeSession>;
  private portions: Map<string, Portion>;
  private config: Map<string, ExamConfig>;
  private uploads: Map<string, Upload>;
  private grades: Map<string, Grade>;
  private blueprints: Map<string, Blueprint>;
  private activityLogs: Map<string, ActivityLog>;
  private questionReviews: Map<string, QuestionReview>;
  private makeupTests: Map<string, any>;
  private riskAlerts: Map<string, any>;
  private notifications: Map<string, any>;
  private examAuditLogs: Map<string, ExamAuditLog>;
  private studentNotifications: Map<string, StudentNotification>;

  constructor() {
    this.users = new Map();
    this.tenants = new Map();
    this.questions = new Map();
    this.passages = new Map();
    this.chapters = new Map();
    this.tests = new Map();
    this.attempts = new Map();
    this.practiceSessions = new Map();
    this.portions = new Map();
    this.config = new Map();
    this.uploads = new Map();
    this.grades = new Map();
    this.blueprints = new Map();
    this.activityLogs = new Map();
    this.questionReviews = new Map();
    this.makeupTests = new Map();
    this.riskAlerts = new Map();
    this.notifications = new Map();
    this.examAuditLogs = new Map();
    this.studentNotifications = new Map();
    
    this.seedData();
  }

  private seedData() {
    // Create Super Admin account only - no demo data
    const superAdmin: User = {
      id: "user-superadmin",
      tenantId: null,
      email: "superadmin@safal.com",
      password: "SuperAdmin@123",
      name: "Super Admin",
      role: "super_admin",
      grade: null,
      avatar: null,
      parentOf: null,
      active: true,
      assignedQuestions: {},
      sessionToken: null,
    };
    this.users.set(superAdmin.id, superAdmin);
  }

  async authenticateUser(email: string, password: string, schoolCode: string): Promise<{ user: AuthUser; token: string } | null> {
    // Super Admin login - no school code required
    if (schoolCode === "SUPERADMIN" || schoolCode === "") {
      const superAdmin = Array.from(this.users.values()).find(
        u => u.email === email && u.password === password && u.role === "super_admin"
      );
      if (superAdmin) {
        const authUser: AuthUser = {
          id: superAdmin.id,
          tenantId: superAdmin.tenantId,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
          grade: superAdmin.grade || undefined,
          avatar: superAdmin.avatar,
        };
        return { user: authUser, token: `token-${superAdmin.id}-${Date.now()}` };
      }
    }

    // Regular user login - requires school code
    const tenant = await this.getTenantByCode(schoolCode);
    if (!tenant) return null;

    const user = Array.from(this.users.values()).find(
      u => u.email === email && u.password === password && u.tenantId === tenant.id
    );
    if (!user) return null;

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      grade: user.grade || undefined,
      avatar: user.avatar,
    };

    return { user: authUser, token: `token-${user.id}-${Date.now()}` };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.tenantId === tenantId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getStudentsByTenant(tenantId: string): Promise<{ id: string; name: string }[]> {
    return Array.from(this.users.values())
      .filter(u => u.tenantId === tenantId && u.role === "student")
      .map(u => ({ id: u.id, name: u.name }));
  }

  async getAllStudents(): Promise<{ id: string; name: string }[]> {
    return Array.from(this.users.values())
      .filter(u => u.role === "student")
      .map(u => ({ id: u.id, name: u.name }));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      tenantId: insertUser.tenantId || null,
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      role: insertUser.role,
      grade: insertUser.grade || null,
      avatar: insertUser.avatar || null,
      parentOf: insertUser.parentOf || null,
      active: insertUser.active ?? true,
      assignedQuestions: insertUser.assignedQuestions || {},
      sessionToken: insertUser.sessionToken || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantByCode(code: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(t => t.code === code);
  }

  async getAllTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const id = randomUUID();
    const tenant: Tenant = { 
      id, 
      name: insertTenant.name,
      code: insertTenant.code,
      logo: insertTenant.logo || null, 
      active: insertTenant.active ?? true 
    };
    this.tenants.set(id, tenant);
    return tenant;
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(id);
    if (!tenant) return undefined;
    const updated = { ...tenant, ...data };
    this.tenants.set(id, updated);
    return updated;
  }

  async deleteTenant(id: string): Promise<boolean> {
    return this.tenants.delete(id);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsByIds(ids: string[]): Promise<Question[]> {
    return ids.map(id => this.questions.get(id)).filter((q): q is Question => q !== undefined);
  }

  async getQuestionsByTenant(tenantId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.tenantId === tenantId);
  }

  async getPracticeQuestions(tenantId: string, subject?: string, chapter?: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => {
      if (q.tenantId !== tenantId) return false;
      if (!q.isPractice) return false;
      if (subject && q.subject !== subject) return false;
      if (chapter && chapter !== "all" && q.chapter !== chapter) return false;
      return true;
    });
  }

  async getAssessmentQuestions(tenantId: string, subject: string, grade?: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => {
      if (q.tenantId !== tenantId) return false;
      if (!q.isAssessment) return false;
      if (q.subject.toLowerCase() !== subject.toLowerCase()) return false;
      if (grade && q.grade !== grade) return false;
      return q.isVerified;
    });
  }

  async getFilteredAssessmentQuestions(
    tenantId: string, 
    subject: string, 
    options: {
      grade?: string;
      chapter?: string;
      chapters?: string[];
      questionType?: string;
      objectiveOnly?: boolean;
      marks?: number;
    } = {}
  ): Promise<Question[]> {
    const OBJECTIVE_TYPES = ["mcq", "true_false", "fill_blank", "numerical", "assertion_reason", "matching"];
    
    return Array.from(this.questions.values()).filter(q => {
      if (q.tenantId !== tenantId) return false;
      if (!q.isAssessment) return false;
      if (!q.isVerified) return false;
      if (q.subject.toLowerCase() !== subject.toLowerCase()) return false;
      if (options.grade && q.grade !== options.grade) return false;
      // chapters array takes precedence over single chapter
      if (options.chapters && options.chapters.length > 0) {
        if (!q.chapter || !options.chapters.includes(q.chapter)) return false;
      } else if (options.chapter && q.chapter !== options.chapter) {
        return false;
      }
      if (options.questionType && q.type !== options.questionType) return false;
      if (options.marks && q.marks !== options.marks) return false;
      if (options.objectiveOnly && !OBJECTIVE_TYPES.includes(q.type)) return false;
      return true;
    });
  }

  selectQuestionsWithPassageGrouping(availableQuestions: Question[], count: number): Question[] {
    const passageGroups = new Map<string, Question[]>();
    const standaloneQuestions: Question[] = [];
    
    for (const q of availableQuestions) {
      if (q.passageId) {
        const existing = passageGroups.get(q.passageId) || [];
        existing.push(q);
        passageGroups.set(q.passageId, existing);
      } else {
        standaloneQuestions.push(q);
      }
    }
    
    const selected: Question[] = [];
    
    for (const [passageId, passageQuestions] of passageGroups) {
      if (passageQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * passageQuestions.length);
        selected.push(passageQuestions[randomIndex]);
      }
    }
    
    const shuffledStandalone = shuffleArray(standaloneQuestions);
    const remaining = count - selected.length;
    if (remaining > 0) {
      selected.push(...shuffledStandalone.slice(0, remaining));
    }
    
    return shuffleArray(selected).slice(0, count);
  }

  async attachPassageToQuestions(questionsData: Question[]): Promise<(Question & { passageText?: string | null })[]> {
    return Promise.all(questionsData.map(async (q) => {
      if (q.passageId) {
        const passage = await this.getPassage(q.passageId);
        return { ...q, passageText: passage?.content || null };
      }
      return { ...q, passageText: null };
    }));
  }

  async selectQuestionsForBlueprint(
    tenantId: string,
    subject: string,
    grade: string,
    sections: { name: string; marks: number; questionCount: number; questionType: string; difficulty?: string; chapters?: string[] }[]
  ): Promise<Question[]> {
    const selectedQuestions: Question[] = [];
    
    for (const section of sections) {
      const pool = await this.getFilteredAssessmentQuestions(tenantId, subject, {
        grade,
        chapters: section.chapters,
        questionType: section.questionType,
        marks: section.marks,
      });
      
      const difficultyFiltered = section.difficulty 
        ? pool.filter(q => q.difficulty === section.difficulty)
        : pool;
      
      const alreadySelectedIds = new Set(selectedQuestions.map(q => q.id));
      const available = difficultyFiltered.filter(q => !alreadySelectedIds.has(q.id));
      
      const sectionQuestions = this.selectQuestionsWithPassageGrouping(available, section.questionCount);
      selectedQuestions.push(...sectionQuestions);
    }
    
    return selectedQuestions;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { 
      id,
      tenantId: insertQuestion.tenantId,
      content: insertQuestion.content,
      type: insertQuestion.type,
      options: insertQuestion.options || null,
      optionImages: insertQuestion.optionImages || null,
      correctAnswer: insertQuestion.correctAnswer || null,
      explanation: insertQuestion.explanation || null,
      hint: insertQuestion.hint || null,
      imageUrl: insertQuestion.imageUrl || null,
      passageId: insertQuestion.passageId || null,
      instructionText: insertQuestion.instructionText || null,
      subject: insertQuestion.subject,
      chapter: insertQuestion.chapter,
      topic: insertQuestion.topic || null,
      grade: insertQuestion.grade,
      difficulty: insertQuestion.difficulty || "medium",
      bloomLevel: insertQuestion.bloomLevel || null,
      marks: insertQuestion.marks || 1,
      isVerified: false,
      isPractice: insertQuestion.isPractice ?? true,
      isAssessment: insertQuestion.isAssessment ?? false,
      createdBy: insertQuestion.createdBy || null,
      uploadId: insertQuestion.uploadId || null,
      status: "draft"
    };
    this.questions.set(id, question);
    return question;
  }

  async createQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    return Promise.all(insertQuestions.map(q => this.createQuestion(q)));
  }

  async updateQuestion(id: string, data: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    const updated = { ...question, ...data };
    this.questions.set(id, updated);
    return updated;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    return this.questions.delete(id);
  }

  async approveQuestion(id: string): Promise<Question | undefined> {
    return this.updateQuestion(id, { isVerified: true, status: "approved" });
  }

  async getPassage(id: string): Promise<Passage | undefined> {
    return this.passages.get(id);
  }

  async getPassagesByTenant(tenantId: string): Promise<Passage[]> {
    return Array.from(this.passages.values()).filter(p => p.tenantId === tenantId);
  }

  async createPassage(insertPassage: InsertPassage): Promise<Passage> {
    const id = randomUUID();
    const passage: Passage = {
      id,
      tenantId: insertPassage.tenantId,
      title: insertPassage.title || null,
      content: insertPassage.content,
      subject: insertPassage.subject,
      grade: insertPassage.grade || null,
      passageType: insertPassage.passageType || "prose"
    };
    this.passages.set(id, passage);
    return passage;
  }

  async getChapter(id: string): Promise<Chapter | undefined> {
    return this.chapters.get(id);
  }

  async getChaptersByTenant(tenantId: string): Promise<Chapter[]> {
    return Array.from(this.chapters.values()).filter(c => c.tenantId === tenantId);
  }

  async createChapter(insertChapter: InsertChapter): Promise<Chapter> {
    const id = randomUUID();
    const chapter: Chapter = { 
      id,
      tenantId: insertChapter.tenantId,
      name: insertChapter.name,
      subject: insertChapter.subject,
      grade: insertChapter.grade,
      orderIndex: insertChapter.orderIndex || 0,
      status: "draft", 
      unlockDate: null,
      deadline: null,
      scoresRevealed: false 
    };
    this.chapters.set(id, chapter);
    return chapter;
  }

  async updateChapter(id: string, data: Partial<Chapter>): Promise<Chapter | undefined> {
    const chapter = this.chapters.get(id);
    if (!chapter) return undefined;
    const updated = { ...chapter, ...data };
    this.chapters.set(id, updated);
    return updated;
  }

  async unlockChapter(id: string): Promise<Chapter | undefined> {
    return this.updateChapter(id, { status: "unlocked", unlockDate: new Date() });
  }

  async lockChapter(id: string): Promise<Chapter | undefined> {
    return this.updateChapter(id, { status: "locked" });
  }

  async setChapterDeadline(id: string, deadline: Date): Promise<Chapter | undefined> {
    return this.updateChapter(id, { deadline });
  }

  async revealChapterScores(id: string): Promise<Chapter | undefined> {
    return this.updateChapter(id, { scoresRevealed: true });
  }

  async getTest(id: string): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async getTestsByTenant(tenantId: string): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(t => t.tenantId === tenantId);
  }

  async getAvailableMockTests(tenantId: string): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(t => 
      t.tenantId === tenantId && t.type === "mock" && t.isActive
    );
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = randomUUID();
    const totalMarks = insertTest.totalMarks || 40;
    const duration = insertTest.duration || calculateExamDuration(totalMarks);
    
    const test: Test = { 
      id,
      tenantId: insertTest.tenantId,
      title: insertTest.title,
      type: insertTest.type,
      subject: insertTest.subject,
      grade: insertTest.grade,
      section: insertTest.section || null,
      chapterId: insertTest.chapterId || null,
      duration,
      totalMarks,
      questionCount: insertTest.questionCount || 50,
      questionIds: insertTest.questionIds || null,
      isActive: false,
      resultsRevealed: false,
      createdBy: insertTest.createdBy || null,
      blueprintId: insertTest.blueprintId || null,
      workflowState: insertTest.workflowState || "draft",
      hodApprovedBy: null,
      hodApprovedAt: null,
      hodComments: null,
      principalApprovedBy: null,
      principalApprovedAt: null,
      principalComments: null,
      sentToCommitteeAt: null,
      isConfidential: false,
      printingReady: false,
      paperFormat: "A4",
      generatedPaperUrl: null,
      answerKeyUrl: null
    };
    this.tests.set(id, test);
    return test;
  }

  async updateTest(id: string, data: Partial<Test>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    const updated = { ...test, ...data };
    this.tests.set(id, updated);
    return updated;
  }

  async activateTest(id: string): Promise<Test | undefined> {
    return this.updateTest(id, { isActive: true });
  }

  async revealTestResults(id: string): Promise<Test | undefined> {
    return this.updateTest(id, { resultsRevealed: true });
  }

  async getAttempt(id: string): Promise<Attempt | undefined> {
    return this.attempts.get(id);
  }

  async getAttemptsByStudent(studentId: string): Promise<Attempt[]> {
    return Array.from(this.attempts.values()).filter(a => a.studentId === studentId);
  }

  async getAttemptsByTest(testId: string): Promise<Attempt[]> {
    return Array.from(this.attempts.values()).filter(a => a.testId === testId);
  }

  async getActiveAttempt(testId: string, studentId: string): Promise<Attempt | undefined> {
    return Array.from(this.attempts.values()).find(
      a => a.testId === testId && a.studentId === studentId && a.status === "in_progress"
    );
  }

  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const id = randomUUID();
    const attempt: Attempt = { 
      id,
      tenantId: insertAttempt.tenantId,
      testId: insertAttempt.testId,
      studentId: insertAttempt.studentId,
      assignedQuestionIds: insertAttempt.assignedQuestionIds || null,
      answers: insertAttempt.answers || {},
      questionStatuses: insertAttempt.questionStatuses || {},
      markedForReview: insertAttempt.markedForReview || [],
      score: null,
      totalMarks: insertAttempt.totalMarks || null,
      percentage: null,
      status: "in_progress", 
      timeRemaining: insertAttempt.timeRemaining || null,
      startedAt: new Date(),
      submittedAt: null,
      teacherRemarks: null,
      manualScores: null
    };
    this.attempts.set(id, attempt);
    return attempt;
  }

  async updateAttempt(id: string, data: Partial<Attempt>): Promise<Attempt | undefined> {
    const attempt = this.attempts.get(id);
    if (!attempt) return undefined;
    const updated = { ...attempt, ...data };
    this.attempts.set(id, updated);
    return updated;
  }

  async getConfig(tenantId: string, key: string): Promise<string | null> {
    const cfg = Array.from(this.config.values()).find(
      c => c.tenantId === tenantId && c.key === key
    );
    return cfg?.value || null;
  }

  async setConfig(tenantId: string, key: string, value: string): Promise<void> {
    const existing = Array.from(this.config.values()).find(
      c => c.tenantId === tenantId && c.key === key
    );
    if (existing) {
      this.config.set(existing.id, { ...existing, value });
    } else {
      const id = randomUUID();
      this.config.set(id, { id, tenantId, key, value });
    }
  }

  async getAllConfig(tenantId: string): Promise<Record<string, string>> {
    const configs = Array.from(this.config.values()).filter(c => c.tenantId === tenantId);
    return configs.reduce((acc, c) => {
      if (c.value) acc[c.key] = c.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const id = randomUUID();
    const upload: Upload = {
      id,
      tenantId: insertUpload.tenantId,
      filename: insertUpload.filename,
      source: insertUpload.source,
      subject: insertUpload.subject || null,
      grade: insertUpload.grade || null,
      questionCount: insertUpload.questionCount || 0,
      uploadedBy: insertUpload.uploadedBy || null,
      uploadedAt: new Date()
    };
    this.uploads.set(id, upload);
    return upload;
  }

  async getUploadsByTenant(tenantId: string): Promise<Upload[]> {
    return Array.from(this.uploads.values()).filter(u => u.tenantId === tenantId);
  }

  async deleteUpload(id: string): Promise<boolean> {
    const upload = this.uploads.get(id);
    if (!upload) return false;
    
    // Delete associated questions
    const entries = Array.from(this.questions.entries());
    for (const [qId, q] of entries) {
      if (q.uploadId === id) {
        this.questions.delete(qId);
      }
    }
    
    return this.uploads.delete(id);
  }

  async startPracticeSession(tenantId: string, studentId: string, subject: string, chapter?: string): Promise<{ session: PracticeSession; questions: Question[] }> {
    const questions = await this.getPracticeQuestions(tenantId, subject, chapter);
    const shuffled = shuffleArray(questions).slice(0, 10);
    
    const session: PracticeSession = {
      id: randomUUID(),
      tenantId,
      studentId,
      subject,
      chapter: chapter || null,
      topic: null,
      questionsAttempted: 0,
      correctAnswers: 0,
      status: "active",
    };
    this.practiceSessions.set(session.id, session);
    
    return { session, questions: shuffled };
  }

  async submitPractice(answers: Record<string, string>, questionIds: string[]): Promise<{ correct: number; total: number }> {
    let correct = 0;
    for (const qId of questionIds) {
      const question = this.questions.get(qId);
      if (question && answers[qId]) {
        const userAnswer = answers[qId].toLowerCase().trim();
        const correctAnswer = (question.correctAnswer || "").toLowerCase().trim();
        if (userAnswer === correctAnswer) correct++;
      }
    }
    return { correct, total: questionIds.length };
  }

  async startExam(tenantId: string, testId: string, studentId: string): Promise<{ attempt: Attempt; questions: Question[]; duration: number }> {
    const test = await this.getTest(testId);
    if (!test) throw new Error("Test not found");

    // Check if exam is active
    const examActive = await this.getConfig(tenantId, "ExamActive");
    if (examActive === "false") {
      throw new Error("Exam is currently disabled by admin");
    }

    // Check for existing in-progress attempt
    let existingAttempt = await this.getActiveAttempt(testId, studentId);
    if (existingAttempt) {
      // Resume existing attempt
      const questions = await this.getQuestionsByIds(existingAttempt.assignedQuestionIds || []);
      const questionsWithPassages = await this.attachPassageToQuestions(questions);
      return { 
        attempt: existingAttempt, 
        questions: questionsWithPassages as Question[], 
        duration: existingAttempt.timeRemaining || test.duration || 60 
      };
    }

    // Check for completed attempts - block re-attempts
    const hasCompleted = await this.hasCompletedAttempt(testId, studentId);
    if (hasCompleted) {
      throw new Error("You have already completed this test. Re-attempts are not allowed.");
    }

    const OBJECTIVE_TYPES = ["mcq", "true_false", "fill_blank", "numerical", "assertion_reason", "matching"];

    // Assign random questions if not pre-assigned
    let questionIds = test.questionIds || [];
    let questionsData: Question[] = [];
    
    if (questionIds.length === 0) {
      const pool = await this.getFilteredAssessmentQuestions(tenantId, test.subject, { 
        grade: test.grade, 
        objectiveOnly: true 
      });
      const needed = test.questionCount || 50;
      if (pool.length < needed) {
        throw new Error(`Not enough objective questions for ${test.subject} (need ${needed}, have ${pool.length})`);
      }
      questionsData = this.selectQuestionsWithPassageGrouping(pool, needed);
      questionIds = questionsData.map(q => q.id);
    } else {
      const preselectedQuestions = await this.getQuestionsByIds(questionIds);
      const objectiveQuestions = preselectedQuestions.filter(q => OBJECTIVE_TYPES.includes(q.type));
      questionsData = this.selectQuestionsWithPassageGrouping(objectiveQuestions, objectiveQuestions.length);
      questionIds = questionsData.map(q => q.id);
    }

    // Calculate duration based on marks
    const duration = test.duration || calculateExamDuration(test.totalMarks || 40);

    // Create initial question statuses
    const questionStatuses: Record<string, QuestionStatus> = {};
    questionIds.forEach(qId => {
      questionStatuses[qId] = "not_visited";
    });

    const attempt = await this.createAttempt({
      tenantId,
      testId,
      studentId,
      assignedQuestionIds: questionIds,
      answers: {},
      questionStatuses,
      markedForReview: [],
      totalMarks: test.totalMarks,
      timeRemaining: duration * 60, // Convert to seconds
    });

    const questionsWithPassages = await this.attachPassageToQuestions(questionsData);
    return { attempt, questions: questionsWithPassages as Question[], duration };
  }

  async saveExamState(
    attemptId: string, 
    answers: Record<string, string>, 
    questionStatuses: Record<string, QuestionStatus>, 
    markedForReview: string[], 
    timeRemaining: number
  ): Promise<Attempt | undefined> {
    return this.updateAttempt(attemptId, {
      answers,
      questionStatuses,
      markedForReview,
      timeRemaining
    });
  }

  async submitExam(attemptId: string, answers: Record<string, string>): Promise<{ score: number; total: number; percentage: number; needsManualMarking: boolean }> {
    const attempt = await this.getAttempt(attemptId);
    if (!attempt) throw new Error("Attempt not found");

    const test = await this.getTest(attempt.testId);
    if (!test) throw new Error("Test not found");

    const questions = await this.getQuestionsByIds(attempt.assignedQuestionIds || []);
    
    let autoScore = 0;
    let needsManualMarking = false;
    const manualQuestionTypes = ["short_answer", "long_answer"];

    for (const question of questions) {
      if (manualQuestionTypes.includes(question.type)) {
        needsManualMarking = true;
        continue;
      }

      const userAnswer = (answers[question.id] || "").toLowerCase().trim();
      const correctAnswer = (question.correctAnswer || "").toLowerCase().trim();
      
      if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
        autoScore += question.marks || 1;
      }
    }

    const total = test.totalMarks || 0;
    const percentage = total > 0 ? parseFloat(((autoScore / total) * 100).toFixed(2)) : 0;

    await this.updateAttempt(attemptId, {
      answers,
      score: autoScore,
      percentage: percentage.toString(),
      status: needsManualMarking ? "submitted" : "marked",
      submittedAt: new Date()
    });

    // Create grade record
    const user = await this.getUser(attempt.studentId);
    await this.createGrade({
      tenantId: attempt.tenantId,
      studentId: attempt.studentId,
      studentName: user?.name || null,
      testId: attempt.testId,
      subject: test.subject,
      grade: test.grade,
      score: autoScore,
      totalMarks: total,
      percentage: percentage.toString()
    });

    return { score: autoScore, total, percentage, needsManualMarking };
  }

  async markQuestion(attemptId: string, questionId: string, score: number): Promise<Attempt | undefined> {
    const attempt = await this.getAttempt(attemptId);
    if (!attempt) return undefined;

    const manualScores = { ...(attempt.manualScores || {}), [questionId]: score };
    const totalManualScore = Object.values(manualScores).reduce((sum, s) => sum + s, 0);
    const newScore = (attempt.score || 0) + totalManualScore;

    return this.updateAttempt(attemptId, { manualScores, score: newScore });
  }

  async finalizeMarking(attemptId: string, remarks?: string): Promise<Attempt | undefined> {
    const attempt = await this.getAttempt(attemptId);
    if (!attempt) return undefined;

    const test = await this.getTest(attempt.testId);
    const total = test?.totalMarks || attempt.totalMarks || 0;
    const percentage = total > 0 ? parseFloat(((attempt.score || 0) / total * 100).toFixed(2)) : 0;

    return this.updateAttempt(attemptId, {
      status: "marked",
      teacherRemarks: remarks || null,
      percentage: percentage.toString()
    });
  }

  async getReportData(userId: string): Promise<{
    attempts: Attempt[];
    summary: { totalTests: number; averageScore: number; bestScore: number; trend: "up" | "down" | "stable" };
    topicAccuracy: { topic: string; accuracy: number; attempted: number }[];
  }> {
    const attempts = await this.getAttemptsByStudent(userId);
    const completedAttempts = attempts.filter(a => a.status === "submitted" || a.status === "marked");

    const scores = completedAttempts.map(a => 
      a.totalMarks ? Math.round((a.score || 0) / a.totalMarks * 100) : 0
    );

    const totalTests = completedAttempts.length;
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    let trend: "up" | "down" | "stable" = "stable";
    if (scores.length >= 2) {
      const recent = scores.slice(-3);
      const earlier = scores.slice(-6, -3);
      if (earlier.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
        trend = recentAvg > earlierAvg + 5 ? "up" : recentAvg < earlierAvg - 5 ? "down" : "stable";
      }
    }

    const topicStats: Record<string, { correct: number; total: number }> = {};
    for (const attempt of completedAttempts) {
      const questions = await this.getQuestionsByIds(attempt.assignedQuestionIds || []);
      
      for (const question of questions) {
        const topic = question.topic || question.chapter;
        if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
        topicStats[topic].total++;
        
        if (attempt.answers && attempt.answers[question.id]) {
          const userAnswer = attempt.answers[question.id].toLowerCase().trim();
          const correctAnswer = (question.correctAnswer || "").toLowerCase().trim();
          if (userAnswer === correctAnswer) topicStats[topic].correct++;
        }
      }
    }

    const topicAccuracy = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      attempted: stats.total,
    })).sort((a, b) => b.accuracy - a.accuracy);

    return {
      attempts: completedAttempts,
      summary: { totalTests, averageScore, bestScore, trend },
      topicAccuracy,
    };
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const id = randomUUID();
    const grade: Grade = {
      id,
      tenantId: insertGrade.tenantId,
      studentId: insertGrade.studentId,
      studentName: insertGrade.studentName || null,
      testId: insertGrade.testId || null,
      subject: insertGrade.subject,
      grade: insertGrade.grade || null,
      score: insertGrade.score || 0,
      totalMarks: insertGrade.totalMarks || null,
      percentage: insertGrade.percentage || null,
      gradedAt: new Date()
    };
    this.grades.set(id, grade);
    return grade;
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(g => g.studentId === studentId);
  }

  async getGradesByTest(testId: string): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(g => g.testId === testId);
  }

  async getAnalytics(tenantId: string, daysBack: number = 0): Promise<{
    totalStudents: number;
    totalQuestions: number;
    totalTests: number;
    averageScore: number;
    subjectPerformance: { subject: string; avgScore: number; attempts: number }[];
    recentActivity: { date: string; tests: number; avgScore: number }[];
  }> {
    const users = await this.getUsersByTenant(tenantId);
    const students = users.filter(u => u.role === "student");
    const questions = await this.getQuestionsByTenant(tenantId);
    const tests = await this.getTestsByTenant(tenantId);
    const allAttempts = Array.from(this.attempts.values()).filter(a => a.tenantId === tenantId);
    
    const cutoffDate = daysBack > 0 ? new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000) : null;
    const filteredAttempts = cutoffDate 
      ? allAttempts.filter(a => {
          const att = a as any;
          const attemptDate = att.completedAt || att.startedAt;
          return attemptDate && new Date(attemptDate) >= cutoffDate;
        })
      : allAttempts;
    
    const completedAttempts = filteredAttempts.filter(a => a.status === "marked" || a.status === "submitted");

    const avgScore = completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((sum, a) => sum + (parseFloat(a.percentage?.toString() || "0")), 0) / completedAttempts.length)
      : 0;

    // Subject performance
    const subjectMap: Record<string, { total: number; count: number }> = {};
    for (const attempt of completedAttempts) {
      const test = await this.getTest(attempt.testId);
      if (test) {
        if (!subjectMap[test.subject]) subjectMap[test.subject] = { total: 0, count: 0 };
        subjectMap[test.subject].total += parseFloat(attempt.percentage?.toString() || "0");
        subjectMap[test.subject].count++;
      }
    }
    const subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      avgScore: Math.round(data.total / data.count),
      attempts: data.count
    }));

    // Recent activity (last 7 days)
    const recentActivity: { date: string; tests: number; avgScore: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayAttempts = completedAttempts.filter(a => 
        a.submittedAt && a.submittedAt.toISOString().split('T')[0] === dateStr
      );
      
      recentActivity.push({
        date: dateStr,
        tests: dayAttempts.length,
        avgScore: dayAttempts.length > 0 
          ? Math.round(dayAttempts.reduce((sum, a) => sum + parseFloat(a.percentage?.toString() || "0"), 0) / dayAttempts.length)
          : 0
      });
    }

    return {
      totalStudents: students.length,
      totalQuestions: questions.length,
      totalTests: tests.length,
      averageScore: avgScore,
      subjectPerformance,
      recentActivity
    };
  }

  // Blueprint methods
  async getBlueprint(id: string): Promise<Blueprint | undefined> {
    return this.blueprints.get(id);
  }

  async getBlueprintsByTenant(tenantId: string): Promise<Blueprint[]> {
    return Array.from(this.blueprints.values()).filter(b => b.tenantId === tenantId);
  }

  async createBlueprint(insertBlueprint: InsertBlueprint): Promise<Blueprint> {
    const id = randomUUID();
    const blueprint: Blueprint = {
      id,
      tenantId: insertBlueprint.tenantId,
      name: insertBlueprint.name,
      subject: insertBlueprint.subject,
      grade: insertBlueprint.grade,
      totalMarks: insertBlueprint.totalMarks,
      sections: (insertBlueprint.sections as any) || null,
      createdBy: insertBlueprint.createdBy || null,
      approvedBy: insertBlueprint.approvedBy || null,
      isApproved: insertBlueprint.isApproved || false,
      createdAt: new Date()
    };
    this.blueprints.set(id, blueprint);
    return blueprint;
  }

  async updateBlueprint(id: string, data: Partial<Blueprint>): Promise<Blueprint | undefined> {
    const blueprint = this.blueprints.get(id);
    if (!blueprint) return undefined;
    const updated = { ...blueprint, ...data };
    this.blueprints.set(id, updated);
    return updated;
  }

  async approveBlueprint(id: string, approvedBy: string): Promise<Blueprint | undefined> {
    return this.updateBlueprint(id, { isApproved: true, approvedBy });
  }

  // Activity log methods
  async logActivity(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = {
      id,
      tenantId: insertLog.tenantId,
      userId: insertLog.userId,
      userName: insertLog.userName || null,
      userRole: insertLog.userRole || null,
      action: insertLog.action,
      entityType: insertLog.entityType,
      entityId: insertLog.entityId || null,
      details: insertLog.details || null,
      previousState: insertLog.previousState || null,
      newState: insertLog.newState || null,
      comments: insertLog.comments || null,
      createdAt: new Date()
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getActivityLogs(tenantId: string, entityType?: string, entityId?: string): Promise<ActivityLog[]> {
    let logs = Array.from(this.activityLogs.values()).filter(l => l.tenantId === tenantId);
    if (entityType) logs = logs.filter(l => l.entityType === entityType);
    if (entityId) logs = logs.filter(l => l.entityId === entityId);
    return logs.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Question review methods
  async createQuestionReview(insertReview: InsertQuestionReview): Promise<QuestionReview> {
    const id = randomUUID();
    const review: QuestionReview = {
      id,
      questionId: insertReview.questionId,
      reviewerId: insertReview.reviewerId,
      status: (insertReview.status as "pending" | "approved" | "rejected") || "pending",
      comments: insertReview.comments || null,
      reviewedAt: new Date()
    };
    this.questionReviews.set(id, review);
    return review;
  }

  async getQuestionReviews(questionId: string): Promise<QuestionReview[]> {
    return Array.from(this.questionReviews.values()).filter(r => r.questionId === questionId);
  }

  async getPendingQuestions(tenantId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => 
      q.tenantId === tenantId && (q.status === "draft" || q.status === "pending")
    );
  }

  async getPendingQuestionsForReview(tenantId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => 
      q.tenantId === tenantId && q.status === "pending_approval"
    );
  }

  async approveQuestionByHOD(questionId: string, reviewerId: string, comments?: string): Promise<Question | undefined> {
    const question = this.questions.get(questionId);
    if (!question) return undefined;
    
    question.status = "approved";
    question.isVerified = true;
    this.questions.set(questionId, question);
    
    await this.createQuestionReview({
      questionId,
      reviewerId,
      status: "approved",
      comments: comments || null
    });
    
    return question;
  }

  async rejectQuestionByHOD(questionId: string, reviewerId: string, comments: string): Promise<Question | undefined> {
    const question = this.questions.get(questionId);
    if (!question) return undefined;
    
    question.status = "rejected";
    this.questions.set(questionId, question);
    
    await this.createQuestionReview({
      questionId,
      reviewerId,
      status: "rejected",
      comments
    });
    
    return question;
  }

  // Workflow management methods
  async updateTestWorkflow(testId: string, state: WorkflowState, userId: string, comments?: string): Promise<Test | undefined> {
    const test = this.tests.get(testId);
    if (!test) return undefined;
    
    const previousState = test.workflowState;
    test.workflowState = state;
    
    if (state === "hod_approved") {
      test.hodApprovedBy = userId;
      test.hodApprovedAt = new Date();
      test.hodComments = comments || null;
    } else if (state === "hod_rejected") {
      test.hodComments = comments || null;
    } else if (state === "principal_approved") {
      test.principalApprovedBy = userId;
      test.principalApprovedAt = new Date();
      test.principalComments = comments || null;
    } else if (state === "principal_rejected") {
      test.principalComments = comments || null;
    } else if (state === "sent_to_committee") {
      test.sentToCommitteeAt = new Date();
    }
    
    this.tests.set(testId, test);
    
    const user = await this.getUser(userId);
    await this.logActivity({
      tenantId: test.tenantId,
      userId,
      userName: user?.name,
      userRole: user?.role,
      action: "workflow_update",
      entityType: "test",
      entityId: testId,
      previousState: previousState || null,
      newState: state,
      comments: comments || null
    });
    
    return test;
  }

  async getTestsByWorkflowState(tenantId: string, states: WorkflowState[]): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(t => 
      t.tenantId === tenantId && states.includes(t.workflowState || "draft")
    );
  }

  async sendTestToCommittee(testId: string): Promise<Test | undefined> {
    const test = this.tests.get(testId);
    if (!test) return undefined;
    
    test.workflowState = "sent_to_committee";
    test.sentToCommitteeAt = new Date();
    this.tests.set(testId, test);
    return test;
  }

  async lockTest(testId: string): Promise<Test | undefined> {
    const test = this.tests.get(testId);
    if (!test) return undefined;
    
    test.workflowState = "locked";
    this.tests.set(testId, test);
    return test;
  }

  async markTestConfidential(testId: string): Promise<Test | undefined> {
    const test = this.tests.get(testId);
    if (!test) return undefined;
    
    test.isConfidential = true;
    this.tests.set(testId, test);
    return test;
  }

  async markPrintingReady(testId: string): Promise<Test | undefined> {
    const test = this.tests.get(testId);
    if (!test) return undefined;
    
    test.printingReady = true;
    this.tests.set(testId, test);
    return test;
  }

  async generateQuestionPaper(testId: string, format: "A4" | "Legal"): Promise<{ paperUrl: string; answerKeyUrl: string }> {
    const test = this.tests.get(testId);
    if (!test) throw new Error("Test not found");
    
    test.paperFormat = format;
    test.generatedPaperUrl = `/papers/${testId}/paper.pdf`;
    test.answerKeyUrl = `/papers/${testId}/answer-key.pdf`;
    this.tests.set(testId, test);
    
    return {
      paperUrl: test.generatedPaperUrl,
      answerKeyUrl: test.answerKeyUrl
    };
  }

  // ============ Additional Methods for New Pages ============

  async deleteBlueprint(id: string): Promise<boolean> {
    return this.blueprints.delete(id);
  }

  async updateChapterPortions(id: string, completedTopics: string[]): Promise<Chapter | undefined> {
    const chapter = this.chapters.get(id);
    if (!chapter) return undefined;
    (chapter as any).completedTopics = completedTopics;
    this.chapters.set(id, chapter);
    return chapter;
  }

  async getSubjectsByTenant(tenantId: string): Promise<{ id: string; name: string; classLevel: string }[]> {
    const subjects = new Set<string>();
    const subjectList: { id: string; name: string; classLevel: string }[] = [];
    
    for (const q of Array.from(this.questions.values())) {
      if (q.tenantId === tenantId && q.subject && !subjects.has(q.subject)) {
        subjects.add(q.subject);
        subjectList.push({
          id: `subject-${q.subject.toLowerCase().replace(/\s+/g, '-')}`,
          name: q.subject,
          classLevel: q.grade || "All"
        });
      }
    }
    
    if (subjectList.length === 0) {
      return [
        { id: "subject-mathematics", name: "Mathematics", classLevel: "All" },
        { id: "subject-science", name: "Science", classLevel: "All" },
        { id: "subject-english", name: "English", classLevel: "All" },
        { id: "subject-social-studies", name: "Social Studies", classLevel: "All" },
      ];
    }
    
    return subjectList;
  }

  async getMakeupTestsByTenant(tenantId: string): Promise<any[]> {
    return Array.from(this.makeupTests.values()).filter(mt => mt.tenantId === tenantId);
  }

  async createMakeupTest(data: any): Promise<any> {
    const id = randomUUID();
    const makeupTest = { id, ...data, createdAt: new Date() };
    this.makeupTests.set(id, makeupTest);
    return makeupTest;
  }

  async getSubmissionsByTenant(tenantId: string): Promise<any[]> {
    const submissions: any[] = [];
    for (const attempt of Array.from(this.attempts.values())) {
      if (attempt.status === "marked" || attempt.status === "submitted") {
        const test = this.tests.get(attempt.testId);
        const user = this.users.get(attempt.studentId);
        if (test?.tenantId === tenantId) {
          submissions.push({
            id: attempt.id,
            testId: attempt.testId,
            testName: test?.title || "Unknown Test",
            studentId: attempt.studentId,
            studentName: user?.name || "Unknown Student",
            submittedAt: (attempt as any).completedAt || new Date(),
            status: attempt.status,
            totalMarks: test?.totalMarks || 0,
            obtainedMarks: attempt.score || null,
            answers: []
          });
        }
      }
    }
    return submissions;
  }

  async updateSubmissionMarks(id: string, marks: Record<string, number>, feedback: Record<string, string>): Promise<any> {
    const attempt = this.attempts.get(id);
    if (!attempt) return undefined;
    (attempt as any).manualScores = marks;
    this.attempts.set(id, attempt);
    return attempt;
  }

  async completeSubmissionMarking(id: string): Promise<any> {
    const attempt = this.attempts.get(id);
    if (!attempt) return undefined;
    attempt.status = "marked";
    const scores = attempt.manualScores ? Object.values(attempt.manualScores) as number[] : [];
    attempt.score = scores.reduce((sum: number, s: number) => sum + s, 0);
    this.attempts.set(id, attempt);
    return attempt;
  }

  async getResultsByUser(tenantId: string, userId?: string): Promise<any[]> {
    const results: any[] = [];
    for (const attempt of Array.from(this.attempts.values())) {
      if (attempt.status === "marked" || attempt.status === "submitted") {
        if (userId && attempt.studentId !== userId) continue;
        
        const test = this.tests.get(attempt.testId);
        if (test?.tenantId === tenantId) {
          const percentage = test?.totalMarks ? Math.round(((attempt.score || 0) / test.totalMarks) * 100) : 0;
          results.push({
            id: attempt.id,
            testId: attempt.testId,
            testName: test?.title || "Unknown Test",
            subject: test?.subject || "General",
            classLevel: test?.grade || "10",
            examDate: (attempt as any).completedAt || new Date(),
            totalMarks: test?.totalMarks || 0,
            obtainedMarks: attempt.score || 0,
            percentage,
            grade: percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : "D",
            rank: null,
            totalStudents: 0,
            status: attempt.status,
            answers: []
          });
        }
      }
    }
    return results;
  }

  async getChildrenByParent(parentId: string): Promise<any[]> {
    const children: any[] = [];
    for (const user of Array.from(this.users.values())) {
      if (user.role === "student" && (user as any).parentId === parentId) {
        children.push({
          id: user.id,
          name: user.name,
          classLevel: (user as any).classLevel || "10",
          section: (user as any).section || "A",
          rollNumber: (user as any).rollNumber || "N/A"
        });
      }
    }
    return children;
  }

  async getResultsByParent(parentId: string): Promise<any[]> {
    const children = await this.getChildrenByParent(parentId);
    const childIds = children.map(c => c.id);
    const allResults: any[] = [];
    
    for (const attempt of Array.from(this.attempts.values())) {
      if (childIds.includes(attempt.studentId) && (attempt.status === "marked" || attempt.status === "submitted")) {
        const test = this.tests.get(attempt.testId);
        if (test) {
          const percentage = test?.totalMarks ? Math.round(((attempt.score || 0) / test.totalMarks) * 100) : 0;
          allResults.push({
            testId: attempt.testId,
            testName: test?.title || "Unknown Test",
            subject: test?.subject || "General",
            examDate: (attempt as any).completedAt || new Date(),
            totalMarks: test?.totalMarks || 0,
            obtainedMarks: attempt.score || 0,
            percentage,
            grade: percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : "D",
            rank: null
          });
        }
      }
    }
    return allResults;
  }

  async getProgressByParent(parentId: string): Promise<any[]> {
    const results = await this.getResultsByParent(parentId);
    const subjectProgress: Record<string, { scores: number[]; testsCompleted: number }> = {};
    
    for (const result of results) {
      if (!subjectProgress[result.subject]) {
        subjectProgress[result.subject] = { scores: [], testsCompleted: 0 };
      }
      subjectProgress[result.subject].scores.push(result.percentage);
      subjectProgress[result.subject].testsCompleted++;
    }
    
    return Object.entries(subjectProgress).map(([subject, data]) => ({
      subject,
      averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      testsCompleted: data.testsCompleted,
      improvement: data.scores.length >= 2 ? data.scores[data.scores.length - 1] - data.scores[0] : 0
    }));
  }

  async getNotificationsByParent(parentId: string): Promise<any[]> {
    return Array.from(this.notifications.values()).filter(n => n.parentId === parentId);
  }

  async getRiskAlertsByTenant(tenantId: string): Promise<any[]> {
    return Array.from(this.riskAlerts.values()).filter(ra => ra.tenantId === tenantId);
  }

  async acknowledgeRiskAlert(id: string): Promise<any> {
    const alert = this.riskAlerts.get(id);
    if (!alert) return undefined;
    alert.status = "resolved";
    alert.acknowledgedAt = new Date();
    this.riskAlerts.set(id, alert);
    return alert;
  }

  async getAllAttempts(tenantId: string): Promise<Attempt[]> {
    return Array.from(this.attempts.values()).filter(a => {
      const test = this.tests.get(a.testId);
      return test && test.tenantId === tenantId;
    });
  }

  async createRiskAlert(alert: any): Promise<any> {
    this.riskAlerts.set(alert.id, alert);
    return alert;
  }

  async createExamAuditLog(log: InsertExamAuditLog): Promise<ExamAuditLog> {
    const id = randomUUID();
    const auditLog: ExamAuditLog = {
      id,
      examId: log.examId,
      tenantId: log.tenantId,
      fromState: log.fromState || null,
      toState: log.toState,
      actorId: log.actorId,
      actorRole: log.actorRole,
      timestamp: new Date(),
      comments: log.comments || null,
    };
    this.examAuditLogs.set(id, auditLog);
    return auditLog;
  }

  async getExamAuditLogs(examId: string): Promise<ExamAuditLog[]> {
    return Array.from(this.examAuditLogs.values())
      .filter(log => log.examId === examId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getExamAuditLogsByTenant(tenantId: string): Promise<ExamAuditLog[]> {
    return Array.from(this.examAuditLogs.values())
      .filter(log => log.tenantId === tenantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async hasCompletedAttempt(testId: string, studentId: string): Promise<boolean> {
    return Array.from(this.attempts.values()).some(
      a => a.testId === testId && a.studentId === studentId && 
        (a.status === "submitted" || a.status === "marked")
    );
  }

  async getStudentResultsWithDetails(studentId: string): Promise<{
    attemptId: string;
    testId: string;
    testTitle: string;
    testType: string;
    subject: string;
    chapter: string | null;
    score: number | null;
    totalMarks: number | null;
    percentage: string | null;
    status: string;
    submittedAt: Date | null;
  }[]> {
    const studentAttempts = Array.from(this.attempts.values())
      .filter(a => a.studentId === studentId && (a.status === "submitted" || a.status === "marked"));
    
    return studentAttempts.map(a => {
      const test = this.tests.get(a.testId);
      const chapter = test?.chapterId ? this.chapters.get(test.chapterId) : null;
      return {
        attemptId: a.id,
        testId: a.testId,
        testTitle: test?.title || "Unknown Test",
        testType: test?.type || "mock",
        subject: test?.subject || "Unknown",
        chapter: chapter?.name || null,
        score: a.score,
        totalMarks: a.totalMarks,
        percentage: a.percentage,
        status: a.status || "submitted",
        submittedAt: a.submittedAt,
      };
    }).sort((a, b) => {
      if (!a.submittedAt || !b.submittedAt) return 0;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }

  async getAvailableStudentTests(tenantId: string, studentId: string): Promise<(Test & { hasCompletedAttempt: boolean; hasActiveAttempt: boolean })[]> {
    const activeTests = Array.from(this.tests.values()).filter(
      t => t.tenantId === tenantId && t.isActive === true
    );
    
    const studentAttempts = Array.from(this.attempts.values()).filter(
      a => a.studentId === studentId
    );
    
    return activeTests.map(test => ({
      ...test,
      hasCompletedAttempt: studentAttempts.some(
        a => a.testId === test.id && (a.status === "submitted" || a.status === "marked")
      ),
      hasActiveAttempt: studentAttempts.some(
        a => a.testId === test.id && a.status === "in_progress"
      ),
    }));
  }

  async createStudentNotification(notification: InsertStudentNotification): Promise<StudentNotification> {
    const id = randomUUID();
    const newNotification: StudentNotification = {
      id,
      tenantId: notification.tenantId,
      studentId: notification.studentId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      testId: notification.testId || null,
      attemptId: notification.attemptId || null,
      isRead: false,
      createdAt: new Date(),
    };
    this.studentNotifications.set(id, newNotification);
    return newNotification;
  }

  async getStudentNotifications(studentId: string): Promise<StudentNotification[]> {
    return Array.from(this.studentNotifications.values())
      .filter(n => n.studentId === studentId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async markNotificationRead(notificationId: string): Promise<StudentNotification | undefined> {
    const notification = this.studentNotifications.get(notificationId);
    if (!notification) return undefined;
    const updated = { ...notification, isRead: true };
    this.studentNotifications.set(notificationId, updated);
    return updated;
  }

  async markAllNotificationsRead(studentId: string): Promise<void> {
    this.studentNotifications.forEach((notification, id) => {
      if (notification.studentId === studentId) {
        this.studentNotifications.set(id, { ...notification, isRead: true });
      }
    });
  }

  // Principal Dashboard Analytics (read-only)
  async getPrincipalSchoolSnapshot(tenantId: string): Promise<{
    totalStudents: number;
    testsThisMonth: number;
    averageScore: number;
    atRiskCount: number;
  }> {
    const students = Array.from(this.users.values()).filter(
      u => u.tenantId === tenantId && u.role === "student"
    );
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const completedAttempts = Array.from(this.attempts.values()).filter(
      a => a.tenantId === tenantId && 
           (a.status === "submitted" || a.status === "marked") &&
           a.submittedAt && new Date(a.submittedAt) >= thirtyDaysAgo
    );
    
    const uniqueTestsThisMonth = new Set(completedAttempts.map(a => a.testId)).size;
    const avgScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, a) => sum + (parseFloat(String(a.percentage || 0))), 0) / completedAttempts.length
      : 0;
    
    // At-risk: students with 2+ attempts below 40%
    const studentLowScores = new Map<string, number>();
    completedAttempts.forEach(a => {
      if (parseFloat(String(a.percentage || 0)) < 40) {
        studentLowScores.set(a.studentId, (studentLowScores.get(a.studentId) || 0) + 1);
      }
    });
    const atRiskCount = Array.from(studentLowScores.values()).filter(count => count >= 2).length;
    
    return {
      totalStudents: students.length,
      testsThisMonth: uniqueTestsThisMonth,
      averageScore: Math.round(avgScore * 10) / 10,
      atRiskCount,
    };
  }

  async getPrincipalGradePerformance(tenantId: string): Promise<{
    grade: string;
    averageScore: number;
    passPercentage: number;
    totalAttempts: number;
    trend: 'up' | 'down' | 'stable';
  }[]> {
    const students = Array.from(this.users.values()).filter(
      u => u.tenantId === tenantId && u.role === "student"
    );
    const studentGrades = new Map(students.map(s => [s.id, s.grade || "Unknown"]));
    
    const completedAttempts = Array.from(this.attempts.values()).filter(
      a => a.tenantId === tenantId && (a.status === "submitted" || a.status === "marked")
    );
    
    const gradeStats = new Map<string, { total: number; passed: number; sum: number }>();
    completedAttempts.forEach(a => {
      const grade = studentGrades.get(a.studentId) || "Unknown";
      const stats = gradeStats.get(grade) || { total: 0, passed: 0, sum: 0 };
      const pct = parseFloat(String(a.percentage || 0));
      stats.total++;
      stats.sum += pct;
      if (pct >= 40) stats.passed++;
      gradeStats.set(grade, stats);
    });
    
    return Array.from(gradeStats.entries()).map(([grade, stats]) => ({
      grade,
      averageScore: Math.round((stats.sum / stats.total) * 10) / 10,
      passPercentage: Math.round((stats.passed / stats.total) * 100),
      totalAttempts: stats.total,
      trend: 'stable' as const,
    })).sort((a, b) => a.grade.localeCompare(b.grade));
  }

  async getPrincipalSubjectHealth(tenantId: string, gradeFilter?: string): Promise<{
    subject: string;
    grade: string;
    averagePercentage: number;
    totalAttempts: number;
    isWeak: boolean;
  }[]> {
    const students = Array.from(this.users.values()).filter(
      u => u.tenantId === tenantId && u.role === "student"
    );
    const studentGrades = new Map(students.map(s => [s.id, s.grade || "Unknown"]));
    
    const completedAttempts = Array.from(this.attempts.values()).filter(
      a => a.tenantId === tenantId && (a.status === "submitted" || a.status === "marked")
    );
    
    const subjectStats = new Map<string, { total: number; sum: number }>();
    completedAttempts.forEach(a => {
      const test = this.tests.get(a.testId);
      if (!test) return;
      const grade = studentGrades.get(a.studentId) || "Unknown";
      if (gradeFilter && grade !== gradeFilter) return;
      const key = `${test.subject}|${grade}`;
      const stats = subjectStats.get(key) || { total: 0, sum: 0 };
      stats.total++;
      stats.sum += parseFloat(String(a.percentage || 0));
      subjectStats.set(key, stats);
    });
    
    return Array.from(subjectStats.entries()).map(([key, stats]) => {
      const [subject, grade] = key.split("|");
      const avgPct = stats.sum / stats.total;
      return {
        subject,
        grade,
        averagePercentage: Math.round(avgPct * 10) / 10,
        totalAttempts: stats.total,
        isWeak: avgPct < 50,
      };
    }).sort((a, b) => a.averagePercentage - b.averagePercentage);
  }

  async getPrincipalAtRiskStudents(tenantId: string): Promise<{
    studentId: string;
    studentName: string;
    grade: string;
    lowScoreCount: number;
    averagePercentage: number;
    trend: 'declining' | 'stable' | 'improving';
  }[]> {
    const students = Array.from(this.users.values()).filter(
      u => u.tenantId === tenantId && u.role === "student"
    );
    const studentMap = new Map(students.map(s => [s.id, s]));
    
    const completedAttempts = Array.from(this.attempts.values()).filter(
      a => a.tenantId === tenantId && (a.status === "submitted" || a.status === "marked")
    );
    
    const studentStats = new Map<string, { lowCount: number; sum: number; total: number; scores: number[] }>();
    completedAttempts.forEach(a => {
      const stats = studentStats.get(a.studentId) || { lowCount: 0, sum: 0, total: 0, scores: [] };
      const pct = parseFloat(String(a.percentage || 0));
      stats.total++;
      stats.sum += pct;
      stats.scores.push(pct);
      if (pct < 40) stats.lowCount++;
      studentStats.set(a.studentId, stats);
    });
    
    return Array.from(studentStats.entries())
      .filter(([_, stats]) => stats.lowCount >= 2)
      .map(([studentId, stats]) => {
        const student = studentMap.get(studentId);
        // Simple trend: compare first half avg vs second half avg
        const mid = Math.floor(stats.scores.length / 2);
        const firstHalf = stats.scores.slice(0, mid);
        const secondHalf = stats.scores.slice(mid);
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
        let trend: 'declining' | 'stable' | 'improving' = 'stable';
        if (secondAvg < firstAvg - 5) trend = 'declining';
        else if (secondAvg > firstAvg + 5) trend = 'improving';
        
        return {
          studentId,
          studentName: student?.name || "Unknown",
          grade: student?.grade || "Unknown",
          lowScoreCount: stats.lowCount,
          averagePercentage: Math.round((stats.sum / stats.total) * 10) / 10,
          trend,
        };
      })
      .sort((a, b) => a.averagePercentage - b.averagePercentage);
  }

  async getPrincipalRiskAlerts(tenantId: string): Promise<{
    type: 'tab_switch' | 'absence' | 'sudden_drop';
    studentId: string;
    studentName: string;
    grade: string;
    details: string;
    count: number;
    createdAt: Date | null;
  }[]> {
    const students = Array.from(this.users.values()).filter(
      u => u.tenantId === tenantId && u.role === "student"
    );
    const studentMap = new Map(students.map(s => [s.id, s]));
    const alerts: {
      type: 'tab_switch' | 'absence' | 'sudden_drop';
      studentId: string;
      studentName: string;
      grade: string;
      details: string;
      count: number;
      createdAt: Date | null;
    }[] = [];
    
    // Tab switch alerts from activity logs
    const tabSwitchLogs = Array.from(this.activityLogs.values()).filter(
      log => log.tenantId === tenantId && log.action === "tab_switch_detected"
    );
    const tabSwitchByStudent = new Map<string, { count: number; latest: Date | null }>();
    tabSwitchLogs.forEach(log => {
      const studentId = log.userId;
      const current = tabSwitchByStudent.get(studentId) || { count: 0, latest: null };
      current.count++;
      if (log.createdAt && (!current.latest || new Date(log.createdAt) > current.latest)) {
        current.latest = new Date(log.createdAt);
      }
      tabSwitchByStudent.set(studentId, current);
    });
    tabSwitchByStudent.forEach((data, studentId) => {
      if (data.count >= 3) {
        const student = studentMap.get(studentId);
        alerts.push({
          type: 'tab_switch',
          studentId,
          studentName: student?.name || "Unknown",
          grade: student?.grade || "Unknown",
          details: `${data.count} tab switches detected during exams`,
          count: data.count,
          createdAt: data.latest,
        });
      }
    });
    
    // Absence alerts
    const absences = Array.from(this.attempts.values()).filter(
      a => a.tenantId === tenantId && a.status === "absent"
    );
    const absenceByStudent = new Map<string, number>();
    absences.forEach(a => {
      absenceByStudent.set(a.studentId, (absenceByStudent.get(a.studentId) || 0) + 1);
    });
    absenceByStudent.forEach((count, studentId) => {
      if (count >= 2) {
        const student = studentMap.get(studentId);
        alerts.push({
          type: 'absence',
          studentId,
          studentName: student?.name || "Unknown",
          grade: student?.grade || "Unknown",
          details: `${count} exam absences recorded`,
          count,
          createdAt: null,
        });
      }
    });
    
    return alerts.sort((a, b) => b.count - a.count);
  }

  // Academic Years (stub implementations for MemStorage)
  private academicYears: Map<string, any> = new Map();
  private gradeConfigs: Map<string, any> = new Map();

  async getAcademicYear(id: string): Promise<any> {
    return this.academicYears.get(id);
  }

  async getAcademicYearsByTenant(tenantId: string): Promise<any[]> {
    return Array.from(this.academicYears.values()).filter(y => y.tenantId === tenantId);
  }

  async getActiveAcademicYear(tenantId: string): Promise<any> {
    return Array.from(this.academicYears.values()).find(y => y.tenantId === tenantId && y.isActive);
  }

  async createAcademicYear(year: any): Promise<any> {
    const id = randomUUID();
    const created = { ...year, id, createdAt: new Date() };
    this.academicYears.set(id, created);
    return created;
  }

  async updateAcademicYear(id: string, data: any): Promise<any> {
    const year = this.academicYears.get(id);
    if (!year) return undefined;
    const updated = { ...year, ...data };
    this.academicYears.set(id, updated);
    return updated;
  }

  async activateAcademicYear(tenantId: string, yearId: string): Promise<any> {
    // Deactivate all others
    this.academicYears.forEach((y, id) => {
      if (y.tenantId === tenantId) {
        this.academicYears.set(id, { ...y, isActive: false });
      }
    });
    const year = this.academicYears.get(yearId);
    if (year) {
      const activated = { ...year, isActive: true };
      this.academicYears.set(yearId, activated);
      return activated;
    }
    return undefined;
  }

  async lockAcademicYear(id: string, lockedBy: string): Promise<any> {
    const year = this.academicYears.get(id);
    if (!year) return undefined;
    const locked = { ...year, isLocked: true, lockedAt: new Date(), lockedBy };
    this.academicYears.set(id, locked);
    return locked;
  }

  // Grade Configurations
  async getGradeConfig(id: string): Promise<any> {
    return this.gradeConfigs.get(id);
  }

  async getGradeConfigsByTenant(tenantId: string, academicYearId?: string): Promise<any[]> {
    return Array.from(this.gradeConfigs.values())
      .filter(g => g.tenantId === tenantId && (!academicYearId || g.academicYearId === academicYearId));
  }

  async createGradeConfig(config: any): Promise<any> {
    const id = randomUUID();
    const created = { ...config, id, createdAt: new Date() };
    this.gradeConfigs.set(id, created);
    return created;
  }

  async createGradeConfigsBulk(configs: any[]): Promise<any[]> {
    return Promise.all(configs.map(c => this.createGradeConfig(c)));
  }

  async updateGradeConfig(id: string, data: any): Promise<any> {
    const config = this.gradeConfigs.get(id);
    if (!config) return undefined;
    const updated = { ...config, ...data };
    this.gradeConfigs.set(id, updated);
    return updated;
  }

  // User Code Generation
  private userCodeCounter = 0;
  async generateUserCode(tenantId: string): Promise<string> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error("Tenant not found");
    this.userCodeCounter++;
    const year = new Date().getFullYear();
    const paddedNumber = String(this.userCodeCounter).padStart(6, '0');
    return `${tenant.code}${year}U${paddedNumber}`;
  }

  // Soft Delete Usage Checks
  async isQuestionInUse(questionId: string): Promise<boolean> {
    for (const test of this.tests.values()) {
      if (test.questionIds && test.questionIds.includes(questionId)) return true;
    }
    return false;
  }

  async isBlueprintInUse(blueprintId: string): Promise<boolean> {
    for (const test of this.tests.values()) {
      if (test.blueprintId === blueprintId) return true;
    }
    return false;
  }

  async isUserInUse(userId: string): Promise<boolean> {
    for (const q of this.questions.values()) {
      if (q.createdBy === userId) return true;
    }
    for (const a of this.attempts.values()) {
      if (a.studentId === userId) return true;
    }
    return false;
  }

  async isUploadInUse(uploadId: string): Promise<boolean> {
    for (const q of this.questions.values()) {
      if (q.uploadId === uploadId) return true;
    }
    return false;
  }

  // Soft Delete Operations
  async softDeleteQuestion(id: string, deletedBy: string): Promise<boolean> {
    const q = this.questions.get(id);
    if (!q) return false;
    this.questions.set(id, { ...q, isDeleted: true, deletedAt: new Date(), deletedBy });
    return true;
  }

  async softDeleteBlueprint(id: string, deletedBy: string): Promise<boolean> {
    const b = this.blueprints.get(id);
    if (!b) return false;
    this.blueprints.set(id, { ...b, isDeleted: true, deletedAt: new Date(), deletedBy });
    return true;
  }

  async softDeleteUser(id: string, deletedBy: string): Promise<boolean> {
    const u = this.users.get(id);
    if (!u) return false;
    this.users.set(id, { ...u, isDeleted: true, deletedAt: new Date(), deletedBy, active: false });
    return true;
  }

  async softDeleteUpload(id: string, deletedBy: string): Promise<boolean> {
    const up = this.uploads.get(id);
    if (!up) return false;
    this.uploads.set(id, { ...up, isDeleted: true, deletedAt: new Date(), deletedBy });
    return true;
  }

  // =====================================================
  // PHASE 2+3: SUPER ADMIN GOVERNANCE (Stub Implementations)
  // =====================================================

  async getExamFramework(id: string): Promise<ExamFramework | undefined> {
    return undefined;
  }

  async getExamFrameworksByTenant(tenantId: string, academicYearId?: string, gradeGroup?: GradeGroup): Promise<ExamFramework[]> {
    return [];
  }

  async createExamFramework(framework: InsertExamFramework): Promise<ExamFramework> {
    throw new Error("MemStorage: createExamFramework not implemented");
  }

  async updateExamFramework(id: string, data: Partial<ExamFramework>): Promise<ExamFramework | undefined> {
    return undefined;
  }

  async deleteExamFramework(id: string): Promise<boolean> {
    return false;
  }

  async getBlueprintPolicy(id: string): Promise<BlueprintPolicy | undefined> {
    return undefined;
  }

  async getBlueprintPolicyByTenant(tenantId: string, academicYearId?: string): Promise<BlueprintPolicy | undefined> {
    return undefined;
  }

  async createBlueprintPolicy(policy: InsertBlueprintPolicy): Promise<BlueprintPolicy> {
    throw new Error("MemStorage: createBlueprintPolicy not implemented");
  }

  async updateBlueprintPolicy(id: string, data: Partial<BlueprintPolicy>): Promise<BlueprintPolicy | undefined> {
    return undefined;
  }

  async getReferenceItem(id: string): Promise<ReferenceLibrary | undefined> {
    return undefined;
  }

  async getReferenceLibrary(tenantId: string, grade?: string, subject?: string): Promise<ReferenceLibrary[]> {
    return [];
  }

  async getStudentReferenceMaterials(tenantId: string, grade: string, subject?: string): Promise<ReferenceLibrary[]> {
    return [];
  }

  async createReferenceItem(item: InsertReferenceLibrary): Promise<ReferenceLibrary> {
    throw new Error("MemStorage: createReferenceItem not implemented");
  }

  async updateReferenceItem(id: string, data: Partial<ReferenceLibrary>): Promise<ReferenceLibrary | undefined> {
    return undefined;
  }

  async softDeleteReferenceItem(id: string, deletedBy: string): Promise<boolean> {
    return false;
  }

  async restoreReferenceItem(id: string): Promise<ReferenceLibrary | undefined> {
    return undefined;
  }

  async createPaperGenerationAudit(audit: InsertPaperGenerationAudit): Promise<PaperGenerationAudit> {
    throw new Error("MemStorage: createPaperGenerationAudit not implemented");
  }

  async getPaperGenerationAudit(testId: string): Promise<PaperGenerationAudit[]> {
    return [];
  }

  async getStorageUsage(tenantId: string): Promise<StorageUsage | undefined> {
    return undefined;
  }

  async updateStorageUsage(tenantId: string, data: Partial<StorageUsage>): Promise<StorageUsage | undefined> {
    return undefined;
  }

  async recalculateStorageUsage(tenantId: string): Promise<StorageUsage> {
    throw new Error("MemStorage: recalculateStorageUsage not implemented");
  }
}

import { pgStorage } from "./pg-storage";

function createStorage(): IStorage {
  const engine = process.env.STORAGE_ENGINE || "postgres";
  if (engine === "memory") {
    console.log("[storage] Using in-memory storage (MemStorage)");
    return new MemStorage();
  }
  console.log("[storage] Using PostgreSQL storage (PgStorage)");
  return pgStorage;
}

export const storage = createStorage();
