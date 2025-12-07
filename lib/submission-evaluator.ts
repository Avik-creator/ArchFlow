/**
 * Submission Evaluator Service
 *
 * Client-side service for evaluating architecture challenge submissions
 * by calling the evaluation API endpoint.
 */

import type {
  Challenge,
  EvaluationResult,
  isValidEvaluationResult,
} from "./challenge-types";
import type { ArchitectureNode, ArchitectureEdge } from "./architecture-types";

/**
 * Error thrown when evaluation fails
 */
export class EvaluationError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

/**
 * State for tracking evaluation progress
 */
export interface EvaluationState {
  isLoading: boolean;
  error: EvaluationError | null;
  result: EvaluationResult | null;
}

/**
 * Request payload for the evaluation API
 */
interface EvaluateRequest {
  challenge: {
    id: string;
    title: string;
    requirements: Array<{
      id: string;
      description: string;
      evaluationCriteria: string;
    }>;
  };
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

/**
 * Validates that the response is a valid EvaluationResult
 */
function validateEvaluationResult(data: unknown): data is EvaluationResult {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const result = data as Record<string, unknown>;

  return (
    typeof result.challengeId === "string" &&
    typeof result.passed === "boolean" &&
    typeof result.score === "number" &&
    result.score >= 0 &&
    result.score <= 100 &&
    Array.isArray(result.requirementResults) &&
    Array.isArray(result.suggestions) &&
    typeof result.overallFeedback === "string"
  );
}

/**
 * Evaluates an architecture diagram submission against challenge requirements
 *
 * @param challenge - The challenge being attempted
 * @param nodes - The architecture nodes in the diagram
 * @param edges - The connections between nodes
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise resolving to the evaluation result
 * @throws EvaluationError if the evaluation fails
 */
export async function evaluateSubmission(
  challenge: Challenge,
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  signal?: AbortSignal
): Promise<EvaluationResult> {
  const requestBody: EvaluateRequest = {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      requirements: challenge.requirements.map((req) => ({
        id: req.id,
        description: req.description,
        evaluationCriteria: req.evaluationCriteria,
      })),
    },
    nodes,
    edges,
  };

  let response: Response;

  try {
    response = await fetch("/api/evaluate-challenge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new EvaluationError("Evaluation was cancelled", 499);
    }
    throw new EvaluationError(
      "Network error: Unable to connect to evaluation service",
      0,
      error
    );
  }

  if (!response.ok) {
    let errorMessage = "Evaluation failed";
    let errorDetails: unknown;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorBody.message || errorMessage;
      errorDetails = errorBody.details;
    } catch {
      // Ignore JSON parse errors for error response
    }

    throw new EvaluationError(errorMessage, response.status, errorDetails);
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new EvaluationError(
      "Invalid response: Unable to parse evaluation result",
      response.status
    );
  }

  if (!validateEvaluationResult(data)) {
    throw new EvaluationError(
      "Invalid response: Evaluation result format is incorrect",
      response.status,
      data
    );
  }

  return data;
}

/**
 * Creates an initial evaluation state
 */
export function createInitialEvaluationState(): EvaluationState {
  return {
    isLoading: false,
    error: null,
    result: null,
  };
}

/**
 * Creates a loading evaluation state
 */
export function createLoadingState(): EvaluationState {
  return {
    isLoading: true,
    error: null,
    result: null,
  };
}

/**
 * Creates an error evaluation state
 */
export function createErrorState(error: EvaluationError): EvaluationState {
  return {
    isLoading: false,
    error,
    result: null,
  };
}

/**
 * Creates a success evaluation state
 */
export function createSuccessState(result: EvaluationResult): EvaluationState {
  return {
    isLoading: false,
    error: null,
    result,
  };
}
