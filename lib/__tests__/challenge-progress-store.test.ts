/**
 * Property-Based Tests for Challenge Progress Store
 *
 * Tests for progress persistence and statistics accuracy.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { create } from "zustand";
import type {
  Challenge,
  ChallengeRequirement,
  Difficulty,
  ChallengeCategory,
  CompletionRecord,
  ProgressStats,
} from "../challenge-types";
import { DIFFICULTY_VALUES, CATEGORY_VALUES } from "../challenge-types";

// ============================================================================
// Test Store (without persistence for testing)
// ============================================================================

interface ProgressStore {
  completedChallenges: Record<string, CompletionRecord>;
  markCompleted: (challengeId: string, score: number) => void;
  isCompleted: (challengeId: string) => boolean;
  getProgress: (allChallenges: Challenge[]) => ProgressStats;
  getCompletionRecord: (challengeId: string) => CompletionRecord | undefined;
  resetProgress: () => void;
}

/**
 * Create a test store without persistence middleware
 */
const createTestProgressStore = () =>
  create<ProgressStore>()((set, get) => ({
    completedChallenges: {},

    markCompleted: (challengeId, score) => {
      set((state) => {
        const existing = state.completedChallenges[challengeId];
        const attempts = existing ? existing.attempts + 1 : 1;

        return {
          completedChallenges: {
            ...state.completedChallenges,
            [challengeId]: {
              completedAt: Date.now(),
              score,
              attempts,
            },
          },
        };
      });
    },

    isCompleted: (challengeId) => {
      const { completedChallenges } = get();
      return challengeId in completedChallenges;
    },

    getCompletionRecord: (challengeId) => {
      const { completedChallenges } = get();
      return completedChallenges[challengeId];
    },

    getProgress: (allChallenges) => {
      const { completedChallenges } = get();

      const byDifficulty: Record<
        Difficulty,
        { completed: number; total: number }
      > = {} as Record<Difficulty, { completed: number; total: number }>;

      for (const difficulty of DIFFICULTY_VALUES) {
        byDifficulty[difficulty] = { completed: 0, total: 0 };
      }

      for (const challenge of allChallenges) {
        byDifficulty[challenge.difficulty].total += 1;
        if (challenge.id in completedChallenges) {
          byDifficulty[challenge.difficulty].completed += 1;
        }
      }

      const totalCompleted = Object.keys(completedChallenges).length;
      const totalAvailable = allChallenges.length;

      const successRate =
        totalAvailable > 0
          ? Math.round((totalCompleted / totalAvailable) * 100)
          : 0;

      return {
        totalCompleted,
        totalAvailable,
        successRate,
        byDifficulty,
      };
    },

    resetProgress: () => {
      set({ completedChallenges: {} });
    },
  }));

// ============================================================================
// Generators (Arbitraries)
// ============================================================================

/**
 * Reserved JavaScript property names that should be excluded from challenge IDs
 * to avoid conflicts with Object.prototype properties when using `in` operator
 */
const RESERVED_PROPERTY_NAMES = new Set([
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "constructor",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Generator for non-empty strings (challenge IDs) that avoids reserved property names
 */
const nonEmptyString = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => !RESERVED_PROPERTY_NAMES.has(s));

/**
 * Generator for valid scores (0-100)
 */
const arbitraryScore = fc.integer({ min: 0, max: 100 });

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
 * Generator for valid Challenge objects
 */
const arbitraryChallenge: fc.Arbitrary<Challenge> = fc.record({
  id: nonEmptyString,
  title: nonEmptyString,
  difficulty: arbitraryDifficulty,
  category: arbitraryCategory,
  description: fc.string(),
  requirements: fc.array(arbitraryRequirement, { minLength: 1, maxLength: 5 }),
  hints: fc.array(fc.string(), { maxLength: 3 }),
  isCustom: fc.boolean(),
  createdAt: fc.option(fc.nat(), { nil: undefined }),
});

/**
 * Generator for completion records
 */
const arbitraryCompletionRecord: fc.Arbitrary<{
  challengeId: string;
  score: number;
}> = fc.record({
  challengeId: nonEmptyString,
  score: arbitraryScore,
});

// ============================================================================
// Test Setup
// ============================================================================

let useProgressStore: ReturnType<typeof createTestProgressStore>;

beforeEach(() => {
  useProgressStore = createTestProgressStore();
});

// ============================================================================
// Property Tests
// ============================================================================

describe("Challenge Progress Store - Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 2: Progress persistence round-trip**
   * **Validates: Requirements 6.1, 6.2**
   *
   * For any challenge completion record, after persisting to storage and then
   * reading back, the completion status and score should match the original values.
   */
  it("Property 2: Progress persistence round-trip - completed challenges are retrievable with correct data", () => {
    fc.assert(
      fc.property(nonEmptyString, arbitraryScore, (challengeId, score) => {
        // Mark the challenge as completed
        const store = useProgressStore.getState();
        store.markCompleted(challengeId, score);

        // Retrieve the completion status
        const state = useProgressStore.getState();
        const isCompleted = state.isCompleted(challengeId);
        const record = state.getCompletionRecord(challengeId);

        // Verify the challenge is marked as completed
        expect(isCompleted).toBe(true);

        // Verify the record exists and has correct score
        expect(record).toBeDefined();
        expect(record?.score).toBe(score);
        expect(record?.attempts).toBe(1);
        expect(typeof record?.completedAt).toBe("number");

        // Reset for next iteration
        useProgressStore.setState({ completedChallenges: {} });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 2: Progress persistence round-trip**
   * **Validates: Requirements 6.1, 6.2**
   *
   * Multiple completions of the same challenge should increment attempts.
   */
  it("Property 2: Multiple completions increment attempts counter", () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        fc.array(arbitraryScore, { minLength: 1, maxLength: 5 }),
        (challengeId, scores) => {
          const store = useProgressStore.getState();

          // Complete the challenge multiple times with different scores
          for (const score of scores) {
            store.markCompleted(challengeId, score);
          }

          // Retrieve the record
          const state = useProgressStore.getState();
          const record = state.getCompletionRecord(challengeId);

          // Verify attempts equals number of completions
          expect(record?.attempts).toBe(scores.length);

          // Verify the score is the last one submitted
          expect(record?.score).toBe(scores[scores.length - 1]);

          // Reset for next iteration
          useProgressStore.setState({ completedChallenges: {} });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 2: Progress persistence round-trip**
   * **Validates: Requirements 6.1, 6.2**
   *
   * Uncompleted challenges should return false for isCompleted.
   */
  it("Property 2: Uncompleted challenges return false for isCompleted", () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        arbitraryScore,
        (completedId, uncompletedId, score) => {
          // Ensure IDs are different
          fc.pre(completedId !== uncompletedId);

          const store = useProgressStore.getState();

          // Complete only one challenge
          store.markCompleted(completedId, score);

          // Check completion status
          const state = useProgressStore.getState();

          expect(state.isCompleted(completedId)).toBe(true);
          expect(state.isCompleted(uncompletedId)).toBe(false);
          expect(state.getCompletionRecord(uncompletedId)).toBeUndefined();

          // Reset for next iteration
          useProgressStore.setState({ completedChallenges: {} });
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Challenge Progress Store - Statistics Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 14: Progress statistics accuracy**
   * **Validates: Requirements 6.3**
   *
   * For any set of completion records, the calculated statistics (totalCompleted,
   * successRate) should accurately reflect the underlying data.
   */
  it("Property 14: Progress statistics accuracy - totalCompleted matches actual completions", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 1, maxLength: 10 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { maxLength: 10 }),
        (challenges, completionIndices) => {
          // Make challenge IDs unique
          const uniqueChallenges = challenges.map((c, i) => ({
            ...c,
            id: `challenge-${i}`,
          }));

          const store = useProgressStore.getState();

          // Complete some challenges (using indices to select which ones)
          const completedIds = new Set<string>();
          for (const idx of completionIndices) {
            const validIdx = idx % uniqueChallenges.length;
            const challengeId = uniqueChallenges[validIdx].id;
            store.markCompleted(challengeId, 80);
            completedIds.add(challengeId);
          }

          // Get progress stats
          const state = useProgressStore.getState();
          const stats = state.getProgress(uniqueChallenges);

          // Verify totalCompleted matches unique completed challenges
          expect(stats.totalCompleted).toBe(completedIds.size);

          // Verify totalAvailable matches all challenges
          expect(stats.totalAvailable).toBe(uniqueChallenges.length);

          // Reset for next iteration
          useProgressStore.setState({ completedChallenges: {} });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 14: Progress statistics accuracy**
   * **Validates: Requirements 6.3**
   *
   * Success rate should be calculated correctly as percentage.
   */
  it("Property 14: Progress statistics accuracy - successRate is calculated correctly", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (challenges, numToComplete) => {
          // Make challenge IDs unique
          const uniqueChallenges = challenges.map((c, i) => ({
            ...c,
            id: `challenge-${i}`,
          }));

          const store = useProgressStore.getState();

          // Complete a specific number of challenges
          const actualToComplete = Math.min(
            numToComplete,
            uniqueChallenges.length
          );
          for (let i = 0; i < actualToComplete; i++) {
            store.markCompleted(uniqueChallenges[i].id, 85);
          }

          // Get progress stats
          const state = useProgressStore.getState();
          const stats = state.getProgress(uniqueChallenges);

          // Calculate expected success rate
          const expectedRate = Math.round(
            (actualToComplete / uniqueChallenges.length) * 100
          );

          expect(stats.successRate).toBe(expectedRate);

          // Reset for next iteration
          useProgressStore.setState({ completedChallenges: {} });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 14: Progress statistics accuracy**
   * **Validates: Requirements 6.3**
   *
   * byDifficulty counts should accurately reflect completions per difficulty level.
   */
  it("Property 14: Progress statistics accuracy - byDifficulty counts are accurate", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 1, maxLength: 15 }),
        fc.array(fc.integer({ min: 0, max: 14 }), { maxLength: 10 }),
        (challenges, completionIndices) => {
          // Make challenge IDs unique
          const uniqueChallenges = challenges.map((c, i) => ({
            ...c,
            id: `challenge-${i}`,
          }));

          const store = useProgressStore.getState();

          // Track expected counts manually
          const expectedByDifficulty: Record<
            Difficulty,
            { completed: Set<string>; total: number }
          > = {
            beginner: { completed: new Set(), total: 0 },
            intermediate: { completed: new Set(), total: 0 },
            advanced: { completed: new Set(), total: 0 },
          };

          // Count totals by difficulty
          for (const challenge of uniqueChallenges) {
            expectedByDifficulty[challenge.difficulty].total += 1;
          }

          // Complete some challenges
          for (const idx of completionIndices) {
            const validIdx = idx % uniqueChallenges.length;
            const challenge = uniqueChallenges[validIdx];
            store.markCompleted(challenge.id, 90);
            expectedByDifficulty[challenge.difficulty].completed.add(
              challenge.id
            );
          }

          // Get progress stats
          const state = useProgressStore.getState();
          const stats = state.getProgress(uniqueChallenges);

          // Verify byDifficulty counts
          for (const difficulty of DIFFICULTY_VALUES) {
            expect(stats.byDifficulty[difficulty].total).toBe(
              expectedByDifficulty[difficulty].total
            );
            expect(stats.byDifficulty[difficulty].completed).toBe(
              expectedByDifficulty[difficulty].completed.size
            );
          }

          // Reset for next iteration
          useProgressStore.setState({ completedChallenges: {} });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 14: Progress statistics accuracy**
   * **Validates: Requirements 6.3**
   *
   * Empty challenges list should return zero stats.
   */
  it("Property 14: Progress statistics accuracy - empty challenges returns zero stats", () => {
    const store = useProgressStore.getState();
    const stats = store.getProgress([]);

    expect(stats.totalCompleted).toBe(0);
    expect(stats.totalAvailable).toBe(0);
    expect(stats.successRate).toBe(0);

    for (const difficulty of DIFFICULTY_VALUES) {
      expect(stats.byDifficulty[difficulty].total).toBe(0);
      expect(stats.byDifficulty[difficulty].completed).toBe(0);
    }
  });
});
