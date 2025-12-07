/**
 * Property-Based Tests for Challenge Types
 *
 * **Feature: architecture-challenges, Property 16: Challenge structure completeness**
 * **Validates: Requirements 8.1**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  type Challenge,
  type ChallengeRequirement,
  type Difficulty,
  type ChallengeCategory,
  isValidChallenge,
  isValidRequirement,
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

// ============================================================================
// Property Tests
// ============================================================================

describe("Challenge Types - Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 16: Challenge structure completeness**
   * **Validates: Requirements 8.1**
   *
   * For any valid Challenge object, it should contain all required fields:
   * id, title, difficulty, category, description, requirements (non-empty array),
   * hints (array), and isCustom.
   */
  it("Property 16: Challenge structure completeness - all generated challenges have required fields", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        // Verify all required fields exist and have correct types
        expect(typeof challenge.id).toBe("string");
        expect(challenge.id.length).toBeGreaterThan(0);

        expect(typeof challenge.title).toBe("string");
        expect(challenge.title.length).toBeGreaterThan(0);

        expect(DIFFICULTY_VALUES).toContain(challenge.difficulty);
        expect(CATEGORY_VALUES).toContain(challenge.category);

        expect(typeof challenge.description).toBe("string");

        expect(Array.isArray(challenge.requirements)).toBe(true);
        expect(challenge.requirements.length).toBeGreaterThan(0);

        expect(Array.isArray(challenge.hints)).toBe(true);

        expect(typeof challenge.isCustom).toBe("boolean");

        // Optional createdAt should be undefined or a number
        if (challenge.createdAt !== undefined) {
          expect(typeof challenge.createdAt).toBe("number");
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 16: Challenge structure completeness**
   * **Validates: Requirements 8.1**
   *
   * For any valid Challenge object, the isValidChallenge function should return true.
   */
  it("Property 16: isValidChallenge returns true for all valid challenges", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        expect(isValidChallenge(challenge)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 16: Challenge structure completeness**
   * **Validates: Requirements 8.1**
   *
   * For any valid ChallengeRequirement, the isValidRequirement function should return true.
   */
  it("Property 16: isValidRequirement returns true for all valid requirements", () => {
    fc.assert(
      fc.property(arbitraryRequirement, (requirement) => {
        expect(isValidRequirement(requirement)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 16: Challenge structure completeness**
   * **Validates: Requirements 8.1**
   *
   * Each requirement in a challenge should have all required fields.
   */
  it("Property 16: All requirements in a challenge have required fields", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        for (const req of challenge.requirements) {
          expect(typeof req.id).toBe("string");
          expect(req.id.length).toBeGreaterThan(0);
          expect(typeof req.description).toBe("string");
          expect(typeof req.evaluationCriteria).toBe("string");
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe("Challenge Types - Validation Edge Cases", () => {
  it("isValidChallenge rejects null", () => {
    expect(isValidChallenge(null)).toBe(false);
  });

  it("isValidChallenge rejects undefined", () => {
    expect(isValidChallenge(undefined)).toBe(false);
  });

  it("isValidChallenge rejects empty object", () => {
    expect(isValidChallenge({})).toBe(false);
  });

  it("isValidChallenge rejects challenge with empty requirements array", () => {
    const invalidChallenge = {
      id: "test-id",
      title: "Test Challenge",
      difficulty: "beginner",
      category: "web-applications",
      description: "A test challenge",
      requirements: [], // Empty - should be invalid
      hints: [],
      isCustom: false,
    };
    expect(isValidChallenge(invalidChallenge)).toBe(false);
  });

  it("isValidChallenge rejects challenge with invalid difficulty", () => {
    const invalidChallenge = {
      id: "test-id",
      title: "Test Challenge",
      difficulty: "expert", // Invalid difficulty
      category: "web-applications",
      description: "A test challenge",
      requirements: [
        { id: "r1", description: "Req 1", evaluationCriteria: "Check" },
      ],
      hints: [],
      isCustom: false,
    };
    expect(isValidChallenge(invalidChallenge)).toBe(false);
  });

  it("isValidRequirement rejects requirement with empty id", () => {
    const invalidReq = {
      id: "",
      description: "Some description",
      evaluationCriteria: "Some criteria",
    };
    expect(isValidRequirement(invalidReq)).toBe(false);
  });
});
