/**
 * Challenge Serialization Utilities
 *
 * Provides functions for exporting and importing challenges as JSON.
 * Supports the ChallengeExport format with version tracking.
 *
 * Requirements: 7.6, 7.7, 8.2, 8.3
 */

import {
  type Challenge,
  type ChallengeExport,
  type ChallengeRequirement,
  isValidChallenge,
  isValidRequirement,
  DIFFICULTY_VALUES,
  CATEGORY_VALUES,
} from "./challenge-types";

// ============================================================================
// Serialization Errors
// ============================================================================

/**
 * Error thrown when challenge serialization or deserialization fails
 */
export class ChallengeSerializationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = "ChallengeSerializationError";
  }
}

// ============================================================================
// Serialization Functions
// ============================================================================

/**
 * Serializes a Challenge object to a JSON string in the ChallengeExport format.
 *
 * @param challenge - The challenge to serialize
 * @returns JSON string representation of the challenge
 * @throws ChallengeSerializationError if the challenge is invalid
 */
export function serializeChallenge(challenge: Challenge): string {
  if (!isValidChallenge(challenge)) {
    throw new ChallengeSerializationError(
      "Cannot serialize invalid challenge object"
    );
  }

  // Create export format, omitting isCustom as per ChallengeExport type
  const { isCustom, ...challengeWithoutCustom } = challenge;

  const exportData: ChallengeExport = {
    version: "1.0",
    challenge: challengeWithoutCustom,
  };

  return JSON.stringify(exportData, null, 2);
}

// ============================================================================
// Deserialization Functions
// ============================================================================

/**
 * Validates the structure of a ChallengeExport object
 */
function isValidChallengeExport(obj: unknown): obj is ChallengeExport {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const exportData = obj as Record<string, unknown>;

  // Check version
  if (exportData.version !== "1.0") {
    return false;
  }

  // Check challenge exists
  if (
    typeof exportData.challenge !== "object" ||
    exportData.challenge === null
  ) {
    return false;
  }

  return true;
}

/**
 * Validates and extracts a challenge from parsed JSON data.
 * Performs detailed field validation and returns specific error messages.
 */
function validateChallengeData(data: Record<string, unknown>): Challenge {
  // Validate id
  if (typeof data.id !== "string" || data.id.length === 0) {
    throw new ChallengeSerializationError(
      "Challenge id must be a non-empty string",
      "id"
    );
  }

  // Validate title
  if (typeof data.title !== "string" || data.title.length === 0) {
    throw new ChallengeSerializationError(
      "Challenge title must be a non-empty string",
      "title"
    );
  }

  // Validate difficulty
  if (
    !DIFFICULTY_VALUES.includes(
      data.difficulty as (typeof DIFFICULTY_VALUES)[number]
    )
  ) {
    throw new ChallengeSerializationError(
      `Challenge difficulty must be one of: ${DIFFICULTY_VALUES.join(", ")}`,
      "difficulty"
    );
  }

  // Validate category
  if (
    !CATEGORY_VALUES.includes(data.category as (typeof CATEGORY_VALUES)[number])
  ) {
    throw new ChallengeSerializationError(
      `Challenge category must be one of: ${CATEGORY_VALUES.join(", ")}`,
      "category"
    );
  }

  // Validate description
  if (typeof data.description !== "string") {
    throw new ChallengeSerializationError(
      "Challenge description must be a string",
      "description"
    );
  }

  // Validate requirements
  if (!Array.isArray(data.requirements) || data.requirements.length === 0) {
    throw new ChallengeSerializationError(
      "Challenge requirements must be a non-empty array",
      "requirements"
    );
  }

  // Validate each requirement
  const requirements: ChallengeRequirement[] = [];
  for (let i = 0; i < data.requirements.length; i++) {
    const req = data.requirements[i];
    if (!isValidRequirement(req)) {
      throw new ChallengeSerializationError(
        `Invalid requirement at index ${i}: must have id (non-empty string), description (string), and evaluationCriteria (string)`,
        `requirements[${i}]`
      );
    }
    requirements.push(req as ChallengeRequirement);
  }

  // Validate hints
  if (!Array.isArray(data.hints)) {
    throw new ChallengeSerializationError(
      "Challenge hints must be an array",
      "hints"
    );
  }

  // Ensure all hints are strings
  for (let i = 0; i < data.hints.length; i++) {
    if (typeof data.hints[i] !== "string") {
      throw new ChallengeSerializationError(
        `Hint at index ${i} must be a string`,
        `hints[${i}]`
      );
    }
  }

  // Validate optional createdAt
  if (data.createdAt !== undefined && typeof data.createdAt !== "number") {
    throw new ChallengeSerializationError(
      "Challenge createdAt must be a number if provided",
      "createdAt"
    );
  }

  // Build the challenge object - imported challenges are marked as custom
  const challenge: Challenge = {
    id: data.id,
    title: data.title,
    difficulty: data.difficulty as Challenge["difficulty"],
    category: data.category as Challenge["category"],
    description: data.description,
    requirements,
    hints: data.hints as string[],
    isCustom: true, // Imported challenges are always marked as custom
    createdAt: data.createdAt as number | undefined,
  };

  return challenge;
}

/**
 * Deserializes a JSON string to a Challenge object.
 *
 * @param json - JSON string in ChallengeExport format
 * @returns The deserialized Challenge object (with isCustom set to true)
 * @throws ChallengeSerializationError if JSON is invalid or missing required fields
 */
export function deserializeChallenge(json: string): Challenge {
  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ChallengeSerializationError("Invalid JSON format");
  }

  // Validate export structure
  if (!isValidChallengeExport(parsed)) {
    throw new ChallengeSerializationError(
      "Invalid challenge export format: must have version '1.0' and challenge object"
    );
  }

  // Validate and extract challenge data
  const challengeData = parsed.challenge as Record<string, unknown>;
  return validateChallengeData(challengeData);
}
