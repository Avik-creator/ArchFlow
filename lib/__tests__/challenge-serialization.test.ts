/**
 * Property-Based Tests for Challenge Serialization
 *
 * **Feature: architecture-challenges, Property 1: Challenge serialization round-trip**
 * **Validates: Requirements 7.6, 7.7, 8.2, 8.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  type Challenge,
  type ChallengeRequirement,
  type Difficulty,
  type ChallengeCategory,
  DIFFICULTY_VALUES,
  CATEGORY_VALUES,
} from "../challenge-types";
import {
  serializeChallenge,
  deserializeChallenge,
  ChallengeSerializationError,
} from "../challenge-serialization";

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

describe("Challenge Serialization - Property Tests", () => {
  /**
   * **Feature: architecture-challenges, Property 1: Challenge serialization round-trip**
   * **Validates: Requirements 7.6, 7.7, 8.2, 8.3**
   *
   * For any valid Challenge object, serializing to JSON and then deserializing
   * should produce an equivalent Challenge object with all fields preserved.
   */
  it("Property 1: Challenge serialization round-trip preserves all fields", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (originalChallenge) => {
        // Serialize the challenge
        const json = serializeChallenge(originalChallenge);

        // Deserialize back to a Challenge
        const deserializedChallenge = deserializeChallenge(json);

        // Verify all fields are preserved (except isCustom which becomes true on import)
        expect(deserializedChallenge.id).toBe(originalChallenge.id);
        expect(deserializedChallenge.title).toBe(originalChallenge.title);
        expect(deserializedChallenge.difficulty).toBe(
          originalChallenge.difficulty
        );
        expect(deserializedChallenge.category).toBe(originalChallenge.category);
        expect(deserializedChallenge.description).toBe(
          originalChallenge.description
        );
        expect(deserializedChallenge.requirements).toEqual(
          originalChallenge.requirements
        );
        expect(deserializedChallenge.hints).toEqual(originalChallenge.hints);
        expect(deserializedChallenge.createdAt).toBe(
          originalChallenge.createdAt
        );

        // isCustom is always true for imported challenges
        expect(deserializedChallenge.isCustom).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 1: Challenge serialization round-trip**
   * **Validates: Requirements 7.6, 7.7, 8.2, 8.3**
   *
   * Serialization should produce valid JSON that can be parsed.
   */
  it("Property 1: Serialization produces valid JSON", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (challenge) => {
        const json = serializeChallenge(challenge);

        // Should not throw when parsing
        const parsed = JSON.parse(json);

        // Should have the expected structure
        expect(parsed.version).toBe("1.0");
        expect(parsed.challenge).toBeDefined();
        expect(parsed.challenge.id).toBe(challenge.id);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: architecture-challenges, Property 1: Challenge serialization round-trip**
   * **Validates: Requirements 7.6, 7.7, 8.2, 8.3**
   *
   * Requirements array should be preserved exactly through round-trip.
   */
  it("Property 1: Requirements are preserved through round-trip", () => {
    fc.assert(
      fc.property(arbitraryChallenge, (originalChallenge) => {
        const json = serializeChallenge(originalChallenge);
        const deserialized = deserializeChallenge(json);

        // Same number of requirements
        expect(deserialized.requirements.length).toBe(
          originalChallenge.requirements.length
        );

        // Each requirement matches
        for (let i = 0; i < originalChallenge.requirements.length; i++) {
          expect(deserialized.requirements[i].id).toBe(
            originalChallenge.requirements[i].id
          );
          expect(deserialized.requirements[i].description).toBe(
            originalChallenge.requirements[i].description
          );
          expect(deserialized.requirements[i].evaluationCriteria).toBe(
            originalChallenge.requirements[i].evaluationCriteria
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe("Challenge Serialization - Error Handling", () => {
  it("deserializeChallenge throws on invalid JSON", () => {
    expect(() => deserializeChallenge("not valid json")).toThrow(
      ChallengeSerializationError
    );
  });

  it("deserializeChallenge throws on missing version", () => {
    const invalidExport = JSON.stringify({ challenge: { id: "test" } });
    expect(() => deserializeChallenge(invalidExport)).toThrow(
      ChallengeSerializationError
    );
  });

  it("deserializeChallenge throws on wrong version", () => {
    const invalidExport = JSON.stringify({
      version: "2.0",
      challenge: { id: "test" },
    });
    expect(() => deserializeChallenge(invalidExport)).toThrow(
      ChallengeSerializationError
    );
  });

  it("deserializeChallenge throws on missing required fields", () => {
    const invalidExport = JSON.stringify({
      version: "1.0",
      challenge: { id: "test" }, // Missing other required fields
    });
    expect(() => deserializeChallenge(invalidExport)).toThrow(
      ChallengeSerializationError
    );
  });

  it("deserializeChallenge throws on empty requirements array", () => {
    const invalidExport = JSON.stringify({
      version: "1.0",
      challenge: {
        id: "test",
        title: "Test",
        difficulty: "beginner",
        category: "web-applications",
        description: "Test",
        requirements: [],
        hints: [],
      },
    });
    expect(() => deserializeChallenge(invalidExport)).toThrow(
      ChallengeSerializationError
    );
  });

  it("deserializeChallenge throws on invalid difficulty", () => {
    const invalidExport = JSON.stringify({
      version: "1.0",
      challenge: {
        id: "test",
        title: "Test",
        difficulty: "expert", // Invalid
        category: "web-applications",
        description: "Test",
        requirements: [
          { id: "r1", description: "Req", evaluationCriteria: "Check" },
        ],
        hints: [],
      },
    });
    expect(() => deserializeChallenge(invalidExport)).toThrow(
      ChallengeSerializationError
    );
  });

  it("deserializeChallenge throws on invalid category", () => {
    const invalidExport = JSON.stringify({
      version: "1.0",
      challenge: {
        id: "test",
        title: "Test",
        difficulty: "beginner",
        category: "invalid-category", // Invalid
        description: "Test",
        requirements: [
          { id: "r1", description: "Req", evaluationCriteria: "Check" },
        ],
        hints: [],
      },
    });
    expect(() => deserializeChallenge(invalidExport)).toThrow(
      ChallengeSerializationError
    );
  });
});
