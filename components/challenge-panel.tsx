"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trophy,
  Lightbulb,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import type { Challenge, Difficulty } from "@/lib/challenge-types";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface ChallengePanelProps {
  challenge: Challenge;
  revealedHints: number[];
  onRevealHint: (index: number) => void;
  onSubmit: () => void;
  onExit: () => void;
  isSubmitting?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

const difficultyConfig: Record<
  Difficulty,
  { label: string; color: string; bgColor: string }
> = {
  beginner: {
    label: "Beginner",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  intermediate: {
    label: "Intermediate",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  advanced: {
    label: "Advanced",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

interface RequirementItemProps {
  index: number;
  description: string;
}

function RequirementItem({ index, description }: RequirementItemProps) {
  return (
    <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        {index + 1}
      </span>
      <span className="text-sm text-foreground leading-relaxed">
        {description}
      </span>
    </li>
  );
}

interface HintItemProps {
  index: number;
  hint: string;
  isRevealed: boolean;
  onReveal: () => void;
}

function HintItem({ index, hint, isRevealed, onReveal }: HintItemProps) {
  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      <button
        onClick={onReveal}
        disabled={isRevealed}
        className={cn(
          "w-full flex items-center justify-between p-3 text-left transition-colors",
          isRevealed
            ? "bg-amber-500/10 cursor-default"
            : "bg-muted/30 hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-2">
          <Lightbulb
            className={cn(
              "h-4 w-4",
              isRevealed ? "text-amber-500" : "text-muted-foreground"
            )}
          />
          <span className="text-sm font-medium">Hint {index + 1}</span>
        </div>
        {isRevealed ? (
          <Eye className="h-4 w-4 text-amber-500" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isRevealed && (
        <div className="p-3 border-t border-border/40 bg-background">
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      )}
    </div>
  );
}

interface ExitConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ExitConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
}: ExitConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exit Challenge?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to exit this challenge? Your current progress
            will be lost and the canvas will be cleared.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Continue Working
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Exit Challenge
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ChallengePanel({
  challenge,
  revealedHints,
  onRevealHint,
  onSubmit,
  onExit,
  isSubmitting = false,
}: ChallengePanelProps) {
  const [showExitDialog, setShowExitDialog] = React.useState(false);
  const [requirementsExpanded, setRequirementsExpanded] = React.useState(true);
  const [hintsExpanded, setHintsExpanded] = React.useState(true);

  const config = difficultyConfig[challenge.difficulty];
  const totalHints = challenge.hints.length;
  const revealedCount = revealedHints.length;

  const handleExitClick = () => {
    setShowExitDialog(true);
  };

  const handleExitConfirm = () => {
    setShowExitDialog(false);
    onExit();
  };

  const handleExitCancel = () => {
    setShowExitDialog(false);
  };

  return (
    <>
      <div className="flex h-full w-80 lg:w-96 flex-col border-l border-border/40 bg-background/50 shrink-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Challenge Mode</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleExitClick}
            title="Exit Challenge"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Challenge Info */}
        <div className="border-b border-border/40 px-4 py-3 space-y-2 shrink-0">
          <h3 className="font-medium text-sm truncate" title={challenge.title}>
            {challenge.title}
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn("text-xs", config.color, config.bgColor)}
            >
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {challenge.description}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Requirements Section */}
              <div className="space-y-2">
                <button
                  onClick={() => setRequirementsExpanded(!requirementsExpanded)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Requirements ({challenge.requirements.length})
                    </span>
                  </div>
                  {requirementsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {requirementsExpanded && (
                  <ul className="space-y-2">
                    {challenge.requirements.map((req, index) => (
                      <RequirementItem
                        key={req.id}
                        index={index}
                        description={req.description}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {/* Hints Section */}
              {totalHints > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setHintsExpanded(!hintsExpanded)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">
                        Hints ({revealedCount}/{totalHints})
                      </span>
                    </div>
                    {hintsExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {hintsExpanded && (
                    <div className="space-y-2">
                      {challenge.hints.map((hint, index) => (
                        <HintItem
                          key={index}
                          index={index}
                          hint={hint}
                          isRevealed={revealedHints.includes(index)}
                          onReveal={() => onRevealHint(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-border/40 p-4 space-y-2 shrink-0">
          <Button
            onClick={onSubmit}
            className="w-full"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? "Submitting..." : "Submit Solution"}
          </Button>
          <Button
            onClick={handleExitClick}
            variant="outline"
            className="w-full"
            size="sm"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Exit Challenge
          </Button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <ExitConfirmationDialog
        isOpen={showExitDialog}
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
    </>
  );
}
