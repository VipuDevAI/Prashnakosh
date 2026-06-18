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
  departmentId?: string;  // MANDATORY for department-scoped selection
  
  // Multi-set options
  setCount?: number;  // 1 = single set, 2+ = multiple sets (A/B/C)
  allowOverlap?: boolean;  // Default: false. Only if explicitly chosen by user
  
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
  lessonDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  shortfalls: { section: string; shortage: number }[];
  // Per-set parity validation
  perSetStats?: {
    setName: string;
    difficultyDistribution: Record<string, number>;
    lessonDistribution: Record<string, number>;
    totalMarks: number;
  }[];
  overlapCount?: number;  // Should always be 0 for valid multi-set
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
   * For multi-set: uses FAIR PARTITIONING to ensure identical difficulty/chapter distribution
   */
  selectForBlueprint(blueprint: Blueprint): SelectionResult {
    const warnings: string[] = [];
    const sets: QuestionSet[] = [];
    const setCount = this.options.setCount || 1;
    
    // Reset used questions for fresh selection
    this.usedQuestionIds = new Set();
    
    if (setCount <= 1) {
      // Single set - use original logic
      const setResult = this.selectSingleSet(blueprint, 'Main', warnings);
      sets.push(setResult);
    } else {
      // Multi-set: Fair partitioning algorithm
      const multiSetResult = this.selectMultiSetFair(blueprint, setCount, warnings);
      sets.push(...multiSetResult);
    }
    
    // Calculate stats with per-set parity info
    const stats = this.calculateStats(sets, blueprint);
    
    return {
      success: stats.shortfalls.length === 0,
      sets,
      warnings,
      stats
    };
  }
  
  /**
   * FAIR MULTI-SET PARTITIONING
   * Guarantees:
   * 1. Zero question overlap across sets
   * 2. Identical difficulty distribution per set
   * 3. Consistent chapter coverage per set
   * 4. Same total marks per set
   */
  private selectMultiSetFair(blueprint: Blueprint, setCount: number, warnings: string[]): QuestionSet[] {
    const sections = (blueprint.sections || []) as BlueprintSection[];
    
    // Pre-allocate set structures
    const setQuestions: SelectedQuestion[][] = Array.from({ length: setCount }, () => []);
    const setBreakdowns: SectionBreakdown[][] = Array.from({ length: setCount }, () => []);
    
    for (const section of sections) {
      // Get ALL matching questions for this section
      const sectionPool = this.questionPool.filter(q => {
        if (this.options.subject && q.subject !== this.options.subject) return false;
        if (this.options.grade && q.grade !== this.options.grade) return false;
        if (section.questionType && q.type !== section.questionType) return false;
        // DECOUPLED: Marks no longer used as selection filter.
        // Blueprint assigns marks at paper generation time.
        if (section.difficulty && q.difficulty !== section.difficulty) return false;
        if (section.lessons?.length && !section.lessons.includes(q.lesson)) return false;
        return true;
      });
      
      const requiredPerSet = section.questionCount;
      const totalRequired = requiredPerSet * setCount;
      const allowOverlap = this.options.allowOverlap === true;
      
      if (sectionPool.length < totalRequired && !allowOverlap) {
        warnings.push(
          `Section "${section.name}": Need ${totalRequired} questions (${setCount} sets x ${requiredPerSet}), ` +
          `only ${sectionPool.length} available (${section.questionType}, ${section.difficulty || 'any difficulty'})`
        );
      }
      
      // Group pool by difficulty for fair partitioning
      const byDifficulty: Record<string, Question[]> = {};
      for (const q of sectionPool) {
        const diff = q.difficulty || 'medium';
        if (!byDifficulty[diff]) byDifficulty[diff] = [];
        byDifficulty[diff].push(q);
      }
      
      // Shuffle each difficulty bucket with LESSON INTERLEAVING for balanced spread
      for (const diff of Object.keys(byDifficulty)) {
        byDifficulty[diff] = this.interleaveByLesson(byDifficulty[diff]);
      }
      
      // Determine target difficulty distribution per set
      const diffTargets = this.calculateDifficultyTargets(
        requiredPerSet, section.difficulty, byDifficulty, setCount
      );
      
      // Fair allocation: round-robin across sets from each difficulty bucket
      const diffPointers: Record<string, number> = {};
      for (const diff of Object.keys(byDifficulty)) {
        diffPointers[diff] = 0;
      }
      
      for (let setIdx = 0; setIdx < setCount; setIdx++) {
        const questionsForThisSet: Question[] = [];
        
        // Allocate from each difficulty bucket
        for (const [diff, target] of Object.entries(diffTargets)) {
          const bucket = byDifficulty[diff] || [];
          let allocated = 0;
          
          while (allocated < target && diffPointers[diff] < bucket.length) {
            const q = bucket[diffPointers[diff]];
            if (!this.usedQuestionIds.has(q.id) || allowOverlap) {
              questionsForThisSet.push(q);
              this.usedQuestionIds.add(q.id);
              allocated++;
            }
            diffPointers[diff]++;
          }
        }
        
        // If we still need more questions (shortfall in specific difficulties)
        // try to fill from any remaining in the section pool
        if (questionsForThisSet.length < requiredPerSet) {
          const remaining = sectionPool.filter(q => !this.usedQuestionIds.has(q.id) || allowOverlap);
          const shuffledRemaining = this.shuffleArray(remaining);
          for (const q of shuffledRemaining) {
            if (questionsForThisSet.length >= requiredPerSet) break;
            if (!this.usedQuestionIds.has(q.id) || allowOverlap) {
              questionsForThisSet.push(q);
              this.usedQuestionIds.add(q.id);
            }
          }
        }
        
        setBreakdowns[setIdx].push({
          name: section.name,
          questionType: section.questionType || 'mixed',
          requested: requiredPerSet,
          selected: questionsForThisSet.length,
          marks: section.marks || 0,
          difficulty: section.difficulty,
        });
        
        // Convert to SelectedQuestion with section info
        for (const q of questionsForThisSet) {
          const selectedQ: SelectedQuestion = {
            ...q,
            sectionName: section.name,
            questionNumber: 0, // Will be renumbered later
            marks: section.marks, // Blueprint assigns marks, not the question's stored value
          };
          
          if (this.options.mode === 'online' && this.options.shuffleOptions !== false) {
            if (q.options?.length && q.correctAnswer) {
              const shuffleResult = this.shuffleOptions(q.options, q.correctAnswer);
              selectedQ.shuffledOptions = shuffleResult.shuffledOptions;
              selectedQ.correctAnswerIndex = shuffleResult.correctIndex;
            }
          }
          
          setQuestions[setIdx].push(selectedQ);
        }
      }
    }
    
    // Build final QuestionSet objects
    const result: QuestionSet[] = [];
    for (let i = 0; i < setCount; i++) {
      const setName = `Set ${String.fromCharCode(65 + i)}`;
      let questions = setQuestions[i];
      
      // Renumber questions
      let num = 1;
      questions = questions.map(q => ({ ...q, questionNumber: num++ }));
      
      // Shuffle within sections for online mode
      if (this.options.mode === 'online' && this.options.shuffleQuestions !== false) {
        questions = this.shuffleWithinSections(questions);
      }
      
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      
      result.push({
        setName,
        questions,
        totalMarks,
        sectionBreakdown: setBreakdowns[i],
      });
    }
    
    return result;
  }
  
  /**
   * Calculate target difficulty counts per set
   */
  private calculateDifficultyTargets(
    perSetCount: number,
    requiredDifficulty: string | undefined,
    byDifficulty: Record<string, Question[]>,
    setCount: number
  ): Record<string, number> {
    if (requiredDifficulty) {
      // All questions must be this difficulty
      return { [requiredDifficulty]: perSetCount };
    }
    
    // Calculate proportional targets based on available pool
    const totalAvailable = Object.values(byDifficulty).reduce((s, arr) => s + arr.length, 0);
    if (totalAvailable === 0) return { medium: perSetCount };
    
    const targets: Record<string, number> = {};
    let allocated = 0;
    const diffs = Object.keys(byDifficulty).sort();
    
    for (let i = 0; i < diffs.length; i++) {
      const diff = diffs[i];
      const availableForDiff = byDifficulty[diff].length;
      const maxPerSet = Math.floor(availableForDiff / setCount);
      
      if (i === diffs.length - 1) {
        // Last difficulty gets remainder
        targets[diff] = Math.min(perSetCount - allocated, maxPerSet);
      } else {
        // Proportional allocation
        const proportion = availableForDiff / totalAvailable;
        const target = Math.min(Math.round(perSetCount * proportion), maxPerSet);
        targets[diff] = target;
        allocated += target;
      }
    }
    
    // Ensure total matches perSetCount
    const totalTarget = Object.values(targets).reduce((s, v) => s + v, 0);
    if (totalTarget < perSetCount) {
      // Distribute remainder to difficulties with available capacity
      let remaining = perSetCount - totalTarget;
      for (const diff of diffs) {
        if (remaining <= 0) break;
        const maxPerSet = Math.floor(byDifficulty[diff].length / setCount);
        const canAdd = maxPerSet - targets[diff];
        if (canAdd > 0) {
          const add = Math.min(canAdd, remaining);
          targets[diff] += add;
          remaining -= add;
        }
      }
    }
    
    return targets;
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
          questionNumber: questionNumber++,
          marks: section.marks, // Blueprint assigns marks, not the question's stored value
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
      
      // DECOUPLED: Marks no longer used as selection filter.
      // Blueprint assigns marks at paper generation time.
      
      // Difficulty match (if specified)
      if (section.difficulty && q.difficulty !== section.difficulty) return false;
      
      // Chapter filter (if specified)
      if (section.lessons && section.lessons.length > 0) {
        if (!section.lessons.includes(q.lesson)) return false;
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
   * Select questions with balanced distribution across lessons AND difficulties.
   * LESSON BALANCING: Avoids selecting all questions from a single lesson.
   * Round-robin across lessons, then within each lesson apply difficulty balance.
   */
  private selectWithBalance(pool: Question[], count: number, requiredDifficulty?: string): Question[] {
    if (pool.length <= count) {
      return [...pool];  // Return all if not enough
    }
    
    // Group by lesson first for lesson balancing
    const byLesson: Record<string, Question[]> = {};
    for (const q of pool) {
      const lesson = q.lesson || '(No Lesson)';
      if (!byLesson[lesson]) byLesson[lesson] = [];
      byLesson[lesson].push(q);
    }
    
    const lessonNames = Object.keys(byLesson);
    
    // If only one lesson, skip lesson balancing and just pick
    if (lessonNames.length <= 1) {
      if (requiredDifficulty) {
        return this.shuffleArray([...pool]).slice(0, count);
      }
      return this.selectWithDifficultyBalance(pool, count);
    }
    
    // Shuffle within each lesson bucket for randomization
    for (const lesson of lessonNames) {
      byLesson[lesson] = this.shuffleArray(byLesson[lesson]);
    }
    
    // Round-robin across lessons to ensure spread
    const selected: Question[] = [];
    const lessonPointers: Record<string, number> = {};
    for (const l of lessonNames) lessonPointers[l] = 0;
    
    let roundIdx = 0;
    while (selected.length < count) {
      let addedThisRound = false;
      for (const lesson of lessonNames) {
        if (selected.length >= count) break;
        const bucket = byLesson[lesson];
        if (lessonPointers[lesson] < bucket.length) {
          selected.push(bucket[lessonPointers[lesson]]);
          lessonPointers[lesson]++;
          addedThisRound = true;
        }
      }
      if (!addedThisRound) break; // All buckets exhausted
      roundIdx++;
    }
    
    return selected;
  }
  
  /**
   * Internal: select with difficulty balance (30% easy, 50% medium, 20% hard)
   */
  private selectWithDifficultyBalance(pool: Question[], count: number): Question[] {
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
   * LESSON INTERLEAVING: Arrange questions from a bucket so lessons alternate.
   * E.g., [L1, L2, L3, L1, L2, L3, ...] instead of [L1, L1, L1, L2, L2, L3]
   * This ensures multi-set fair partitioning naturally spreads lessons across sets.
   */
  private interleaveByLesson(questions: Question[]): Question[] {
    const byLesson: Record<string, Question[]> = {};
    for (const q of questions) {
      const lesson = q.lesson || '(No Lesson)';
      if (!byLesson[lesson]) byLesson[lesson] = [];
      byLesson[lesson].push(q);
    }
    
    // Shuffle within each lesson
    const lessonKeys = Object.keys(byLesson);
    for (const l of lessonKeys) {
      byLesson[l] = this.shuffleArray(byLesson[l]);
    }
    
    // Round-robin interleave
    const result: Question[] = [];
    const pointers: Record<string, number> = {};
    for (const l of lessonKeys) pointers[l] = 0;
    
    let added = true;
    while (added) {
      added = false;
      for (const lesson of lessonKeys) {
        if (pointers[lesson] < byLesson[lesson].length) {
          result.push(byLesson[lesson][pointers[lesson]]);
          pointers[lesson]++;
          added = true;
        }
      }
    }
    return result;
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
   * Calculate selection statistics with per-set parity validation
   */
  private calculateStats(sets: QuestionSet[], blueprint: Blueprint): SelectionStats {
    const allQuestions = sets.flatMap(s => s.questions);
    const sections = (blueprint.sections || []) as BlueprintSection[];
    
    const totalRequested = sections.reduce((sum, s) => sum + s.questionCount, 0) * sets.length;
    
    // Difficulty distribution (aggregate)
    const difficultyDistribution: Record<string, number> = {};
    for (const q of allQuestions) {
      const diff = q.difficulty || 'medium';
      difficultyDistribution[diff] = (difficultyDistribution[diff] || 0) + 1;
    }
    
    // Chapter distribution (aggregate)
    const lessonDistribution: Record<string, number> = {};
    for (const q of allQuestions) {
      lessonDistribution[q.lesson] = (lessonDistribution[q.lesson] || 0) + 1;
    }
    
    // Type distribution (aggregate)
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
    
    // Per-set parity stats
    const perSetStats = sets.map(set => {
      const setDiffDist: Record<string, number> = {};
      const setLessonDist: Record<string, number> = {};
      for (const q of set.questions) {
        const diff = q.difficulty || 'medium';
        setDiffDist[diff] = (setDiffDist[diff] || 0) + 1;
        setLessonDist[q.lesson] = (setLessonDist[q.lesson] || 0) + 1;
      }
      return {
        setName: set.setName,
        difficultyDistribution: setDiffDist,
        lessonDistribution: setLessonDist,
        totalMarks: set.totalMarks,
      };
    });
    
    // Cross-set overlap check
    let overlapCount = 0;
    if (sets.length > 1) {
      const seenIds = new Set<string>();
      for (const set of sets) {
        for (const q of set.questions) {
          if (seenIds.has(q.id)) overlapCount++;
          seenIds.add(q.id);
        }
      }
    }
    
    return {
      totalQuestionsRequested: totalRequested,
      totalQuestionsSelected: allQuestions.length,
      difficultyDistribution,
      lessonDistribution,
      typeDistribution,
      shortfalls,
      perSetStats,
      overlapCount,
    };
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate blueprint against available question pool for multi-set generation
 * Returns detailed capacity analysis with remediation options
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
    questionType: string;
    difficulty: string;
    requiredPerSet: number;
    requiredTotal: number;
    available: number;
    canFulfill: boolean;
    difficultyBreakdown: Record<string, { available: number; neededPerSet: number }>;
  }[];
  remediation: {
    maxSetsNoOverlap: number;
    canReduceSets: boolean;
    suggestedSetCount: number;
  };
} {
  const sections = (blueprint.sections || []) as BlueprintSection[];
  const issues: string[] = [];
  const sectionAnalysis: any[] = [];
  
  let globalMaxSets = Infinity;
  
  for (const section of sections) {
    const pool = availableQuestions.filter(q => {
      if (q.status !== 'approved') return false;
      if (section.questionType && q.type !== section.questionType) return false;
      // DECOUPLED: Marks no longer used for capacity validation.
      if (section.difficulty && q.difficulty !== section.difficulty) return false;
      if (section.lessons?.length && !section.lessons.includes(q.lesson)) return false;
      return true;
    });
    
    const requiredPerSet = section.questionCount;
    const requiredTotal = requiredPerSet * setCount;
    const available = pool.length;
    const canFulfill = available >= requiredTotal;
    
    // Difficulty breakdown
    const diffBreakdown: Record<string, { available: number; neededPerSet: number }> = {};
    const byDiff: Record<string, Question[]> = {};
    for (const q of pool) {
      const d = q.difficulty || 'medium';
      if (!byDiff[d]) byDiff[d] = [];
      byDiff[d].push(q);
    }
    for (const [d, qs] of Object.entries(byDiff)) {
      const proportion = qs.length / (pool.length || 1);
      diffBreakdown[d] = {
        available: qs.length,
        neededPerSet: Math.round(requiredPerSet * proportion),
      };
    }
    
    // Calculate max sets for this section (no overlap)
    const maxSetsForSection = requiredPerSet > 0 ? Math.floor(available / requiredPerSet) : Infinity;
    globalMaxSets = Math.min(globalMaxSets, maxSetsForSection);
    
    sectionAnalysis.push({
      section: section.name,
      questionType: section.questionType || 'mixed',
      difficulty: section.difficulty || 'mixed',
      requiredPerSet,
      requiredTotal,
      available,
      canFulfill,
      difficultyBreakdown: diffBreakdown,
    });
    
    if (!canFulfill) {
      issues.push(
        `Section "${section.name}": Need ${requiredTotal} questions (${setCount} sets x ${requiredPerSet}), ` +
        `only ${available} available`
      );
    }
  }
  
  if (globalMaxSets === Infinity) globalMaxSets = setCount;
  
  return {
    valid: issues.length === 0,
    issues,
    sectionAnalysis,
    remediation: {
      maxSetsNoOverlap: Math.max(1, globalMaxSets),
      canReduceSets: globalMaxSets > 0 && globalMaxSets < setCount,
      suggestedSetCount: Math.max(1, Math.min(setCount, globalMaxSets)),
    },
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
