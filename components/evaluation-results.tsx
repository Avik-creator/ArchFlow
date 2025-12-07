"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  RefreshCw,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import type {
  EvaluationResult,
  RequirementResult,
} from "@/lib/challenge-types";
import { cn } from "@/lib/utils";
import { ConfettiAnimation } from "@/components/confetti-animation";

// ============================================================================
// Types
// ============================================================================

export interface EvaluationResultsProps {
  result: EvaluationResult;
  isOpen: boolean;
  onTryAgain: () => void;
  onNextChallenge: () => void;
  onClose: () => void;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ScoreDisplayProps {
  score: number;
  passed: boolean;
}

function ScoreDisplay({ score, passed }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div
        className={cn(
          "relative flex h-28 w-28 items-center justify-center rounded-full border-4 shadow-lg",
          passed
            ? "border-green-500 bg-gradient-to-br from-green-500/20 to-green-600/10"
            : "border-amber-500 bg-gradient-to-br from-amber-500/20 to-amber-600/10"
        )}
      >
        <div className="flex flex-col items-center">
          <span
            className={cn(
              "text-4xl font-bold leading-none",
              passed
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            {score}
          </span>
          <span
            className={cn(
              "text-sm font-medium mt-1",
              passed
                ? "text-green-600/70 dark:text-green-400/70"
                : "text-amber-600/70 dark:text-amber-400/70"
            )}
          >
            / 100
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {passed ? (
          <>
            <Trophy className="h-6 w-6 text-green-500" />
            <span className="text-xl font-bold text-green-600 dark:text-green-400">
              Challenge Complete!
            </span>
          </>
        ) : (
          <>
            <RefreshCw className="h-6 w-6 text-amber-500" />
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
              Keep Going!
            </span>
          </>
        )}
      </div>
    </div>
  );
}

interface RequirementResultItemProps {
  result: RequirementResult;
  index: number;
}

function RequirementResultItem({ result, index }: RequirementResultItemProps) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 shadow-sm transition-all",
        result.passed
          ? "border-green-200/60 bg-gradient-to-br from-green-50 to-green-100/50 dark:border-green-800/60 dark:from-green-950/40 dark:to-green-900/20"
          : "border-red-200/60 bg-gradient-to-br from-red-50 to-red-100/50 dark:border-red-800/60 dark:from-red-950/40 dark:to-red-900/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {result.passed ? (
            <div className="rounded-full bg-green-500/10 p-1">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="rounded-full bg-red-500/10 p-1">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              Requirement {index + 1}
            </span>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-medium px-2 py-0.5",
                result.passed
                  ? "bg-green-500/20 text-green-700 border border-green-300/50 dark:bg-green-500/10 dark:text-green-300 dark:border-green-700/50"
                  : "bg-red-500/20 text-red-700 border border-red-300/50 dark:bg-red-500/10 dark:text-red-300 dark:border-red-700/50"
              )}
            >
              {result.passed ? "Passed" : "Failed"}
            </Badge>
          </div>
          {result.feedback && (
            <p
              className={cn(
                "text-sm leading-relaxed",
                result.passed
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              )}
            >
              {result.feedback}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SuggestionsListProps {
  suggestions: string[];
}

function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-amber-500/10 p-1.5">
          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          Suggestions for Improvement
        </span>
      </div>
      <ul className="space-y-2.5">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-100/30 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-800/60 dark:from-amber-950/40 dark:to-amber-900/20 dark:text-amber-100"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {index + 1}
            </span>
            <span className="leading-relaxed pt-0.5">{suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EvaluationResults({
  result,
  isOpen,
  onTryAgain,
  onNextChallenge,
  onClose,
}: EvaluationResultsProps) {
  const passedCount = result.requirementResults.filter((r) => r.passed).length;
  const totalCount = result.requirementResults.length;

  // Trigger confetti when the dialog is open and the challenge passed
  const shouldShowConfetti = isOpen && result.passed;

  return (
    <>
      {/* Confetti Animation - triggers on successful challenge completion */}
      <ConfettiAnimation trigger={shouldShowConfetti} />

      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:w-[540px] flex flex-col p-0 gap-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-5 shrink-0 border-b bg-gradient-to-b from-background to-muted/30">
            <SheetTitle className="flex items-center gap-2.5 text-xl">
              {result.passed ? (
                <div className="rounded-full bg-green-500/10 p-1.5">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-500/10 p-1.5">
                  <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              Evaluation Results
            </SheetTitle>
            <SheetDescription className="text-sm mt-1.5">
              {passedCount} of {totalCount} requirements passed
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 space-y-6 pb-6 pt-6">
                {/* Score Display */}
                <ScoreDisplay score={result.score} passed={result.passed} />

                {/* Overall Feedback */}
                {result.overallFeedback && (
                  <div className="rounded-xl border bg-gradient-to-br from-muted/80 to-muted/40 p-5 shadow-sm">
                    <p className="text-sm leading-relaxed text-foreground">
                      {result.overallFeedback}
                    </p>
                  </div>
                )}

                {/* Requirement Results */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      Requirements ({passedCount}/{totalCount} passed)
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {result.requirementResults.map((reqResult, index) => (
                      <RequirementResultItem
                        key={reqResult.requirementId}
                        result={reqResult}
                        index={index}
                      />
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                {result.suggestions.length > 0 && (
                  <SuggestionsList suggestions={result.suggestions} />
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row px-6 py-5 border-t bg-background shrink-0">
            <Button
              variant="outline"
              onClick={onTryAgain}
              className="w-full sm:flex-1 h-11 text-base font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {result.passed && (
              <Button
                onClick={onNextChallenge}
                className="w-full sm:flex-1 h-11 text-base font-medium bg-primary hover:bg-primary/90"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Next Challenge
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
