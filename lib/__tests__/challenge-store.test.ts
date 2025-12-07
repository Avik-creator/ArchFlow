/**
 * Property-Based Tests for Challenge Store
 *
 * Tests for challenge mode state transitions and hint reveal behavior.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { create } from "zustand";
import {
  type Challenge,
  type ChallengeRequirement,
  type Difficulty,
  type ChallengeCategory,
  DIFFICULTY_VALUES,
  CATEGORY_VALUES,
  isValidChallenge,
} from "../challenge-types";
import {
  serializeChallenge,
  deserializeChallenge,
  ChallengeSerializationError,
} from "../challenge-serialization";

// ============================================================================
// Test Store (without persistence for testing)
// ============================================================================

interface ChallengeStore {
  challenges: Challenge[];
  customChallenges: Challenge[];
  activeChallenge: Challenge | null;
  challengeMode: boolean;
  revealedHints: number[];

  setActiveChallenge: (challenge: Challenge | null) => void;
  enterChallengeMode: (challenge: Challenge) => void;
  exitChallengeMode: () => void;
  revealHint: (index: number) => void;
  addCustomChallenge: (challenge: Challenge) => void;
  deleteCustomChallenge: (id: string) => void;
  importChallenge: (json: string) => Challenge;
  exportChallenge: (id: string) => string;
}

/**
 * Create a test store without persistence middleware
 */
const createTestStore = () =>
  create<ChallengeStore>()((set, get) => ({
    challenges: [],
    customChallenges: [],
    activeChallenge: null,
    challengeMode: false,
    revealedHints: [],

    setActiveChallenge: (challenge) => {
      set({ activeChallenge: challenge });
    },

    enterChallengeMode: (challenge) => {
      set({
        challengeMode: true,
        activeChallenge: challenge,
        revealedHints: [],
      });
    },

    exitChallengeMode: () => {
      set({
        challengeMode: false,
        activeChallenge: null,
        revealedHints: [],
      });
    },

    revealHint: (index) => {
      const { revealedHints } = get();
      if (!revealedHints.includes(index)) {
        set({ revealedHints: [...revealedHints, index] });
      }
    },

    addCustomChallenge: (challenge) => {
      const customChallenge: Challenge = {
        ...challenge,
        isCustom: true,
        createdAt: challenge.createdAt ?? Date.now(),
      };

      if (!isValidChallenge(customChallenge)) {
        throw new Error("Invalid challenge structure");
      }

      set((state) => ({
        customChallenges: [...state.customChallenges, customChallenge],
      }));
    },

    deleteCustomChallenge: (id) => {
      set((state) => ({
        customChallenges: state.customChallenges.filter((c) => c.id !== id),
      }));
    },

    importChallenge: (json) => {
      const challenge = deserializeChallenge(json);

      const { customChallenges } = get();
      if (customChallenges.some((c) => c.id === challenge.id)) {
        challenge.id = `${challenge.id}-${Date.now()}`;
      }

      if (!challenge.createdAt) {
        challenge.createdAt = Date.now();
      }

      set((state) => ({
        customChallenges: [...state.customChallenges, challenge],
      }));

      return challenge;
    },

    exportChallenge: (id) => {
      const { challenges, customChallenges } = get();
      const allChallenges = [...challenges, ...customChallenges];
      const challenge = allChallenges.find((c) => c.id === id);

      if (!challenge) {
        throw new ChallengeSerializationError(
          `Challenge with id "${id}" not found`
        );
      }

      return serializeChallenge(challenge);
    },
  }));

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
 * Generator for challenges with multiple hints (for hint reveal tests)
 */
const arbitraryChallengeWithHints: fc.Arbitrary<Challenge> = fc.record({
  id: nonEmptyString,
  title: nonEmptyString,
  difficulty: arbitraryDifficulty,
  category: arbitraryCategory,
  description: fc.string(),
  requirements: fc.array(arbitraryRequirement, { minLength: 1, maxLength: 10 }),
  hints: fc.array(fc.string(), { minLength: 2, maxLength: 10 }),
  isCustom: fc.boolean(),
  createdAt: fc.option(fc.nat(), { nil: undefined }),
});

// ============================================================================
// Test Setup
// ============================================================================

let useChallengeStore: ReturnType<typeof createTestStore>;

/**
 * Create fresh store before each test
 */
beforeEach(() => {
  useChallengeStore = createTestStore();
});

// ============================================================================
// Property Tests
// ============================================================================

describe("Challenge Store - Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 7: Challenge mode state transition**
   * **Validates: Requirements 1.4**
   *
   * For any challenge, entering challenge mode should set challengeMode to true,
   * set activeChallenge to that challenge, and reset revealedHints to empty.
   */
  it("Property 7: Challenge mode state transition - entering challenge mode sets correct state", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        // Get store and enter challenge mode
        const store = useChallengeStore.getState();
        store.enterChallengeMode(challenge);

        // Get updated state
        const state = useChallengeStore.getState();

        // Verify challengeMode is true
        expect(state.challengeMode).toBe(true);

        // Verify activeChallenge is set to the challenge
        expect(state.activeChallenge).not.toBeNull();
        expect(state.activeChallenge?.id).toBe(challenge.id);
        expect(state.activeChallenge?.title).toBe(challenge.title);
        expect(state.activeChallenge?.difficulty).toBe(challenge.difficulty);
        expect(state.activeChallenge?.category).toBe(challenge.category);

        // Verify revealedHints is reset to empty
        expect(state.revealedHints).toEqual([]);

        // Reset for next iteration
        useChallengeStore.setState({
          challengeMode: false,
          activeChallenge: null,
          revealedHints: [],
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 7: Challenge mode state transition**
   * **Validates: Requirements 1.4**
   *
   * Exiting challenge mode should reset all challenge-related state.
   */
  it("Property 7: Exiting challenge mode resets state", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        // Enter challenge mode first
        const store = useChallengeStore.getState();
        store.enterChallengeMode(challenge);

        // Reveal some hints if available
        if (challenge.hints.length > 0) {
          store.revealHint(0);
        }

        // Exit challenge mode
        useChallengeStore.getState().exitChallengeMode();

        // Get updated state
        const state = useChallengeStore.getState();

        // Verify all challenge state is reset
        expect(state.challengeMode).toBe(false);
        expect(state.activeChallenge).toBeNull();
        expect(state.revealedHints).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 8: Hint reveal isolation**
   * **Validates: Requirements 2.2**
   *
   * For any challenge with multiple hints, revealing hint at index N should
   * add only index N to revealedHints without affecting other indices.
   */
  it("Property 8: Hint reveal isolation - revealing a hint only adds that index", () => {
    fc.assert(
      fc.property(
        arbitraryChallengeWithHints,
        fc.integer({ min: 0, max: 9 }),
        (challenge, hintIndex) => {
          // Ensure hintIndex is within bounds
          const validIndex = hintIndex % challenge.hints.length;

          // Enter challenge mode
          const store = useChallengeStore.getState();
          store.enterChallengeMode(challenge);

          // Get state before revealing hint
          const stateBefore = useChallengeStore.getState();
          const revealedBefore = [...stateBefore.revealedHints];

          // Reveal the hint
          useChallengeStore.getState().revealHint(validIndex);

          // Get state after revealing hint
          const stateAfter = useChallengeStore.getState();

          // Verify only the specified index was added
          expect(stateAfter.revealedHints).toContain(validIndex);
          expect(stateAfter.revealedHints.length).toBe(
            revealedBefore.length + 1
          );

          // Verify all previously revealed hints are still there
          for (const prevIndex of revealedBefore) {
            expect(stateAfter.revealedHints).toContain(prevIndex);
          }

          // Reset for next iteration
          useChallengeStore.setState({
            challengeMode: false,
            activeChallenge: null,
            revealedHints: [],
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 8: Hint reveal isolation**
   * **Validates: Requirements 2.2**
   *
   * Revealing the same hint twice should not add duplicate entries.
   */
  it("Property 8: Revealing same hint twice does not duplicate", () => {
    fc.assert(
      fc.property(
        arbitraryChallengeWithHints,
        fc.integer({ min: 0, max: 9 }),
        (challenge, hintIndex) => {
          // Ensure hintIndex is within bounds
          const validIndex = hintIndex % challenge.hints.length;

          // Enter challenge mode
          const store = useChallengeStore.getState();
          store.enterChallengeMode(challenge);

          // Reveal the same hint twice
          useChallengeStore.getState().revealHint(validIndex);
          const stateAfterFirst = useChallengeStore.getState();
          const countAfterFirst = stateAfterFirst.revealedHints.length;

          useChallengeStore.getState().revealHint(validIndex);
          const stateAfterSecond = useChallengeStore.getState();

          // Count should not increase
          expect(stateAfterSecond.revealedHints.length).toBe(countAfterFirst);

          // Should still contain the index exactly once
          const occurrences = stateAfterSecond.revealedHints.filter(
            (i) => i === validIndex
          ).length;
          expect(occurrences).toBe(1);

          // Reset for next iteration
          useChallengeStore.setState({
            challengeMode: false,
            activeChallenge: null,
            revealedHints: [],
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 8: Hint reveal isolation**
   * **Validates: Requirements 2.2**
   *
   * Revealing multiple different hints should add each index independently.
   */
  it("Property 8: Revealing multiple hints adds each independently", () => {
    fc.assert(
      fc.property(
        arbitraryChallengeWithHints,
        fc.array(fc.integer({ min: 0, max: 9 }), {
          minLength: 2,
          maxLength: 5,
        }),
        (challenge, hintIndices) => {
          // Map indices to valid range and get unique indices
          const validIndices = [
            ...new Set(hintIndices.map((i) => i % challenge.hints.length)),
          ];

          // Enter challenge mode
          const store = useChallengeStore.getState();
          store.enterChallengeMode(challenge);

          // Reveal each hint
          for (const index of validIndices) {
            useChallengeStore.getState().revealHint(index);
          }

          // Get final state
          const state = useChallengeStore.getState();

          // Verify all unique indices are revealed
          expect(state.revealedHints.length).toBe(validIndices.length);
          for (const index of validIndices) {
            expect(state.revealedHints).toContain(index);
          }

          // Reset for next iteration
          useChallengeStore.setState({
            challengeMode: false,
            activeChallenge: null,
            revealedHints: [],
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Challenge Store - Custom Challenge Persistence Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 3: Custom challenge persistence round-trip**
   * **Validates: Requirements 7.4, 7.5**
   *
   * For any custom challenge saved to the store, retrieving challenges should
   * include that challenge in the custom challenges list with all fields intact.
   */
  it("Property 3: Custom challenge persistence round-trip - added challenges are retrievable", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        // Add the challenge to the store
        const store = useChallengeStore.getState();
        store.addCustomChallenge(challenge);

        // Retrieve the custom challenges
        const state = useChallengeStore.getState();
        const retrievedChallenge = state.customChallenges.find(
          (c) => c.id === challenge.id
        );

        // Verify the challenge exists
        expect(retrievedChallenge).toBeDefined();

        // Verify all fields are preserved
        expect(retrievedChallenge?.id).toBe(challenge.id);
        expect(retrievedChallenge?.title).toBe(challenge.title);
        expect(retrievedChallenge?.difficulty).toBe(challenge.difficulty);
        expect(retrievedChallenge?.category).toBe(challenge.category);
        expect(retrievedChallenge?.description).toBe(challenge.description);
        expect(retrievedChallenge?.requirements).toEqual(
          challenge.requirements
        );
        expect(retrievedChallenge?.hints).toEqual(challenge.hints);

        // Custom challenges should always have isCustom = true
        expect(retrievedChallenge?.isCustom).toBe(true);

        // createdAt should be set
        expect(retrievedChallenge?.createdAt).toBeDefined();
        expect(typeof retrievedChallenge?.createdAt).toBe("number");

        // Reset store for next iteration
        useChallengeStore.setState({ customChallenges: [] });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 3: Custom challenge persistence round-trip**
   * **Validates: Requirements 7.4, 7.5**
   *
   * Custom challenges should be separate from built-in challenges.
   */
  it("Property 3: Custom challenges are stored separately from built-in challenges", () => {
    fc.assert(
      fc.property(
        arbitraryChallenge,
        arbitraryChallenge,
        (customChallenge, builtInChallenge) => {
          // Set up a built-in challenge (not custom)
          const builtIn: Challenge = {
            ...builtInChallenge,
            id: `builtin-${builtInChallenge.id}`,
            isCustom: false,
          };

          // Set built-in challenges directly
          useChallengeStore.setState({ challenges: [builtIn] });

          // Add a custom challenge
          const store = useChallengeStore.getState();
          store.addCustomChallenge(customChallenge);

          // Get state
          const state = useChallengeStore.getState();

          // Verify built-in and custom are in separate arrays
          expect(state.challenges.length).toBe(1);
          expect(state.customChallenges.length).toBe(1);

          // Verify built-in challenge is not in customChallenges
          expect(
            state.customChallenges.find((c) => c.id === builtIn.id)
          ).toBeUndefined();

          // Verify custom challenge is not in challenges
          expect(
            state.challenges.find((c) => c.id === customChallenge.id)
          ).toBeUndefined();

          // Reset store for next iteration
          useChallengeStore.setState({ challenges: [], customChallenges: [] });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 3: Custom challenge persistence round-trip**
   * **Validates: Requirements 7.4, 7.5**
   *
   * Multiple custom challenges can be added and all are retrievable.
   */
  it("Property 3: Multiple custom challenges are all retrievable", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 1, maxLength: 5 }),
        (challenges) => {
          // Make IDs unique
          const uniqueChallenges = challenges.map((c, i) => ({
            ...c,
            id: `${c.id}-${i}`,
          }));

          // Add all challenges
          const store = useChallengeStore.getState();
          for (const challenge of uniqueChallenges) {
            store.addCustomChallenge(challenge);
          }

          // Get state
          const state = useChallengeStore.getState();

          // Verify all challenges are stored
          expect(state.customChallenges.length).toBe(uniqueChallenges.length);

          // Verify each challenge is retrievable
          for (const original of uniqueChallenges) {
            const retrieved = state.customChallenges.find(
              (c) => c.id === original.id
            );
            expect(retrieved).toBeDefined();
            expect(retrieved?.title).toBe(original.title);
          }

          // Reset store for next iteration
          useChallengeStore.setState({ customChallenges: [] });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 3: Custom challenge persistence round-trip**
   * **Validates: Requirements 7.4, 7.5**
   *
   * Deleting a custom challenge removes only that challenge.
   */
  it("Property 3: Deleting a custom challenge removes only that challenge", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryChallenge, { minLength: 2, maxLength: 5 }),
        fc.integer({ min: 0, max: 4 }),
        (challenges, deleteIndex) => {
          // Make IDs unique
          const uniqueChallenges = challenges.map((c, i) => ({
            ...c,
            id: `${c.id}-${i}`,
          }));

          // Add all challenges
          const store = useChallengeStore.getState();
          for (const challenge of uniqueChallenges) {
            store.addCustomChallenge(challenge);
          }

          // Pick a challenge to delete
          const validIndex = deleteIndex % uniqueChallenges.length;
          const challengeToDelete = uniqueChallenges[validIndex];

          // Delete the challenge
          useChallengeStore
            .getState()
            .deleteCustomChallenge(challengeToDelete.id);

          // Get state
          const state = useChallengeStore.getState();

          // Verify the deleted challenge is gone
          expect(
            state.customChallenges.find((c) => c.id === challengeToDelete.id)
          ).toBeUndefined();

          // Verify other challenges are still there
          expect(state.customChallenges.length).toBe(
            uniqueChallenges.length - 1
          );

          for (let i = 0; i < uniqueChallenges.length; i++) {
            if (i !== validIndex) {
              expect(
                state.customChallenges.find(
                  (c) => c.id === uniqueChallenges[i].id
                )
              ).toBeDefined();
            }
          }

          // Reset store for next iteration
          useChallengeStore.setState({ customChallenges: [] });
        }
      ),
      { numRuns: 100 }
    );
  });
});
