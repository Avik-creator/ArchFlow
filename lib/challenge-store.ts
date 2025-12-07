/**
 * Challenge Store
 *
 * Zustand store managing challenge state with localStorage persistence.
 * Handles challenge mode, active challenges, hints, and custom challenges.
 *
 * Requirements: 1.4, 2.1, 2.2, 7.2, 7.3, 7.4, 7.6, 7.7
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Challenge } from "./challenge-types";
import { isValidChallenge } from "./challenge-types";
import {
  serializeChallenge,
  deserializeChallenge,
  ChallengeSerializationError,
} from "./challenge-serialization";
import { predefinedChallenges } from "./challenge-definitions";

// ============================================================================
// Store Interface
// ============================================================================

interface ChallengeStore {
  // State
  challenges: Challenge[];
  customChallenges: Challenge[];
  activeChallenge: Challenge | null;
  challengeMode: boolean;
  revealedHints: number[];

  // Basic Actions
  setActiveChallenge: (challenge: Challenge | null) => void;
  enterChallengeMode: (challenge: Challenge) => void;
  exitChallengeMode: () => void;
  revealHint: (index: number) => void;

  // Custom Challenge CRUD
  addCustomChallenge: (challenge: Challenge) => void;
  deleteCustomChallenge: (id: string) => void;
  importChallenge: (json: string) => Challenge;
  exportChallenge: (id: string) => string;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      // Initial State
      challenges: predefinedChallenges,
      customChallenges: [],
      activeChallenge: null,
      challengeMode: false,
      revealedHints: [],

      // Basic Actions

      /**
       * Sets the active challenge without entering challenge mode
       */
      setActiveChallenge: (challenge) => {
        set({ activeChallenge: challenge });
      },

      /**
       * Enters challenge mode with the specified challenge.
       * Sets challengeMode to true, sets activeChallenge, and resets revealedHints.
       * Note: Canvas clearing is handled by the component that calls this action.
       */
      enterChallengeMode: (challenge) => {
        set({
          challengeMode: true,
          activeChallenge: challenge,
          revealedHints: [],
        });
      },

      /**
       * Exits challenge mode and clears active challenge state
       */
      exitChallengeMode: () => {
        set({
          challengeMode: false,
          activeChallenge: null,
          revealedHints: [],
        });
      },

      /**
       * Reveals a hint at the specified index.
       * Only adds the index if it's not already revealed.
       */
      revealHint: (index) => {
        const { revealedHints } = get();
        if (!revealedHints.includes(index)) {
          set({ revealedHints: [...revealedHints, index] });
        }
      },

      // Custom Challenge CRUD

      /**
       * Adds a custom challenge to the store.
       * Validates the challenge and marks it as custom.
       */
      addCustomChallenge: (challenge) => {
        // Ensure the challenge is marked as custom
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

      /**
       * Deletes a custom challenge by ID
       */
      deleteCustomChallenge: (id) => {
        set((state) => ({
          customChallenges: state.customChallenges.filter((c) => c.id !== id),
        }));
      },

      /**
       * Imports a challenge from JSON string.
       * Returns the imported challenge and adds it to customChallenges.
       */
      importChallenge: (json) => {
        const challenge = deserializeChallenge(json);

        // Check for duplicate ID
        const { customChallenges } = get();
        if (customChallenges.some((c) => c.id === challenge.id)) {
          // Generate a new unique ID to avoid conflicts
          challenge.id = `${challenge.id}-${Date.now()}`;
        }

        // Ensure createdAt is set
        if (!challenge.createdAt) {
          challenge.createdAt = Date.now();
        }

        set((state) => ({
          customChallenges: [...state.customChallenges, challenge],
        }));

        return challenge;
      },

      /**
       * Exports a challenge by ID to JSON string.
       * Can export both built-in and custom challenges.
       */
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
    }),
    {
      name: "archflow-challenges",
      storage: createJSONStorage(() => localStorage),
      // Only persist custom challenges - built-in challenges are loaded from definitions
      partialize: (state) => ({
        customChallenges: state.customChallenges,
      }),
    }
  )
);
