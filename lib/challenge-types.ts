/**
 * Challenge Types for Architecture Challenges Feature
 *
 * This file defines all TypeScript interfaces for the challenge system
 * including challenges, evaluation results, and related data structures.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Difficulty levels for challenges
 */
export type Difficulty = "beginner" | "intermediate" | "advanced";

/**
 * Categories of architecture challenges
 */
export type ChallengeCategory =
  | "web-applications"
  | "microservices"
  | "real-time-systems"
  | "data-pipelines"
  | "custom";

// ============================================================================
// Challenge Data Models
// ============================================================================

/**
 * A single requirement within a challenge
 */
export interface ChallengeRequirement {
  id: string;
  description: string;
  evaluationCriteria: string; // Used by AI to evaluate
}

/**
 * A challenge definition with all metadata and requirements
 */
export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: ChallengeCategory;
  description: string;
  requirements: ChallengeRequirement[];
  hints: string[];
  isCustom: boolean;
  createdAt?: number;
}

// ============================================================================
// Evaluation Data Models
// ============================================================================

/**
 * Result for a single requirement evaluation
 */
export interface RequirementResult {
  requirementId: string;
  passed: boolean;
  feedback: string;
}

/**
 * Complete evaluation result for a challenge submission
 */
export interface EvaluationResult {
  challengeId: string;
  passed: boolean;
  score: number; // 0-100
  requirementResults: RequirementResult[];
  suggestions: string[];
  overallFeedback: string;
}

// ============================================================================
// Progress Tracking
// ============================================================================

/**
 * Record of a completed challenge
 */
export interface CompletionRecord {
  completedAt: number;
  score: number;
  attempts: number;
}

/**
 * Statistics about user progress
 */
export interface ProgressStats {
  totalCompleted: number;
  totalAvailable: number;
  successRate: number;
  byDifficulty: Record<Difficulty, { completed: number; total: number }>;
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Format for exporting/importing challenges as JSON
 */
export interface ChallengeExport {
  version: "1.0";
  challenge: Omit<Challenge, "isCustom">;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * List of valid difficulty values
 */
export const DIFFICULTY_VALUES: Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

/**
 * List of valid category values
 */
export const CATEGORY_VALUES: ChallengeCategory[] = [
  "web-applications",
  "microservices",
  "real-time-systems",
  "data-pipelines",
  "custom",
];

/**
 * Validates that a challenge has all required fields with correct types
 */
export function isValidChallenge(obj: unknown): obj is Challenge {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const challenge = obj as Record<string, unknown>;

  // Check required string fields
  if (typeof challenge.id !== "string" || challenge.id.length === 0) {
    return false;
  }
  if (typeof challenge.title !== "string" || challenge.title.length === 0) {
    return false;
  }
  if (typeof challenge.description !== "string") {
    return false;
  }

  // Check difficulty
  if (!DIFFICULTY_VALUES.includes(challenge.difficulty as Difficulty)) {
    return false;
  }

  // Check category
  if (!CATEGORY_VALUES.includes(challenge.category as ChallengeCategory)) {
    return false;
  }

  // Check requirements array (must be non-empty)
  if (
    !Array.isArray(challenge.requirements) ||
    challenge.requirements.length === 0
  ) {
    return false;
  }

  // Validate each requirement
  for (const req of challenge.requirements) {
    if (!isValidRequirement(req)) {
      return false;
    }
  }

  // Check hints array (can be empty)
  if (!Array.isArray(challenge.hints)) {
    return false;
  }

  // Check isCustom boolean
  if (typeof challenge.isCustom !== "boolean") {
    return false;
  }

  // Optional createdAt must be a number if present
  if (
    challenge.createdAt !== undefined &&
    typeof challenge.createdAt !== "number"
  ) {
    return false;
  }

  return true;
}

/**
 * Validates that a requirement has all required fields
 */
export function isValidRequirement(obj: unknown): obj is ChallengeRequirement {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const req = obj as Record<string, unknown>;

  return (
    typeof req.id === "string" &&
    req.id.length > 0 &&
    typeof req.description === "string" &&
    typeof req.evaluationCriteria === "string"
  );
}

/**
 * Validates that an evaluation result has all required fields
 */
export function isValidEvaluationResult(obj: unknown): obj is EvaluationResult {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const result = obj as Record<string, unknown>;

  return (
    typeof result.challengeId === "string" &&
    typeof result.passed === "boolean" &&
    typeof result.score === "number" &&
    result.score >= 0 &&
    result.score <= 100 &&
    Array.isArray(result.requirementResults) &&
    Array.isArray(result.suggestions) &&
    typeof result.overallFeedback === "string"
  );
}
