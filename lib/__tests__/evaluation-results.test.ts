/**
 * Property-Based Tests for Evaluation Results
 *
 * Tests for Properties 9 and 10 from the design document.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  type Challenge,
  type ChallengeRequirement,
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
 * Used for feedback messages that must have meaningful content
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
 * Generator for valid ChallengeRequirement objects
 */
const arbitraryRequirement: fc.Arbitrary<ChallengeRequirement> = fc.record({
  id: nonEmptyString,
  description: fc.string(),
  evaluationCriteria: fc.string(),
});

/**
 * Generator for valid Challenge objects with all required fields
 */
const arbitraryChallenge: fc.Arbitrary<Challenge> = fc.record({
  id: nonEmptyString,
  title: nonEmptyString,
  difficulty: arbitraryDifficulty,
  category: arbitraryCategory,
  description: fc.string(),
  requirements: fc.array(arbitraryRequirement, { minLength: 1, maxLength: 10 }),
  hints: fc.array(fc.string(), { maxLength: 5 }),
  isCustom: fc.boolean(),
  createdAt: fc.option(fc.nat(), { nil: undefined }),
});

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
    feedback: nonEmptyNonWhitespaceString, // Failed requirements must have non-empty, non-whitespace feedback
  });
}

/**
 * Generator for a valid EvaluationResult that matches a given challenge's requirements.
 * This ensures every requirement in the challenge has a corresponding RequirementResult.
 */
function arbitraryEvaluationResultForChallenge(
  challenge: Challenge
): fc.Arbitrary<EvaluationResult> {
  // Generate a RequirementResult for each requirement in the challenge
  const requirementResultsArb = fc.tuple(
    ...challenge.requirements.map((req) =>
      fc
        .boolean()
        .chain((passed) =>
          passed
            ? arbitraryPassedRequirementResult(req.id)
            : arbitraryFailedRequirementResult(req.id)
        )
    )
  );

  return requirementResultsArb.chain((requirementResults) => {
    const passedCount = requirementResults.filter((r) => r.passed).length;
    const totalCount = requirementResults.length;
    const allPassed = passedCount === totalCount;
    const score =
      totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    return fc.record({
      challengeId: fc.constant(challenge.id),
      passed: fc.constant(allPassed),
      score: fc.constant(score),
      requirementResults: fc.constant(requirementResults),
      suggestions: fc.array(fc.string(), { maxLength: 5 }),
      overallFeedback: fc.string(),
    });
  });
}

// ============================================================================
// Property Tests
// ============================================================================

describe("Evaluation Results - Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 9: Evaluation result completeness**
   * **Validates: Requirements 3.2**
   *
   * For any challenge submission, the EvaluationResult should contain a
   * RequirementResult for every requirement in the challenge.
   */
  it("Property 9: Evaluation result completeness - every requirement has a result", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        // Generate an evaluation result for this challenge
        return fc.assert(
          fc.property(
            arbitraryEvaluationResultForChallenge(challenge),
            (evaluationResult) => {
              // The evaluation result should have the same number of requirement results
              // as the challenge has requirements
              expect(evaluationResult.requirementResults.length).toBe(
                challenge.requirements.length
              );

              // Every requirement ID from the challenge should appear in the results
              const resultIds = new Set(
                evaluationResult.requirementResults.map((r) => r.requirementId)
              );
              for (const req of challenge.requirements) {
                expect(resultIds.has(req.id)).toBe(true);
              }

              // The challengeId should match
              expect(evaluationResult.challengeId).toBe(challenge.id);
            }
          ),
          { numRuns: 10 } // Inner runs per challenge
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 9: Evaluation result completeness**
   * **Validates: Requirements 3.2**
   *
   * The score should be consistent with the pass/fail status of requirements.
   */
  it("Property 9: Score is consistent with requirement results", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        return fc.assert(
          fc.property(
            arbitraryEvaluationResultForChallenge(challenge),
            (evaluationResult) => {
              const passedCount = evaluationResult.requirementResults.filter(
                (r) => r.passed
              ).length;
              const totalCount = evaluationResult.requirementResults.length;
              const expectedScore =
                totalCount > 0
                  ? Math.round((passedCount / totalCount) * 100)
                  : 0;

              expect(evaluationResult.score).toBe(expectedScore);

              // passed should be true only if all requirements passed
              const allPassed = passedCount === totalCount;
              expect(evaluationResult.passed).toBe(allPassed);
            }
          ),
          { numRuns: 10 }
        );
      }),
      { numRuns: 100 }
    );
  });
});

describe("Evaluation Results - Failed Requirement Feedback Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 10: Failed requirement feedback**
   * **Validates: Requirements 3.3**
   *
   * For any EvaluationResult containing failed requirements, each failed
   * RequirementResult should have a non-empty feedback string.
   */
  it("Property 10: Failed requirement feedback - all failed requirements have non-empty feedback", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        return fc.assert(
          fc.property(
            arbitraryEvaluationResultForChallenge(challenge),
            (evaluationResult) => {
              // Check every failed requirement has non-empty feedback
              for (const reqResult of evaluationResult.requirementResults) {
                if (!reqResult.passed) {
                  expect(reqResult.feedback).toBeDefined();
                  expect(typeof reqResult.feedback).toBe("string");
                  expect(reqResult.feedback.length).toBeGreaterThan(0);
                }
              }
            }
          ),
          { numRuns: 10 }
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 10: Failed requirement feedback**
   * **Validates: Requirements 3.3**
   *
   * When there are failed requirements, the feedback should explain what is missing.
   */
  it("Property 10: Failed requirements always have feedback explaining the issue", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        return fc.assert(
          fc.property(
            arbitraryEvaluationResultForChallenge(challenge),
            (evaluationResult) => {
              const failedResults = evaluationResult.requirementResults.filter(
                (r) => !r.passed
              );

              // Every failed result must have feedback
              for (const failed of failedResults) {
                expect(failed.feedback).toBeTruthy();
                expect(failed.feedback.trim().length).toBeGreaterThan(0);
              }
            }
          ),
          { numRuns: 10 }
        );
      }),
      { numRuns: 100 }
    );
  });
});
