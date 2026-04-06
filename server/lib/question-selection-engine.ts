/**
 * ============================================================================
 * PRASHNAKOSH - Unified Question Selection Engine
 * ============================================================================
 * 
 * Single source of truth for question selection across:
 * - Online tests (student mode)
 * - Offline paper generation (PDF/Word)
 * - Multi-set generation (Set A/B/C)
 * 
 * Core Principles:
 * 1. Same filtering logic for all modes
 * 2. Only approved questions are used
 * 3. Duplicate prevention within and across sets
 * 4. Fair difficulty distribution
 * 5. Chapter coverage balance
 */

import crypto from 'crypto';
import type { Question, Blueprint, BlueprintSection, DifficultyLevel } from '@shared/schema';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type GenerationMode = 'online' | 'offline';

export interface SelectionOptions {
  mode: GenerationMode;
  
  // Common options
  tenantId: string;
  subject: string;
  grade: string;
  
  // Multi-set options
  setCount?: number;  // 1 = single set, 2+ = multiple sets (A/B/C)
  
  // Online-specific
  shuffleQuestions?: boolean;  // Default: true for online
  shuffleOptions?: boolean;    // Default: true for online (NEW)
  
  // Offline-specific
  fixedOrder?: boolean;        // Default: true for offline
  includeSectionHeaders?: boolean;
  
  // Question filtering
  excludeQuestionIds?: string[];  // Questions to exclude (already used)
  onlyApproved?: boolean;         // Default: true
  academicYear?: string;          // Filter by year if needed
}

export interface SelectionResult {
  success: boolean;
  sets: QuestionSet[];
  warnings: string[];
  stats: SelectionStats;
}

export interface QuestionSet {
  setName: string;  // "Set A", "Set B", etc. or "Main" for single set
  questions: SelectedQuestion[];
  totalMarks: number;
  sectionBreakdown: SectionBreakdown[];
}

export interface SelectedQuestion extends Question {
  sectionName: string;
  questionNumber: number;
  shuffledOptions?: string[];      // For online mode - shuffled option order
  correctAnswerIndex?: number;     // Index in shuffled options
}

export interface SectionBreakdown {
  name: string;
  questionType: string;
  requested: number;
  selected: number;
  marks: number;
  difficulty?: string;
}

export interface SelectionStats {
  totalQuestionsRequested: number;
  totalQuestionsSelected: number;
  difficultyDistribution: Record<string, number>;
  chapterDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  shortfalls: { section: string; shortage: number }[];
}

// ============================================================================
// DUPLICATE DETECTION UTILITIES
// ============================================================================

/**
 * Normalize question content for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove punctuation variations
 * - Standardize numbers
 */
export function normalizeContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s*([.,;:?!])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate MD5 hash of normalized content for exact duplicate detection
 */
export function generateContentHash(content: string): string {
  const normalized = normalizeContent(content);
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Calculate similarity between two strings (Jaccard similarity)
 * Returns value between 0 and 1
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeContent(str1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeContent(str2).split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

export interface DuplicateCheckResult {
  isExactDuplicate: boolean;
  exactMatch?: Question;
  similarQuestions: { question: Question; similarity: number }[];
  recommendation: 'block' | 'warn' | 'allow';
}

/**
 * Check for duplicate questions in the pool
 */
export function checkForDuplicates(
  newQuestion: { content: string; options?: string[] },
  existingQuestions: Question[],
  similarityThreshold: number = 0.85
): DuplicateCheckResult {
  const newHash = generateContentHash(newQuestion.content);
  const newNormalized = normalizeContent(newQuestion.content);
  
  // Check for exact duplicate by hash
  const exactMatch = existingQuestions.find(q => 
    q.contentHash === newHash || 
    normalizeContent(q.content) === newNormalized
  );
  
  if (exactMatch) {
    return {
      isExactDuplicate: true,
      exactMatch,
      similarQuestions: [],
      recommendation: 'block'
    };
  }
  
  // Check for similar questions
  const similarQuestions = existingQuestions
    .map(q => ({
      question: q,
      similarity: calculateSimilarity(newQuestion.content, q.content)
    }))
    .filter(({ similarity }) => similarity >= similarityThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);  // Top 5 similar
  
  return {
    isExactDuplicate: false,
    similarQuestions,
    recommendation: similarQuestions.length > 0 ? 'warn' : 'allow'
  };
}

// ============================================================================
// QUESTION SELECTION ENGINE
// ============================================================================

export class QuestionSelectionEngine {
  private questionPool: Question[] = [];
  private usedQuestionIds: Set<string> = new Set();
  
  constructor(private options: SelectionOptions) {}
  
  /**
   * Initialize engine with available question pool
   */
  setQuestionPool(questions: Question[]): void {
    // Filter to only approved questions if specified
    this.questionPool = this.options.onlyApproved !== false
      ? questions.filter(q => q.status === 'approved' && !q.isDeleted)
      : questions.filter(q => !q.isDeleted);
    
    // Apply year filter if specified
    if (this.options.academicYear) {
      this.questionPool = this.questionPool.filter(q => 
        !q.academicYear || q.academicYear === this.options.academicYear
      );
    }
    
    // Exclude specified questions
    if (this.options.excludeQuestionIds?.length) {
      const excludeSet = new Set(this.options.excludeQuestionIds);
      this.questionPool = this.questionPool.filter(q => !excludeSet.has(q.id));
    }
  }
  
  /**
   * Main selection method - generates one or more question sets based on blueprint
   */
  selectForBlueprint(blueprint: Blueprint): SelectionResult {
    const warnings: string[] = [];
    const sets: QuestionSet[] = [];
    const setCount = this.options.setCount || 1;
    
    // Reset used questions for fresh selection
    this.usedQuestionIds = new Set();
    
    // Generate each set
    for (let setIndex = 0; setIndex < setCount; setIndex++) {
      const setName = setCount === 1 ? 'Main' : `Set ${String.fromCharCode(65 + setIndex)}`;
      const setResult = this.selectSingleSet(blueprint, setName, warnings);
      sets.push(setResult);
    }
    
    // Calculate stats
    const stats = this.calculateStats(sets, blueprint);
    
    return {
      success: stats.shortfalls.length === 0,
      sets,
      warnings,
      stats
    };
  }
  
  /**
   * Select questions for a single set
   */
  private selectSingleSet(blueprint: Blueprint, setName: string, warnings: string[]): QuestionSet {
    const selectedQuestions: SelectedQuestion[] = [];
    const sectionBreakdown: SectionBreakdown[] = [];
    let questionNumber = 1;
    
    const sections = (blueprint.sections || []) as BlueprintSection[];
    
    for (const section of sections) {
      const sectionQuestions = this.selectForSection(section, warnings);
      
      // Track breakdown
      sectionBreakdown.push({
        name: section.name,
        questionType: section.questionType,
        requested: section.questionCount,
        selected: sectionQuestions.length,
        marks: section.marks,
        difficulty: section.difficulty
      });
      
      // Add section info to each question
      for (const q of sectionQuestions) {
        const selectedQ: SelectedQuestion = {
          ...q,
          sectionName: section.name,
          questionNumber: questionNumber++
        };
        
        // Apply option shuffling for online mode
        if (this.options.mode === 'online' && this.options.shuffleOptions !== false) {
          if (q.options && q.options.length > 0 && q.correctAnswer) {
            const shuffleResult = this.shuffleOptions(q.options, q.correctAnswer);
            selectedQ.shuffledOptions = shuffleResult.shuffledOptions;
            selectedQ.correctAnswerIndex = shuffleResult.correctIndex;
          }
        }
        
        selectedQuestions.push(selectedQ);
        this.usedQuestionIds.add(q.id);  // Mark as used for multi-set
      }
    }
    
    // Shuffle questions for online mode (within sections or globally)
    let finalQuestions = selectedQuestions;
    if (this.options.mode === 'online' && this.options.shuffleQuestions !== false) {
      // Shuffle within each section to maintain section grouping
      finalQuestions = this.shuffleWithinSections(selectedQuestions);
    }
    
    const totalMarks = finalQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    
    return {
      setName,
      questions: finalQuestions,
      totalMarks,
      sectionBreakdown
    };
  }
  
  /**
   * Select questions for a specific section
   */
  private selectForSection(section: BlueprintSection, warnings: string[]): Question[] {
    // Build filter criteria
    const pool = this.questionPool.filter(q => {
      // Must not be already used (for multi-set)
      if (this.usedQuestionIds.has(q.id)) return false;
      
      // Subject and grade match (if specified in options)
      if (this.options.subject && q.subject !== this.options.subject) return false;
      if (this.options.grade && q.grade !== this.options.grade) return false;
      
      // Question type match
      if (section.questionType && q.type !== section.questionType) return false;
      
      // Marks match (if specified)
      if (section.marks && q.marks !== section.marks) return false;
      
      // Difficulty match (if specified)
      if (section.difficulty && q.difficulty !== section.difficulty) return false;
      
      // Chapter filter (if specified)
      if (section.chapters && section.chapters.length > 0) {
        if (!section.chapters.includes(q.chapter)) return false;
      }
      
      return true;
    });
    
    // Check if we have enough questions
    if (pool.length < section.questionCount) {
      warnings.push(
        `Section "${section.name}": Requested ${section.questionCount} questions, ` +
        `only ${pool.length} available (${section.questionType}, ${section.difficulty || 'any difficulty'})`
      );
    }
    
    // Select questions with balanced difficulty distribution
    const selected = this.selectWithBalance(pool, section.questionCount, section.difficulty);
    
    return selected;
  }
  
  /**
   * Select questions with balanced distribution
   * If specific difficulty not required, try to balance easy/medium/hard
   */
  private selectWithBalance(pool: Question[], count: number, requiredDifficulty?: string): Question[] {
    if (pool.length <= count) {
      return [...pool];  // Return all if not enough
    }
    
    if (requiredDifficulty) {
      // If specific difficulty required, just shuffle and pick
      return this.shuffleArray([...pool]).slice(0, count);
    }
    
    // Balance across difficulties
    const byDifficulty: Record<string, Question[]> = {
      easy: [],
      medium: [],
      hard: []
    };
    
    for (const q of pool) {
      const diff = q.difficulty || 'medium';
      if (byDifficulty[diff]) {
        byDifficulty[diff].push(q);
      } else {
        byDifficulty['medium'].push(q);
      }
    }
    
    // Target distribution: 30% easy, 50% medium, 20% hard
    const targets = {
      easy: Math.round(count * 0.3),
      medium: Math.round(count * 0.5),
      hard: count - Math.round(count * 0.3) - Math.round(count * 0.5)
    };
    
    const selected: Question[] = [];
    
    // First pass: fill with target distribution
    for (const [diff, target] of Object.entries(targets)) {
      const available = this.shuffleArray([...byDifficulty[diff]]);
      const toTake = Math.min(target, available.length);
      selected.push(...available.slice(0, toTake));
    }
    
    // Second pass: fill remaining from any difficulty
    if (selected.length < count) {
      const remaining = pool.filter(q => !selected.includes(q));
      const shuffled = this.shuffleArray(remaining);
      selected.push(...shuffled.slice(0, count - selected.length));
    }
    
    return selected;
  }
  
  /**
   * Shuffle options and track correct answer position
   */
  private shuffleOptions(options: string[], correctAnswer: string): {
    shuffledOptions: string[];
    correctIndex: number;
  } {
    const indexed = options.map((opt, idx) => ({ opt, originalIdx: idx }));
    const shuffled = this.shuffleArray([...indexed]);
    
    // Find correct answer in shuffled array
    // correctAnswer could be "A", "B", etc. or the actual option text
    let correctIndex = -1;
    
    if (['A', 'B', 'C', 'D', 'E', 'F'].includes(correctAnswer.toUpperCase())) {
      // It's a letter reference
      const originalIdx = correctAnswer.toUpperCase().charCodeAt(0) - 65;
      correctIndex = shuffled.findIndex(s => s.originalIdx === originalIdx);
    } else {
      // It's the actual answer text
      correctIndex = shuffled.findIndex(s => s.opt === correctAnswer);
    }
    
    return {
      shuffledOptions: shuffled.map(s => s.opt),
      correctIndex: correctIndex >= 0 ? correctIndex : 0
    };
  }
  
  /**
   * Shuffle questions within each section (maintains section grouping)
   */
  private shuffleWithinSections(questions: SelectedQuestion[]): SelectedQuestion[] {
    // Group by section
    const bySection: Record<string, SelectedQuestion[]> = {};
    for (const q of questions) {
      if (!bySection[q.sectionName]) {
        bySection[q.sectionName] = [];
      }
      bySection[q.sectionName].push(q);
    }
    
    // Shuffle each section and reassign question numbers
    const result: SelectedQuestion[] = [];
    let questionNumber = 1;
    
    for (const sectionName of Object.keys(bySection)) {
      const shuffled = this.shuffleArray(bySection[sectionName]);
      for (const q of shuffled) {
        result.push({ ...q, questionNumber: questionNumber++ });
      }
    }
    
    return result;
  }
  
  /**
   * Fisher-Yates shuffle
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * Calculate selection statistics
   */
  private calculateStats(sets: QuestionSet[], blueprint: Blueprint): SelectionStats {
    const allQuestions = sets.flatMap(s => s.questions);
    const sections = (blueprint.sections || []) as BlueprintSection[];
    
    const totalRequested = sections.reduce((sum, s) => sum + s.questionCount, 0) * sets.length;
    
    // Difficulty distribution
    const difficultyDistribution: Record<string, number> = {};
    for (const q of allQuestions) {
      const diff = q.difficulty || 'medium';
      difficultyDistribution[diff] = (difficultyDistribution[diff] || 0) + 1;
    }
    
    // Chapter distribution
    const chapterDistribution: Record<string, number> = {};
    for (const q of allQuestions) {
      chapterDistribution[q.chapter] = (chapterDistribution[q.chapter] || 0) + 1;
    }
    
    // Type distribution
    const typeDistribution: Record<string, number> = {};
    for (const q of allQuestions) {
      typeDistribution[q.type] = (typeDistribution[q.type] || 0) + 1;
    }
    
    // Calculate shortfalls
    const shortfalls: { section: string; shortage: number }[] = [];
    for (const set of sets) {
      for (const breakdown of set.sectionBreakdown) {
        if (breakdown.selected < breakdown.requested) {
          shortfalls.push({
            section: `${set.setName} - ${breakdown.name}`,
            shortage: breakdown.requested - breakdown.selected
          });
        }
      }
    }
    
    return {
      totalQuestionsRequested: totalRequested,
      totalQuestionsSelected: allQuestions.length,
      difficultyDistribution,
      chapterDistribution,
      typeDistribution,
      shortfalls
    };
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate blueprint against available question pool
 */
export function validateBlueprintCapacity(
  blueprint: Blueprint,
  availableQuestions: Question[],
  setCount: number = 1
): {
  valid: boolean;
  issues: string[];
  sectionAnalysis: {
    section: string;
    required: number;
    available: number;
    canFulfill: boolean;
  }[];
} {
  const sections = (blueprint.sections || []) as BlueprintSection[];
  const issues: string[] = [];
  const sectionAnalysis: any[] = [];
  
  // For multi-set, we need setCount times the questions
  const multiplier = setCount;
  
  for (const section of sections) {
    const pool = availableQuestions.filter(q => {
      if (q.status !== 'approved') return false;
      if (section.questionType && q.type !== section.questionType) return false;
      if (section.marks && q.marks !== section.marks) return false;
      if (section.difficulty && q.difficulty !== section.difficulty) return false;
      if (section.chapters?.length && !section.chapters.includes(q.chapter)) return false;
      return true;
    });
    
    const required = section.questionCount * multiplier;
    const available = pool.length;
    const canFulfill = available >= required;
    
    sectionAnalysis.push({
      section: section.name,
      required,
      available,
      canFulfill
    });
    
    if (!canFulfill) {
      issues.push(
        `Section "${section.name}": Need ${required} questions (${setCount} sets × ${section.questionCount}), ` +
        `only ${available} available`
      );
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    sectionAnalysis
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create engine for online test generation
 */
export function createOnlineTestEngine(
  tenantId: string,
  subject: string,
  grade: string,
  options?: Partial<SelectionOptions>
): QuestionSelectionEngine {
  return new QuestionSelectionEngine({
    mode: 'online',
    tenantId,
    subject,
    grade,
    shuffleQuestions: true,
    shuffleOptions: true,
    onlyApproved: true,
    ...options
  });
}

/**
 * Create engine for offline paper generation
 */
export function createOfflinePaperEngine(
  tenantId: string,
  subject: string,
  grade: string,
  options?: Partial<SelectionOptions>
): QuestionSelectionEngine {
  return new QuestionSelectionEngine({
    mode: 'offline',
    tenantId,
    subject,
    grade,
    fixedOrder: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    onlyApproved: true,
    ...options
  });
}

/**
 * Create engine for multi-set paper generation (Set A/B/C)
 */
export function createMultiSetPaperEngine(
  tenantId: string,
  subject: string,
  grade: string,
  setCount: number,
  options?: Partial<SelectionOptions>
): QuestionSelectionEngine {
  return new QuestionSelectionEngine({
    mode: 'offline',
    tenantId,
    subject,
    grade,
    setCount,
    fixedOrder: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    onlyApproved: true,
    ...options
  });
}
