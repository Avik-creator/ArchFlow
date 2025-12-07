import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import type {
  Challenge,
  ChallengeRequirement,
  EvaluationResult,
  RequirementResult,
} from "@/lib/challenge-types";
import type {
  ArchitectureNode,
  ArchitectureEdge,
} from "@/lib/architecture-types";

// Request schema for validation
const evaluateRequestSchema = z.object({
  challenge: z.object({
    id: z.string(),
    title: z.string(),
    requirements: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        evaluationCriteria: z.string(),
      })
    ),
  }),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

export const maxDuration = 45;

/**
 * Builds the AI prompt for evaluating an architecture diagram against challenge requirements
 */
function buildEvaluationPrompt(
  challenge: Pick<Challenge, "id" | "title" | "requirements">,
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): string {
  const nodeDescriptions = nodes
    .map((node) => {
      const data = node.data;
      return `- ${data.label} (${data.component?.name || "Unknown"}): ${
        data.description || data.component?.description || "No description"
      }`;
    })
    .join("\n");

  const connectionDescriptions = edges
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      const sourceLabel = sourceNode?.data?.label || edge.source;
      const targetLabel = targetNode?.data?.label || edge.target;
      const edgeLabel = edge.data?.label || "connects to";
      return `- ${sourceLabel} → ${targetLabel}: ${edgeLabel}`;
    })
    .join("\n");

  const requirementsText = challenge.requirements
    .map(
      (req, i) =>
        `${i + 1}. [${req.id}] ${req.description}\n   Evaluation Criteria: ${
          req.evaluationCriteria
        }`
    )
    .join("\n");

  return `You are an expert system architecture evaluator. Analyze the following architecture diagram submission against the challenge requirements.

## Challenge: ${challenge.title}

## Requirements to Evaluate:
${requirementsText}

## Submitted Architecture:

### Components (${nodes.length} total):
${nodeDescriptions || "No components in the diagram"}

### Connections (${edges.length} total):
${connectionDescriptions || "No connections in the diagram"}

## Your Task:
Evaluate whether this architecture meets each requirement. For each requirement:
1. Determine if it PASSES or FAILS based on the evaluation criteria
2. Provide specific feedback explaining your decision
3. Reference actual components and connections from the diagram

Also provide:
- An overall score from 0-100 based on how well the architecture meets all requirements
- 2-3 suggestions for improving the architecture (even if all requirements pass)
- A brief overall feedback summary

Respond ONLY with valid JSON in this exact format:
{
  "requirementResults": [
    {
      "requirementId": "req-1",
      "passed": true,
      "feedback": "The architecture includes a Load Balancer component that distributes traffic to multiple servers."
    }
  ],
  "score": 85,
  "suggestions": [
    "Consider adding a caching layer to improve performance",
    "Add monitoring and logging components for observability"
  ],
  "overallFeedback": "Good architecture that meets most requirements. The design shows understanding of scalability patterns."
}`;
}

/**
 * Parses the AI response into a structured EvaluationResult
 */
function parseEvaluationResponse(
  responseText: string,
  challengeId: string,
  requirements: ChallengeRequirement[]
): EvaluationResult {
  // Try to extract JSON from the response
  let jsonStr = responseText;

  // Handle markdown code blocks
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and normalize the response
    const requirementResults: RequirementResult[] = requirements.map((req) => {
      const result = parsed.requirementResults?.find(
        (r: { requirementId: string }) => r.requirementId === req.id
      );
      return {
        requirementId: req.id,
        passed: result?.passed ?? false,
        feedback: result?.feedback || "Unable to evaluate this requirement",
      };
    });

    const allPassed = requirementResults.every((r) => r.passed);
    const score =
      typeof parsed.score === "number"
        ? Math.max(0, Math.min(100, parsed.score))
        : allPassed
        ? 100
        : 0;

    return {
      challengeId,
      passed: allPassed,
      score,
      requirementResults,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      overallFeedback: parsed.overallFeedback || "Evaluation complete.",
    };
  } catch {
    // If parsing fails, return a failure result
    return {
      challengeId,
      passed: false,
      score: 0,
      requirementResults: requirements.map((req) => ({
        requirementId: req.id,
        passed: false,
        feedback: "Unable to parse evaluation response",
      })),
      suggestions: ["Please try submitting again"],
      overallFeedback:
        "There was an error processing the evaluation. Please try again.",
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request
    const parseResult = evaluateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid request format", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { challenge, nodes, edges } = parseResult.data;

    // Build the evaluation prompt
    const prompt = buildEvaluationPrompt(
      challenge as Pick<Challenge, "id" | "title" | "requirements">,
      nodes as ArchitectureNode[],
      edges as ArchitectureEdge[]
    );

    // Call AI for evaluation
    const result = await generateText({
      model: groq("moonshotai/kimi-k2-instruct-0905"),
      system: `You are an expert system architecture evaluator. You analyze architecture diagrams and evaluate them against specific requirements. Always respond with valid JSON only, no additional text.`,
      prompt,
      abortSignal: req.signal,
    });

    // Parse the response
    const evaluationResult = parseEvaluationResponse(
      result.text,
      challenge.id,
      challenge.requirements
    );

    return Response.json(evaluationResult);
  } catch (error) {
    console.error("Evaluation error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return Response.json({ error: "Request was cancelled" }, { status: 499 });
    }

    return Response.json(
      {
        error: "Failed to evaluate submission",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
