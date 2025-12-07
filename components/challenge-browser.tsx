"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  User,
  Plus,
  Pencil,
  Trash,
} from "lucide-react";
import { useChallengeStore } from "@/lib/challenge-store";
import { useProgressStore } from "@/lib/challenge-progress-store";
import type {
  Challenge,
  Difficulty,
  ChallengeCategory,
} from "@/lib/challenge-types";
import { cn } from "@/lib/utils";
import { ChallengeCreator } from "./challenge-creator";

// ============================================================================
// Types
// ============================================================================

export interface ChallengeBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChallenge: (challenge: Challenge) => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Groups challenges by difficulty level.
 * Returns a record with difficulty as key and array of challenges as value.
 */
export function groupChallengesByDifficulty(
  challenges: Challenge[]
): Record<Difficulty, Challenge[]> {
  const grouped: Record<Difficulty, Challenge[]> = {
    beginner: [],
    intermediate: [],
    advanced: [],
  };

  for (const challenge of challenges) {
    grouped[challenge.difficulty].push(challenge);
  }

  return grouped;
}

/**
 * Counts challenges by category.
 * Returns a record with category as key and count as value.
 */
export function countChallengesByCategory(
  challenges: Challenge[]
): Record<ChallengeCategory, number> {
  const counts: Record<ChallengeCategory, number> = {
    "web-applications": 0,
    microservices: 0,
    "real-time-systems": 0,
    "data-pipelines": 0,
    custom: 0,
  };

  for (const challenge of challenges) {
    counts[challenge.category]++;
  }

  return counts;
}

/**
 * Extracts display data from a challenge for rendering.
 * Returns an object containing title, difficulty, category, and description.
 */
export function getChallengeDisplayData(challenge: Challenge): {
  title: string;
  difficulty: Difficulty;
  category: ChallengeCategory;
  description: string;
} {
  return {
    title: challenge.title,
    difficulty: challenge.difficulty,
    category: challenge.category,
    description: challenge.description,
  };
}

/**
 * Extracts detail data from a challenge for the detail view.
 * Returns an object containing all requirements and hints.
 */
export function getChallengeDetailData(challenge: Challenge): {
  requirements: Challenge["requirements"];
  hints: Challenge["hints"];
} {
  return {
    requirements: challenge.requirements,
    hints: challenge.hints,
  };
}

// ============================================================================
// Sub-Components
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

const categoryLabels: Record<ChallengeCategory, string> = {
  "web-applications": "Web Applications",
  microservices: "Microservices",
  "real-time-systems": "Real-Time Systems",
  "data-pipelines": "Data Pipelines",
  custom: "Custom",
};

interface ChallengeCardProps {
  challenge: Challenge;
  isCompleted: boolean;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function ChallengeCard({
  challenge,
  isCompleted,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: ChallengeCardProps) {
  const display = getChallengeDisplayData(challenge);
  const config = difficultyConfig[display.difficulty];
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected && "border-primary bg-accent",
        !isSelected && "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{display.title}</h4>
            {isCompleted && (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {display.description}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit challenge"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete challenge"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
          {!onEdit && !onDelete && (
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Badge
          variant="secondary"
          className={cn("text-xs", config.color, config.bgColor)}
        >
          {config.label}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {categoryLabels[display.category]}
        </Badge>
      </div>
    </div>
  );
}

interface ChallengeDetailProps {
  challenge: Challenge;
  isCompleted: boolean;
  onStart: () => void;
}

function ChallengeDetail({
  challenge,
  isCompleted,
  onStart,
}: ChallengeDetailProps) {
  const detail = getChallengeDetailData(challenge);
  const display = getChallengeDisplayData(challenge);
  const config = difficultyConfig[display.difficulty];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{display.title}</h3>
              {isCompleted && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="secondary"
                className={cn("text-xs", config.color, config.bgColor)}
              >
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {categoryLabels[display.category]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {display.description}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Requirements ({detail.requirements.length})
            </h4>
            <ul className="space-y-2">
              {detail.requirements.map((req, index) => (
                <li
                  key={req.id}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="font-medium text-foreground shrink-0">
                    {index + 1}.
                  </span>
                  {req.description}
                </li>
              ))}
            </ul>
          </div>

          {detail.hints.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Hints Available ({detail.hints.length})
              </h4>
              <p className="text-sm text-muted-foreground">
                Hints will be available during the challenge. Use them if you
                get stuck!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t mt-4">
        <Button onClick={onStart} className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          {isCompleted ? "Try Again" : "Start Challenge"}
        </Button>
      </div>
    </div>
  );
}

interface ProgressStatsProps {
  totalCompleted: number;
  totalAvailable: number;
  successRate: number;
  byDifficulty: Record<Difficulty, { completed: number; total: number }>;
}

function ProgressStats({
  totalCompleted,
  totalAvailable,
  successRate,
  byDifficulty,
}: ProgressStatsProps) {
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Overall Progress</span>
        <span className="text-sm text-muted-foreground">
          {totalCompleted} / {totalAvailable} completed
        </span>
      </div>
      <Progress value={successRate} className="h-2" />
      <div className="grid grid-cols-3 gap-2 text-center">
        {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(
          (diff) => {
            const stats = byDifficulty[diff];
            const config = difficultyConfig[diff];
            return (
              <div key={diff} className="space-y-1">
                <div className={cn("text-xs font-medium", config.color)}>
                  {config.label}
                </div>
                <div className="text-sm">
                  {stats.completed}/{stats.total}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

interface CategoryCountsProps {
  counts: Record<ChallengeCategory, number>;
}

function CategoryCounts({ counts }: CategoryCountsProps) {
  const nonZeroCategories = Object.entries(counts).filter(
    ([, count]) => count > 0
  );

  if (nonZeroCategories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {nonZeroCategories.map(([category, count]) => (
        <Badge key={category} variant="outline" className="text-xs">
          {categoryLabels[category as ChallengeCategory]}: {count}
        </Badge>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ChallengeBrowser({
  isOpen,
  onClose,
  onSelectChallenge,
}: ChallengeBrowserProps) {
  const {
    challenges,
    customChallenges,
    addCustomChallenge,
    updateCustomChallenge,
    deleteCustomChallenge,
  } = useChallengeStore();
  const { isCompleted, getProgress } = useProgressStore();

  const [selectedChallenge, setSelectedChallenge] =
    React.useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [isCreatorOpen, setIsCreatorOpen] = React.useState(false);
  const [editingChallenge, setEditingChallenge] =
    React.useState<Challenge | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Challenge | null>(
    null
  );

  // Combine all challenges for progress calculation
  const allChallenges = React.useMemo(
    () => [...challenges, ...customChallenges],
    [challenges, customChallenges]
  );

  // Get progress stats
  const progressStats = React.useMemo(
    () => getProgress(allChallenges),
    [getProgress, allChallenges]
  );

  // Group built-in challenges by difficulty
  const groupedChallenges = React.useMemo(
    () => groupChallengesByDifficulty(challenges),
    [challenges]
  );

  // Count challenges by category
  const categoryCounts = React.useMemo(
    () => countChallengesByCategory(allChallenges),
    [allChallenges]
  );

  // Reset selection when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedChallenge(null);
    }
  }, [isOpen]);

  const handleStartChallenge = () => {
    if (selectedChallenge) {
      onSelectChallenge(selectedChallenge);
      onClose();
    }
  };

  const handleOpenCreator = () => {
    setActiveTab("my");
    setIsCreatorOpen(true);
    setEditingChallenge(null);
  };

  const handleSaveCustomChallenge = (challenge: Challenge) => {
    if (editingChallenge) {
      updateCustomChallenge(challenge);
    } else {
      addCustomChallenge(challenge);
    }
    setActiveTab("my");
    setSelectedChallenge(challenge);
    setEditingChallenge(null);
  };

  const handleEditCustomChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setIsCreatorOpen(true);
    setActiveTab("my");
  };

  const handleDeleteCustomChallenge = (challenge: Challenge) => {
    setPendingDelete(challenge);
  };

  const renderChallengeList = (challengeList: Challenge[]) => (
    <div className="space-y-2">
      {challengeList.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          isCompleted={isCompleted(challenge.id)}
          isSelected={selectedChallenge?.id === challenge.id}
          onClick={() => setSelectedChallenge(challenge)}
          onEdit={
            challenge.isCustom
              ? () => handleEditCustomChallenge(challenge)
              : undefined
          }
          onDelete={
            challenge.isCustom
              ? () => handleDeleteCustomChallenge(challenge)
              : undefined
          }
        />
      ))}
    </div>
  );

  const renderDifficultySection = (difficulty: Difficulty) => {
    const challengeList = groupedChallenges[difficulty];
    const config = difficultyConfig[difficulty];

    if (challengeList.length === 0) return null;

    return (
      <div key={difficulty} className="space-y-2">
        <h3 className={cn("text-sm font-medium", config.color)}>
          {config.label} ({challengeList.length})
        </h3>
        {renderChallengeList(challengeList)}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl sm:max-w-6xl h-[82vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Architecture Challenges
              </DialogTitle>
              <DialogDescription>
                Practice your system design skills with guided challenges
              </DialogDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleOpenCreator}>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Challenge
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel - Challenge List */}
          <div className="w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r flex flex-col bg-muted/20 min-h-0">
            <div className="p-4 lg:p-5 border-b">
              <ProgressStats {...progressStats} />
            </div>

            <div className="p-4 lg:p-5 border-b">
              <CategoryCounts counts={categoryCounts} />
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-4 lg:px-5 pt-2 pb-1">
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1 text-sm">
                    All Challenges
                  </TabsTrigger>
                  <TabsTrigger value="my" className="flex-1 text-sm">
                    <User className="h-3 w-3 mr-1" />
                    My Challenges
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 min-h-0 px-4 lg:px-5 pb-4">
                <TabsContent value="all" className="mt-0 space-y-4">
                  {(
                    ["beginner", "intermediate", "advanced"] as Difficulty[]
                  ).map(renderDifficultySection)}
                </TabsContent>

                <TabsContent value="my" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">
                      Your Custom Challenges
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleOpenCreator}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Button>
                  </div>
                  {customChallenges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No custom challenges yet</p>
                      <p className="text-sm">
                        Create your own challenges to practice specific
                        scenarios
                      </p>
                      <div className="mt-4">
                        <Button size="sm" onClick={handleOpenCreator}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Custom Challenge
                        </Button>
                      </div>
                    </div>
                  ) : (
                    renderChallengeList(customChallenges)
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Right Panel - Challenge Detail */}
          <div className="w-full lg:w-[55%] p-6 lg:p-7">
            {selectedChallenge ? (
              <ChallengeDetail
                challenge={selectedChallenge}
                isCompleted={isCompleted(selectedChallenge.id)}
                onStart={handleStartChallenge}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a challenge to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <ChallengeCreator
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onSave={handleSaveCustomChallenge}
          editingChallenge={editingChallenge || undefined}
        />

        <AlertDialog
          open={!!pendingDelete}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete custom challenge?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete
                  ? `This will permanently remove "${pendingDelete.title}". You can’t undo this action.`
                  : "This will permanently remove the challenge."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (!pendingDelete) return;
                  deleteCustomChallenge(pendingDelete.id);
                  if (selectedChallenge?.id === pendingDelete.id) {
                    setSelectedChallenge(null);
                  }
                  setPendingDelete(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
