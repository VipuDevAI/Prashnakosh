/**
 * ============================================================================
 * PRASHNAKOSH - Duplicate Detection Service
 * ============================================================================
 * 
 * Handles:
 * 1. Exact duplicate detection (hash-based)
 * 2. Near duplicate detection (similarity-based)
 * 3. Teacher UX for duplicate handling
 */

import crypto from 'crypto';
import type { Question } from '@shared/schema';

// ============================================================================
// TYPES
// ============================================================================

export interface DuplicateCheckRequest {
  content: string;
  options?: string[];
  tenantId: string;
  subject?: string;
  chapter?: string;
}

export interface DuplicateCheckResponse {
  status: 'exact_duplicate' | 'similar_found' | 'unique';
  canProceed: boolean;
  message: string;
  exactMatch?: {
    id: string;
    content: string;
    chapter: string;
    createdBy?: string;
    academicYear?: string;
  };
  similarQuestions?: {
    id: string;
    content: string;
    similarity: number;
    chapter: string;
    createdBy?: string;
  }[];
  recommendation: 'block' | 'warn' | 'allow';
  options?: ('use_existing' | 'edit_and_save' | 'save_anyway')[];
}

export interface BulkDuplicateCheckResult {
  totalChecked: number;
  exactDuplicates: number;
  similarFound: number;
  unique: number;
  results: {
    index: number;
    content: string;
    status: DuplicateCheckResponse['status'];
    matchId?: string;
    similarity?: number;
  }[];
}

// ============================================================================
// NORMALIZATION
// ============================================================================

/**
 * Normalize question content for comparison
 */
export function normalizeQuestionContent(content: string): string {
  return content
    // Convert to lowercase
    .toLowerCase()
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Normalize quotes
    .replace(/[''`]/g, "'")
    .replace(/[""]/g, '"')
    // Remove extra punctuation spaces
    .replace(/\s*([.,;:?!])\s*/g, '$1 ')
    // Normalize numbers (remove leading zeros)
    .replace(/\b0+(\d)/g, '$1')
    // Remove common filler words that don't affect meaning
    .replace(/\b(the|a|an)\b/g, '')
    // Normalize mathematical operators
    .replace(/\s*([+\-*/=<>])\s*/g, ' $1 ')
    // Final whitespace cleanup
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate content hash for exact duplicate detection
 */
export function generateQuestionHash(content: string, options?: string[]): string {
  const normalized = normalizeQuestionContent(content);
  
  // Include options in hash for MCQs (sorted to handle reordering)
  let hashInput = normalized;
  if (options && options.length > 0) {
    const sortedOptions = [...options].map(o => normalizeQuestionContent(o)).sort();
    hashInput += '||' + sortedOptions.join('|');
  }
  
  return crypto.createHash('md5').update(hashInput).digest('hex');
}

// ============================================================================
// SIMILARITY CALCULATION
// ============================================================================

/**
 * Tokenize content into meaningful words
 */
function tokenize(content: string): string[] {
  return normalizeQuestionContent(content)
    .split(/\s+/)
    .filter(word => word.length > 2)  // Ignore very short words
    .filter(word => !/^\d+$/.test(word) || word.length > 2);  // Keep meaningful numbers
}

/**
 * Calculate Jaccard similarity between two strings
 */
export function calculateJaccardSimilarity(str1: string, str2: string): number {
  const tokens1 = new Set(tokenize(str1));
  const tokens2 = new Set(tokenize(str2));
  
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
}

/**
 * Calculate n-gram based similarity (more accurate for near-duplicates)
 */
export function calculateNGramSimilarity(str1: string, str2: string, n: number = 3): number {
  const getNGrams = (str: string): Set<string> => {
    const normalized = normalizeQuestionContent(str).replace(/\s/g, '');
    const ngrams = new Set<string>();
    for (let i = 0; i <= normalized.length - n; i++) {
      ngrams.add(normalized.substring(i, i + n));
    }
    return ngrams;
  };
  
  const ngrams1 = getNGrams(str1);
  const ngrams2 = getNGrams(str2);
  
  if (ngrams1.size === 0 || ngrams2.size === 0) return 0;
  
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);
  
  return intersection.size / union.size;
}

/**
 * Combined similarity score (weighted average)
 */
export function calculateCombinedSimilarity(str1: string, str2: string): number {
  const jaccard = calculateJaccardSimilarity(str1, str2);
  const ngram = calculateNGramSimilarity(str1, str2);
  
  // Weight n-gram higher as it's better at detecting near-duplicates
  return (jaccard * 0.3) + (ngram * 0.7);
}

// ============================================================================
// DUPLICATE DETECTION CLASS
// ============================================================================

export class DuplicateDetectionService {
  private readonly EXACT_MATCH_THRESHOLD = 1.0;
  private readonly SIMILARITY_WARNING_THRESHOLD = 0.85;
  private readonly SIMILARITY_BLOCK_THRESHOLD = 0.95;
  
  constructor(
    private existingQuestions: Question[],
    private options?: {
      similarityThreshold?: number;
      checkAcrossTenants?: boolean;
    }
  ) {}
  
  /**
   * Check a single question for duplicates
   */
  checkSingleQuestion(request: DuplicateCheckRequest): DuplicateCheckResponse {
    const newHash = generateQuestionHash(request.content, request.options);
    const newNormalized = normalizeQuestionContent(request.content);
    
    // Filter questions to check against
    let questionsToCheck = this.existingQuestions.filter(q => !q.isDeleted);
    
    // If not checking across tenants, filter by tenant
    if (!this.options?.checkAcrossTenants) {
      questionsToCheck = questionsToCheck.filter(q => q.tenantId === request.tenantId);
    }
    
    // Optionally filter by subject/chapter for faster search
    if (request.subject) {
      questionsToCheck = questionsToCheck.filter(q => q.subject === request.subject);
    }
    
    // 1. Check for exact duplicate by hash
    const exactMatch = questionsToCheck.find(q => 
      q.contentHash === newHash || 
      normalizeQuestionContent(q.content) === newNormalized
    );
    
    if (exactMatch) {
      return {
        status: 'exact_duplicate',
        canProceed: false,
        message: 'This exact question already exists in the question bank.',
        exactMatch: {
          id: exactMatch.id,
          content: exactMatch.content,
          chapter: exactMatch.chapter,
          createdBy: exactMatch.createdBy || undefined,
          academicYear: (exactMatch as any).academicYear || undefined,
        },
        recommendation: 'block',
        options: ['use_existing']
      };
    }
    
    // 2. Check for similar questions
    const threshold = this.options?.similarityThreshold || this.SIMILARITY_WARNING_THRESHOLD;
    
    const similarQuestions = questionsToCheck
      .map(q => ({
        question: q,
        similarity: calculateCombinedSimilarity(request.content, q.content)
      }))
      .filter(({ similarity }) => similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);  // Top 5 similar
    
    if (similarQuestions.length > 0) {
      const topSimilarity = similarQuestions[0].similarity;
      
      // If very high similarity (>95%), treat almost like duplicate
      if (topSimilarity >= this.SIMILARITY_BLOCK_THRESHOLD) {
        return {
          status: 'similar_found',
          canProceed: false,
          message: `A very similar question (${Math.round(topSimilarity * 100)}% match) exists. Please review.`,
          similarQuestions: similarQuestions.map(s => ({
            id: s.question.id,
            content: s.question.content,
            similarity: s.similarity,
            chapter: s.question.chapter,
            createdBy: s.question.createdBy || undefined,
          })),
          recommendation: 'warn',
          options: ['use_existing', 'edit_and_save', 'save_anyway']
        };
      }
      
      // Moderate similarity - warn but allow
      return {
        status: 'similar_found',
        canProceed: true,
        message: `Similar questions found (${Math.round(topSimilarity * 100)}% match). You may proceed or use existing.`,
        similarQuestions: similarQuestions.map(s => ({
          id: s.question.id,
          content: s.question.content,
          similarity: s.similarity,
          chapter: s.question.chapter,
          createdBy: s.question.createdBy || undefined,
        })),
        recommendation: 'warn',
        options: ['use_existing', 'edit_and_save', 'save_anyway']
      };
    }
    
    // 3. No duplicates found
    return {
      status: 'unique',
      canProceed: true,
      message: 'Question is unique. Safe to add.',
      recommendation: 'allow'
    };
  }
  
  /**
   * Check multiple questions in bulk (for batch uploads)
   */
  checkBulkQuestions(questions: DuplicateCheckRequest[]): BulkDuplicateCheckResult {
    const results: BulkDuplicateCheckResult['results'] = [];
    let exactDuplicates = 0;
    let similarFound = 0;
    let unique = 0;
    
    // Also track duplicates within the batch itself
    const batchHashes = new Map<string, number>();  // hash -> first index
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const hash = generateQuestionHash(q.content, q.options);
      
      // Check for duplicate within batch
      if (batchHashes.has(hash)) {
        results.push({
          index: i,
          content: q.content.substring(0, 100),
          status: 'exact_duplicate',
          matchId: `batch_${batchHashes.get(hash)}`
        });
        exactDuplicates++;
        continue;
      }
      batchHashes.set(hash, i);
      
      // Check against existing questions
      const checkResult = this.checkSingleQuestion(q);
      
      results.push({
        index: i,
        content: q.content.substring(0, 100),
        status: checkResult.status,
        matchId: checkResult.exactMatch?.id || checkResult.similarQuestions?.[0]?.id,
        similarity: checkResult.similarQuestions?.[0]?.similarity
      });
      
      if (checkResult.status === 'exact_duplicate') exactDuplicates++;
      else if (checkResult.status === 'similar_found') similarFound++;
      else unique++;
    }
    
    return {
      totalChecked: questions.length,
      exactDuplicates,
      similarFound,
      unique,
      results
    };
  }
  
  /**
   * Find all duplicates in the existing pool (for cleanup)
   */
  findDuplicatesInPool(): {
    duplicateGroups: { hash: string; questions: Question[] }[];
    totalDuplicates: number;
  } {
    const hashGroups = new Map<string, Question[]>();
    
    for (const q of this.existingQuestions) {
      if (q.isDeleted) continue;
      
      const hash = q.contentHash || generateQuestionHash(q.content, q.options || undefined);
      
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash)!.push(q);
    }
    
    // Filter to only groups with duplicates
    const duplicateGroups: { hash: string; questions: Question[] }[] = [];
    let totalDuplicates = 0;
    
    for (const [hash, questions] of hashGroups) {
      if (questions.length > 1) {
        duplicateGroups.push({ hash, questions });
        totalDuplicates += questions.length - 1;  // -1 because one is the "original"
      }
    }
    
    return { duplicateGroups, totalDuplicates };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create duplicate detection service for a tenant
 */
export function createDuplicateDetector(
  existingQuestions: Question[],
  tenantId: string
): DuplicateDetectionService {
  return new DuplicateDetectionService(existingQuestions, {
    checkAcrossTenants: false,
    similarityThreshold: 0.85
  });
}

/**
 * Quick check if content is likely duplicate (for real-time validation)
 */
export function quickDuplicateCheck(
  content: string,
  existingHashes: Set<string>
): boolean {
  const hash = generateQuestionHash(content);
  return existingHashes.has(hash);
}

/**
 * Generate hashes for a question pool (for caching)
 */
export function generateHashSet(questions: Question[]): Set<string> {
  const hashes = new Set<string>();
  for (const q of questions) {
    const hash = q.contentHash || generateQuestionHash(q.content, q.options || undefined);
    hashes.add(hash);
  }
  return hashes;
}
