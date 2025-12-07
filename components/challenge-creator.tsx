"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Save,
  X,
  Upload,
  Download,
  AlertCircle,
} from "lucide-react";
import { useChallengeStore } from "@/lib/challenge-store";
import {
  serializeChallenge,
  deserializeChallenge,
  ChallengeSerializationError,
} from "@/lib/challenge-serialization";
import type {
  Challenge,
  Difficulty,
  ChallengeCategory,
  ChallengeRequirement,
} from "@/lib/challenge-types";
import {
  DIFFICULTY_VALUES,
  CATEGORY_VALUES,
  isValidChallenge,
} from "@/lib/challenge-types";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface ChallengeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (challenge: Challenge) => void;
  editingChallenge?: Challenge;
}

interface RequirementFormData {
  id: string;
  description: string;
  evaluationCriteria: string;
}

interface FormState {
  title: string;
  difficulty: Difficulty;
  category: ChallengeCategory;
  description: string;
  requirements: RequirementFormData[];
  hints: string[];
}

// ============================================================================
// Constants
// ============================================================================

const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const categoryLabels: Record<ChallengeCategory, string> = {
  "web-applications": "Web Applications",
  microservices: "Microservices",
  "real-time-systems": "Real-Time Systems",
  "data-pipelines": "Data Pipelines",
  custom: "Custom",
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateRequirementId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyFormState(): FormState {
  return {
    title: "",
    difficulty: "beginner",
    category: "custom",
    description: "",
    requirements: [
      {
        id: generateRequirementId(),
        description: "",
        evaluationCriteria: "",
      },
    ],
    hints: [],
  };
}

function formStateToChallenge(
  formState: FormState,
  existingId?: string
): Challenge {
  return {
    id: existingId || generateId(),
    title: formState.title.trim(),
    difficulty: formState.difficulty,
    category: formState.category,
    description: formState.description.trim(),
    requirements: formState.requirements.map((req) => ({
      id: req.id,
      description: req.description.trim(),
      evaluationCriteria: req.evaluationCriteria.trim(),
    })),
    hints: formState.hints
      .filter((h) => h.trim().length > 0)
      .map((h) => h.trim()),
    isCustom: true,
    createdAt: Date.now(),
  };
}

function challengeToFormState(challenge: Challenge): FormState {
  return {
    title: challenge.title,
    difficulty: challenge.difficulty,
    category: challenge.category,
    description: challenge.description,
    requirements: challenge.requirements.map((req) => ({
      id: req.id,
      description: req.description,
      evaluationCriteria: req.evaluationCriteria,
    })),
    hints: challenge.hints.length > 0 ? [...challenge.hints] : [],
  };
}

// ============================================================================
// Validation
// ============================================================================

interface ValidationErrors {
  title?: string;
  description?: string;
  requirements?: string;
  requirementItems?: Record<
    number,
    { description?: string; evaluationCriteria?: string }
  >;
}

function validateFormState(formState: FormState): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!formState.title.trim()) {
    errors.title = "Title is required";
  }

  if (!formState.description.trim()) {
    errors.description = "Description is required";
  }

  // Check requirements
  const validRequirements = formState.requirements.filter(
    (req) => req.description.trim() || req.evaluationCriteria.trim()
  );

  if (validRequirements.length === 0) {
    errors.requirements = "At least one requirement is required";
  }

  // Check individual requirement fields
  const requirementErrors: Record<
    number,
    { description?: string; evaluationCriteria?: string }
  > = {};
  formState.requirements.forEach((req, index) => {
    const hasDescription = req.description.trim().length > 0;
    const hasCriteria = req.evaluationCriteria.trim().length > 0;

    if (hasDescription || hasCriteria) {
      const itemErrors: { description?: string; evaluationCriteria?: string } =
        {};
      if (!hasDescription) {
        itemErrors.description = "Description is required";
      }
      if (!hasCriteria) {
        itemErrors.evaluationCriteria = "Evaluation criteria is required";
      }
      if (Object.keys(itemErrors).length > 0) {
        requirementErrors[index] = itemErrors;
      }
    }
  });

  if (Object.keys(requirementErrors).length > 0) {
    errors.requirementItems = requirementErrors;
  }

  return errors;
}

function hasErrors(errors: ValidationErrors): boolean {
  return (
    !!errors.title ||
    !!errors.description ||
    !!errors.requirements ||
    !!(
      errors.requirementItems && Object.keys(errors.requirementItems).length > 0
    )
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface RequirementItemProps {
  requirement: RequirementFormData;
  index: number;
  errors?: { description?: string; evaluationCriteria?: string };
  canDelete: boolean;
  onChange: (
    index: number,
    field: keyof RequirementFormData,
    value: string
  ) => void;
  onDelete: (index: number) => void;
}

function RequirementItem({
  requirement,
  index,
  errors,
  canDelete,
  onChange,
  onDelete,
}: RequirementItemProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Requirement {index + 1}</span>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(index)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`req-desc-${index}`}>Description</Label>
        <Textarea
          id={`req-desc-${index}`}
          value={requirement.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          placeholder="What should the architecture include?"
          className={cn(
            "min-h-[60px]",
            errors?.description && "border-destructive"
          )}
        />
        {errors?.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`req-criteria-${index}`}>Evaluation Criteria</Label>
        <Textarea
          id={`req-criteria-${index}`}
          value={requirement.evaluationCriteria}
          onChange={(e) =>
            onChange(index, "evaluationCriteria", e.target.value)
          }
          placeholder="How should the AI evaluate this requirement?"
          className={cn(
            "min-h-[60px]",
            errors?.evaluationCriteria && "border-destructive"
          )}
        />
        {errors?.evaluationCriteria && (
          <p className="text-xs text-destructive">
            {errors.evaluationCriteria}
          </p>
        )}
      </div>
    </div>
  );
}

interface HintItemProps {
  hint: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onDelete: (index: number) => void;
}

function HintItem({ hint, index, onChange, onDelete }: HintItemProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <Textarea
          value={hint}
          onChange={(e) => onChange(index, e.target.value)}
          placeholder={`Hint ${index + 1}`}
          className="min-h-[60px]"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onDelete(index)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 mt-1"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ImportErrorAlertProps {
  error: string;
  onDismiss: () => void;
}

function ImportErrorAlert({ error, onDismiss }: ImportErrorAlertProps) {
  return (
    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-destructive">{error}</div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ChallengeCreator({
  isOpen,
  onClose,
  onSave,
  editingChallenge,
}: ChallengeCreatorProps) {
  const { exportChallenge } = useChallengeStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formState, setFormState] =
    React.useState<FormState>(createEmptyFormState);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [importError, setImportError] = React.useState<string | null>(null);

  // Reset form when dialog opens/closes or editing challenge changes
  React.useEffect(() => {
    if (isOpen) {
      if (editingChallenge) {
        setFormState(challengeToFormState(editingChallenge));
      } else {
        setFormState(createEmptyFormState());
      }
      setErrors({});
      setImportError(null);
    }
  }, [isOpen, editingChallenge]);

  // Form field handlers
  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Requirement handlers
  const handleRequirementChange = (
    index: number,
    field: keyof RequirementFormData,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      ),
    }));
    // Clear requirement errors
    if (errors.requirementItems?.[index]) {
      setErrors((prev) => {
        const newRequirementItems = { ...prev.requirementItems };
        delete newRequirementItems[index];
        return {
          ...prev,
          requirementItems:
            Object.keys(newRequirementItems).length > 0
              ? newRequirementItems
              : undefined,
          requirements: undefined,
        };
      });
    }
  };

  const handleAddRequirement = () => {
    setFormState((prev) => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        {
          id: generateRequirementId(),
          description: "",
          evaluationCriteria: "",
        },
      ],
    }));
  };

  const handleDeleteRequirement = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  // Hint handlers
  const handleHintChange = (index: number, value: string) => {
    setFormState((prev) => ({
      ...prev,
      hints: prev.hints.map((h, i) => (i === index ? value : h)),
    }));
  };

  const handleAddHint = () => {
    setFormState((prev) => ({
      ...prev,
      hints: [...prev.hints, ""],
    }));
  };

  const handleDeleteHint = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index),
    }));
  };

  // Save handler
  const handleSave = () => {
    const validationErrors = validateFormState(formState);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    const challenge = formStateToChallenge(formState, editingChallenge?.id);
    onSave(challenge);
    onClose();
  };

  // Import handler
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const challenge = deserializeChallenge(json);
        setFormState(challengeToFormState(challenge));
        setImportError(null);
        setErrors({});
      } catch (error) {
        if (error instanceof ChallengeSerializationError) {
          setImportError(error.message);
        } else {
          setImportError(
            "Failed to import challenge. Please check the file format."
          );
        }
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Export handler
  const handleExport = () => {
    try {
      // Create a temporary challenge from current form state
      const challenge = formStateToChallenge(formState, editingChallenge?.id);

      // Validate before export
      if (!isValidChallenge(challenge)) {
        setImportError("Cannot export: Please fill in all required fields.");
        return;
      }

      const json = serializeChallenge(challenge);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${challenge.title
        .toLowerCase()
        .replace(/\s+/g, "-")}-challenge.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof ChallengeSerializationError) {
        setImportError(error.message);
      } else {
        setImportError("Failed to export challenge.");
      }
    }
  };

  const isEditing = !!editingChallenge;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            {isEditing ? "Edit Challenge" : "Create Challenge"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify your custom challenge"
              : "Create a new architecture challenge to practice specific scenarios"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full px-6">
            <div className="space-y-6 py-4 pr-2">
              {/* Import Error Alert */}
              {importError && (
                <ImportErrorAlert
                  error={importError}
                  onDismiss={() => setImportError(null)}
                />
              )}

              {/* Import/Export Buttons */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-2">
                <div className="font-medium text-foreground text-sm">
                  JSON structure required for import
                </div>
                <p>
                  The file must match <code>{"{ version: \"1.0\", challenge: {...} }"}</code> and
                  include at least one requirement. Allowed values:
                  difficulty = beginner | intermediate | advanced; category =
                  web-applications | microservices | real-time-systems |
                  data-pipelines | custom.
                </p>
                <div className="rounded border bg-background p-2 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  {`{
  "version": "1.0",
  "challenge": {
    "id": "custom-unique-id",
    "title": "My Challenge",
    "difficulty": "beginner",
    "category": "custom",
    "description": "What the user should build",
    "requirements": [
      {
        "id": "req-1",
        "description": "Include a database",
        "evaluationCriteria": "Diagram shows a database component"
      }
    ],
    "hints": ["Optional hint text"],
    "isCustom": true,
    "createdAt": 1700000000000
  }
}`}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="e.g., E-commerce Platform"
                  className={cn(errors.title && "border-destructive")}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Difficulty & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={formState.difficulty}
                    onValueChange={(value) =>
                      handleFieldChange("difficulty", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_VALUES.map((diff) => (
                        <SelectItem key={diff} value={diff}>
                          {difficultyLabels[diff]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formState.category}
                    onValueChange={(value) =>
                      handleFieldChange("category", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_VALUES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  placeholder="Describe the challenge scenario and goals..."
                  className={cn(
                    "min-h-[80px]",
                    errors.description && "border-destructive"
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Requirements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Requirements</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRequirement}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Requirement
                  </Button>
                </div>
                {errors.requirements && (
                  <p className="text-xs text-destructive">
                    {errors.requirements}
                  </p>
                )}
                <div className="space-y-3">
                  {formState.requirements.map((req, index) => (
                    <RequirementItem
                      key={req.id}
                      requirement={req}
                      index={index}
                      errors={errors.requirementItems?.[index]}
                      canDelete={formState.requirements.length > 1}
                      onChange={handleRequirementChange}
                      onDelete={handleDeleteRequirement}
                    />
                  ))}
                </div>
              </div>

              {/* Hints */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Hints (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddHint}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Hint
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hints will be revealed progressively during the challenge
                </p>
                {formState.hints.length > 0 && (
                  <div className="space-y-3">
                    {formState.hints.map((hint, index) => (
                      <HintItem
                        key={index}
                        hint={hint}
                        index={index}
                        onChange={handleHintChange}
                        onDelete={handleDeleteHint}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? "Save Changes" : "Create Challenge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
