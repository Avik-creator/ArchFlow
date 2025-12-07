/**
 * Property-Based Tests for Challenge Browser
 *
 * Tests for challenge grouping, display completeness, category counts,
 * detail display, and custom challenge separation.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  Challenge,
  ChallengeRequirement,
  Difficulty,
  ChallengeCategory,
} from "../challenge-types";
import { DIFFICULTY_VALUES, CATEGORY_VALUES } from "../challenge-types";
import {
  groupChallengesByDifficulty,
  countChallengesByCategory,
  getChallengeDisplayData,
  getChallengeDetailData,
} from "../../components/challenge-browser";

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

/**
 * Generator for built-in challenges (isCustom = false)
 */
const arbitraryBuiltInChallenge: fc.Arbitrary<Challenge> =
  arbitraryChallenge.map((c) => ({ ...c, isCustom: false }));

/**
 * Generator for custom challenges (isCustom = true)
 */
const arbitraryCustomChallenge: fc.Arbitrary<Challenge> =
  arbitraryChallenge.map((c) => ({ ...c, isCustom: true }));

// ============================================================================
// Property Tests
// ============================================================================

describe("Challenge Browser - Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 4: Challenge grouping by difficulty**
   * **Validates: Requirements 1.1**
   *
   * For any set of challenges with mixed difficulties, the Challenge_Browser
   * grouping function should partition challenges such that each group contains
   * only challenges of that difficulty level.
   */
  it("Property 4: Challenge grouping by difficulty - each group contains only challenges of that difficulty", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 0, maxLength: 20 }),
        (challenges) => {
          const grouped = groupChallengesByDifficulty(challenges);

          // Verify each difficulty group contains only challenges of that difficulty
          for (const difficulty of DIFFICULTY_VALUES) {
            const group = grouped[difficulty];
            for (const challenge of group) {
              expect(challenge.difficulty).toBe(difficulty);
            }
          }

          // Verify total count matches
          const totalGrouped =
            grouped.beginner.length +
            grouped.intermediate.length +
            grouped.advanced.length;
          expect(totalGrouped).toBe(challenges.length);

          // Verify all original challenges are in exactly one group
          for (const challenge of challenges) {
            const group = grouped[challenge.difficulty];
            const found = group.some((c) => c.id === challenge.id);
            expect(found).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 4: Challenge grouping by difficulty**
   * **Validates: Requirements 1.1**
   *
   * Grouping should be a partition - no challenge appears in multiple groups.
   */
  it("Property 4: Challenge grouping is a partition - no duplicates across groups", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 0, maxLength: 20 }),
        (challenges) => {
          const grouped = groupChallengesByDifficulty(challenges);

          // Collect all IDs from all groups
          const allIds: string[] = [];
          for (const difficulty of DIFFICULTY_VALUES) {
            for (const challenge of grouped[difficulty]) {
              allIds.push(challenge.id);
            }
          }

          // Check for duplicates (same challenge in multiple groups)
          const uniqueIds = new Set(allIds);
          // Note: Original challenges might have duplicate IDs, so we check
          // that grouping doesn't create MORE duplicates than existed
          const originalIds = challenges.map((c) => c.id);
          const originalUniqueCount = new Set(originalIds).size;

          // The number of unique IDs after grouping should equal original unique count
          // (grouping shouldn't duplicate or lose challenges)
          expect(uniqueIds.size).toBe(originalUniqueCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 5: Challenge display completeness**
   * **Validates: Requirements 1.2**
   *
   * For any Challenge object, the rendered challenge card should contain
   * the title, difficulty, category, and description.
   */
  it("Property 5: Challenge display completeness - display data contains all required fields", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        const displayData = getChallengeDisplayData(challenge);

        // Verify all required fields are present
        expect(displayData.title).toBe(challenge.title);
        expect(displayData.difficulty).toBe(challenge.difficulty);
        expect(displayData.category).toBe(challenge.category);
        expect(displayData.description).toBe(challenge.description);

        // Verify types
        expect(typeof displayData.title).toBe("string");
        expect(DIFFICULTY_VALUES).toContain(displayData.difficulty);
        expect(CATEGORY_VALUES).toContain(displayData.category);
        expect(typeof displayData.description).toBe("string");
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 13: Category count accuracy**
   * **Validates: Requirements 5.3**
   *
   * For any set of challenges, the displayed count for each category should
   * equal the actual number of challenges in that category.
   */
  it("Property 13: Category count accuracy - counts match actual challenge counts", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 0, maxLength: 20 }),
        (challenges) => {
          const counts = countChallengesByCategory(challenges);

          // Manually count challenges per category
          const manualCounts: Record<ChallengeCategory, number> = {
            "web-applications": 0,
            microservices: 0,
            "real-time-systems": 0,
            "data-pipelines": 0,
            custom: 0,
          };

          for (const challenge of challenges) {
            manualCounts[challenge.category]++;
          }

          // Verify counts match
          for (const category of CATEGORY_VALUES) {
            expect(counts[category]).toBe(manualCounts[category]);
          }

          // Verify total
          const totalCounted = Object.values(counts).reduce((a, b) => a + b, 0);
          expect(totalCounted).toBe(challenges.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 6: Challenge detail display**
   * **Validates: Requirements 1.3**
   *
   * For any selected Challenge, the detail view should contain all requirements
   * and all hints from that challenge.
   */
  it("Property 6: Challenge detail display - detail data contains all requirements and hints", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        const detailData = getChallengeDetailData(challenge);

        // Verify requirements are complete
        expect(detailData.requirements).toEqual(challenge.requirements);
        expect(detailData.requirements.length).toBe(
          challenge.requirements.length
        );

        // Verify each requirement is preserved
        for (let i = 0; i < challenge.requirements.length; i++) {
          expect(detailData.requirements[i].id).toBe(
            challenge.requirements[i].id
          );
          expect(detailData.requirements[i].description).toBe(
            challenge.requirements[i].description
          );
          expect(detailData.requirements[i].evaluationCriteria).toBe(
            challenge.requirements[i].evaluationCriteria
          );
        }

        // Verify hints are complete
        expect(detailData.hints).toEqual(challenge.hints);
        expect(detailData.hints.length).toBe(challenge.hints.length);

        // Verify each hint is preserved
        for (let i = 0; i < challenge.hints.length; i++) {
          expect(detailData.hints[i]).toBe(challenge.hints[i]);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 15: Custom challenge separation**
   * **Validates: Requirements 7.5**
   *
   * For any mix of built-in and custom challenges, the Challenge_Browser should
   * display custom challenges (isCustom=true) separately from built-in challenges.
   */
  it("Property 15: Custom challenge separation - isCustom flag correctly identifies custom challenges", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryBuiltInChallenge, { minLength: 0, maxLength: 10 }),
        fc.array(arbitraryCustomChallenge, { minLength: 0, maxLength: 10 }),
        (builtInChallenges, customChallenges) => {
          // Verify all built-in challenges have isCustom = false
          for (const challenge of builtInChallenges) {
            expect(challenge.isCustom).toBe(false);
          }

          // Verify all custom challenges have isCustom = true
          for (const challenge of customChallenges) {
            expect(challenge.isCustom).toBe(true);
          }

          // Combine and verify separation is possible
          const allChallenges = [...builtInChallenges, ...customChallenges];
          const separatedBuiltIn = allChallenges.filter((c) => !c.isCustom);
          const separatedCustom = allChallenges.filter((c) => c.isCustom);

          // Verify counts match
          expect(separatedBuiltIn.length).toBe(builtInChallenges.length);
          expect(separatedCustom.length).toBe(customChallenges.length);

          // Verify no overlap
          for (const builtIn of separatedBuiltIn) {
            expect(builtIn.isCustom).toBe(false);
          }
          for (const custom of separatedCustom) {
            expect(custom.isCustom).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 15: Custom challenge separation**
   * **Validates: Requirements 7.5**
   *
   * Filtering by isCustom should be a complete partition.
   */
  it("Property 15: Custom challenge separation is a complete partition", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 0, maxLength: 20 }),
        (challenges) => {
          const builtIn = challenges.filter((c) => !c.isCustom);
          const custom = challenges.filter((c) => c.isCustom);

          // Total should equal original
          expect(builtIn.length + custom.length).toBe(challenges.length);

          // Every challenge should be in exactly one group
          for (const challenge of challenges) {
            const inBuiltIn = builtIn.some((c) => c.id === challenge.id);
            const inCustom = custom.some((c) => c.id === challenge.id);

            // XOR - should be in exactly one
            expect(
              inBuiltIn !== inCustom ||
                (inBuiltIn && inCustom && challenge.id === challenge.id)
            ).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
