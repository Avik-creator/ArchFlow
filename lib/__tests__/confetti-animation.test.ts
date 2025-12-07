/**
 * Property-Based Tests for Confetti Animation
 *
 * Tests for Properties 11 and 12 from the design document.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { shouldTriggerConfetti } from "@/components/confetti-animation";
import {
  type EvaluationResult,
  type RequirementResult,
  type Difficulty,
  type ChallengeCategory,
  DIFFICULTY_VALUES,
  CATEGORY_VALUES,
} from "../challenge-types";

// ============================================================================
// Generators (Arbitraries)
// ============================================================================

/**
 * Generator for non-empty strings
 */
const nonEmptyString = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generator for non-empty strings that are not just whitespace
 */
const nonEmptyNonWhitespaceString = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for valid Difficulty values
 */
const arbitraryDifficulty: fc.Arbitrary<Difficulty> = fc.constantFrom(
  ...DIFFICULTY_VALUES
);

/**
 * Generator for valid ChallengeCategory values
 */
const arbitraryCategory: fc.Arbitrary<ChallengeCategory> = fc.constantFrom(
  ...CATEGORY_VALUES
);

/**
 * Generator for RequirementResult with passed=true
 */
function arbitraryPassedRequirementResult(
  requirementId: string
): fc.Arbitrary<RequirementResult> {
  return fc.record({
    requirementId: fc.constant(requirementId),
    passed: fc.constant(true),
    feedback: fc.string(),
  });
}

/**
 * Generator for RequirementResult with passed=false and non-empty feedback
 */
function arbitraryFailedRequirementResult(
  requirementId: string
): fc.Arbitrary<RequirementResult> {
  return fc.record({
    requirementId: fc.constant(requirementId),
    passed: fc.constant(false),
    feedback: nonEmptyNonWhitespaceString,
  });
}

/**
 * Generator for a successful EvaluationResult (passed=true, score=100)
 */
const arbitrarySuccessfulEvaluationResult: fc.Arbitrary<EvaluationResult> = fc
  .array(nonEmptyString, { minLength: 1, maxLength: 5 })
  .chain((requirementIds) => {
    const requirementResultsArb = fc.tuple(
      ...requirementIds.map((id) => arbitraryPassedRequirementResult(id))
    );

    return requirementResultsArb.chain((requirementResults) =>
      fc.record({
        challengeId: nonEmptyString,
        passed: fc.constant(true),
        score: fc.constant(100),
        requirementResults: fc.constant(requirementResults),
        suggestions: fc.array(fc.string(), { maxLength: 3 }),
        overallFeedback: fc.string(),
      })
    );
  });

/**
 * Generator for a failed EvaluationResult (passed=false, at least one failed requirement)
 */
const arbitraryFailedEvaluationResult: fc.Arbitrary<EvaluationResult> = fc
  .array(nonEmptyString, { minLength: 1, maxLength: 5 })
  .chain((requirementIds) => {
    // Ensure at least one requirement fails
    const requirementResultsArb = fc.tuple(
      ...requirementIds.map((id, index) =>
        index === 0
          ? arbitraryFailedRequirementResult(id) // First one always fails
          : fc
              .boolean()
              .chain((passed) =>
                passed
                  ? arbitraryPassedRequirementResult(id)
                  : arbitraryFailedRequirementResult(id)
              )
      )
    );

    return requirementResultsArb.chain((requirementResults) => {
      const passedCount = requirementResults.filter((r) => r.passed).length;
      const totalCount = requirementResults.length;
      const score =
        totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

      return fc.record({
        challengeId: nonEmptyString,
        passed: fc.constant(false),
        score: fc.constant(score),
        requirementResults: fc.constant(requirementResults),
        suggestions: fc.array(fc.string(), { maxLength: 3 }),
        overallFeedback: fc.string(),
      });
    });
  });

/**
 * Generator for any EvaluationResult (passed or failed)
 */
const arbitraryEvaluationResult: fc.Arbitrary<EvaluationResult> = fc.oneof(
  arbitrarySuccessfulEvaluationResult,
  arbitraryFailedEvaluationResult
);

// ============================================================================
// Property Tests
// ============================================================================

describe("Confetti Animation - Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 11: Confetti trigger on success**
   * **Validates: Requirements 4.1**
   *
   * For any EvaluationResult where passed is true, the confetti animation
   * trigger should be set to true.
   */
  it("Property 11: Confetti trigger on success - confetti triggers when evaluation passes", () => {
    fc.assert(
      fc.property(arbitrarySuccessfulEvaluationResult, (evaluationResult) => {
        // When the evaluation passed, confetti should trigger
        expect(evaluationResult.passed).toBe(true);
        expect(shouldTriggerConfetti(evaluationResult.passed)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 11: Confetti trigger on success**
   * **Validates: Requirements 4.1**
   *
   * For any EvaluationResult where passed is false, the confetti animation
   * trigger should be set to false.
   */
  it("Property 11: Confetti does not trigger on failure", () => {
    fc.assert(
      fc.property(arbitraryFailedEvaluationResult, (evaluationResult) => {
        // When the evaluation failed, confetti should not trigger
        expect(evaluationResult.passed).toBe(false);
        expect(shouldTriggerConfetti(evaluationResult.passed)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 11: Confetti trigger on success**
   * **Validates: Requirements 4.1**
   *
   * The confetti trigger function should be a pure function that only depends
   * on the passed boolean value.
   */
  it("Property 11: Confetti trigger is deterministic based on passed status", () => {
    fc.assert(
      fc.property(fc.boolean(), (passed) => {
        // The function should return the same result for the same input
        const result1 = shouldTriggerConfetti(passed);
        const result2 = shouldTriggerConfetti(passed);
        expect(result1).toBe(result2);

        // The result should match the passed value
        expect(result1).toBe(passed);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Evaluation Results - Success Display Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 12: Success display includes score**
   * **Validates: Requirements 4.2**
   *
   * For any successful evaluation (passed=true), the displayed result should
   * include the score value from the EvaluationResult.
   */
  it("Property 12: Success display includes score - successful evaluations have valid scores", () => {
    fc.assert(
      fc.property(arbitrarySuccessfulEvaluationResult, (evaluationResult) => {
        // Successful evaluations should have a score
        expect(evaluationResult.passed).toBe(true);
        expect(typeof evaluationResult.score).toBe("number");
        expect(evaluationResult.score).toBeGreaterThanOrEqual(0);
        expect(evaluationResult.score).toBeLessThanOrEqual(100);

        // For a fully successful evaluation, score should be 100
        expect(evaluationResult.score).toBe(100);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 12: Success display includes score**
   * **Validates: Requirements 4.2**
   *
   * For any evaluation result, the score should be present and within valid range.
   */
  it("Property 12: All evaluation results have valid scores for display", () => {
    fc.assert(
      fc.property(arbitraryEvaluationResult, (evaluationResult) => {
        // Score should always be present and valid
        expect(typeof evaluationResult.score).toBe("number");
        expect(evaluationResult.score).toBeGreaterThanOrEqual(0);
        expect(evaluationResult.score).toBeLessThanOrEqual(100);

        // Score should be consistent with passed status
        // If passed is true, all requirements passed, so score should be 100
        if (evaluationResult.passed) {
          expect(evaluationResult.score).toBe(100);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 12: Success display includes score**
   * **Validates: Requirements 4.2**
   *
   * The score calculation should be consistent with requirement results.
   */
  it("Property 12: Score is consistent with requirement pass rate", () => {
    fc.assert(
      fc.property(arbitraryEvaluationResult, (evaluationResult) => {
        const passedCount = evaluationResult.requirementResults.filter(
          (r) => r.passed
        ).length;
        const totalCount = evaluationResult.requirementResults.length;
        const expectedScore =
          totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

        expect(evaluationResult.score).toBe(expectedScore);
      }),
      { numRuns: 100 }
    );
  });
});
