/**
 * Challenge Progress Store
 *
 * Zustand store for tracking user progress across challenges.
 * Persists completion records to localStorage and calculates statistics.
 *
 * Requirements: 6.1, 6.2, 6.3
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Difficulty,
  CompletionRecord,
  ProgressStats,
  Challenge,
} from "./challenge-types";
import { DIFFICULTY_VALUES } from "./challenge-types";

// ============================================================================
// Store Interface
// ============================================================================

interface ProgressStore {
  // State
  completedChallenges: Record<string, CompletionRecord>;

  // Actions
  markCompleted: (challengeId: string, score: number) => void;
  isCompleted: (challengeId: string) => boolean;
  getProgress: (allChallenges: Challenge[]) => ProgressStats;
  getCompletionRecord: (challengeId: string) => CompletionRecord | undefined;
  resetProgress: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      // Initial State
      completedChallenges: {},

      /**
       * Marks a challenge as completed with the given score.
       * If already completed, increments the attempts counter.
       * Requirements: 6.1
       */
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

      /**
       * Checks if a challenge has been completed.
       * Requirements: 6.2
       */
      isCompleted: (challengeId) => {
        const { completedChallenges } = get();
        return challengeId in completedChallenges;
      },

      /**
       * Gets the completion record for a specific challenge.
       */
      getCompletionRecord: (challengeId) => {
        const { completedChallenges } = get();
        return completedChallenges[challengeId];
      },

      /**
       * Calculates progress statistics based on all available challenges.
       * Requirements: 6.3
       */
      getProgress: (allChallenges) => {
        const { completedChallenges } = get();

        // Only count completions for challenges that still exist
        const availableIds = new Set(allChallenges.map((c) => c.id));
        const filteredCompletedEntries = Object.entries(completedChallenges).filter(
          ([id]) => availableIds.has(id)
        );
        const filteredCompleted = Object.fromEntries(filteredCompletedEntries);

        // Initialize byDifficulty with all difficulty levels
        const byDifficulty: Record<
          Difficulty,
          { completed: number; total: number }
        > = {} as Record<Difficulty, { completed: number; total: number }>;

        for (const difficulty of DIFFICULTY_VALUES) {
          byDifficulty[difficulty] = { completed: 0, total: 0 };
        }

        // Count challenges by difficulty
        for (const challenge of allChallenges) {
          byDifficulty[challenge.difficulty].total += 1;
          if (challenge.id in filteredCompleted) {
            byDifficulty[challenge.difficulty].completed += 1;
          }
        }

        const totalCompleted = filteredCompletedEntries.length;
        const totalAvailable = allChallenges.length;

        // Calculate success rate (percentage of available challenges completed)
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

      /**
       * Resets all progress (useful for testing or user-initiated reset)
       */
      resetProgress: () => {
        set({ completedChallenges: {} });
      },
    }),
    {
      name: "archflow-challenge-progress",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
