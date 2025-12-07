"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ImageIcon, Download, Upload } from "lucide-react";
import { useCustomIconsStore, type CustomIcon } from "@/lib/custom-icons-store";
import {
  CATEGORY_LABELS,
  type ComponentCategory,
} from "@/lib/architecture-types";
import { cn } from "@/lib/utils";

interface CustomIconDialogProps {
  trigger?: React.ReactNode;
}

const DEFAULT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export function CustomIconDialog({ trigger }: CustomIconDialogProps) {
  const customIconsStore = useCustomIconsStore();
  const { icons, addIcon, removeIcon } = customIconsStore;
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [category, setCategory] = useState<ComponentCategory>("compute");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [previewError, setPreviewError] = useState(false);

  const resetForm = () => {
    setName("");
    setIconUrl("");
    setCategory("compute");
    setDescription("");
    setColor(DEFAULT_COLORS[0]);
    setPreviewError(false);
    setIsAdding(false);
  };

  const handleAdd = () => {
    if (!name.trim() || !iconUrl.trim()) return;

    addIcon({
      name: name.trim(),
      iconUrl: iconUrl.trim(),
      category,
      description: description.trim() || `Custom ${name} icon`,
      color,
    });

    resetForm();
  };

  const handleDelete = (id: string) => {
    removeIcon(id);
  };

  const handleExport = () => {
    const data = JSON.stringify(icons, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "archflow-custom-icons.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          imported.forEach((icon) => {
            if (icon.name && icon.iconUrl && icon.category) {
              addIcon({
                name: icon.name,
                iconUrl: icon.iconUrl,
                category: icon.category,
                description: icon.description || "",
                color: icon.color || "#3b82f6",
              });
            }
          });
        }
      } catch (err) {
        console.error("Failed to import icons:", err);
      }
    };
    input.click();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Icon
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Custom Icons</DialogTitle>
          <DialogDescription>
            Add your own icons by providing an image URL. Icons are stored
            locally.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Add New Icon Form */}
          {isAdding ? (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                {/* Icon Preview */}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  {iconUrl && !previewError ? (
                    <img
                      src={iconUrl}
                      alt="Preview"
                      className="h-7 w-7 object-contain"
                      onError={() => setPreviewError(true)}
                      onLoad={() => setPreviewError(false)}
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{name || "Icon Name"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {description || "Description"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Nginx, Terraform"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="iconUrl">Icon URL *</Label>
                  <Input
                    id="iconUrl"
                    placeholder="https://cdn.simpleicons.org/nginx/009639"
                    value={iconUrl}
                    onChange={(e) => {
                      setIconUrl(e.target.value);
                      setPreviewError(false);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use simpleicons.org - format:
                    https://cdn.simpleicons.org/[name]/[color]
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onValueChange={(v) => setCategory(v as ComponentCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Color</Label>
                    <div className="flex gap-1 flex-wrap">
                      {DEFAULT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={cn(
                            "h-6 w-6 rounded-full border-2 transition-all",
                            color === c
                              ? "border-foreground scale-110"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                          onClick={() => setColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!name.trim() || !iconUrl.trim()}
                >
                  Add Icon
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Icon
            </Button>
          )}

          {/* Existing Custom Icons */}
          {icons.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Your Custom Icons ({icons.length})
              </h4>
              <div className="space-y-2">
                {icons.map((icon) => (
                  <CustomIconItem
                    key={icon.id}
                    icon={icon}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {icons.length === 0 && !isAdding && (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No custom icons yet</p>
              <p className="text-xs">Add your first icon to get started</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            {icons.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImport}
              className="gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomIconItem({
  icon,
  onDelete,
}: {
  icon: CustomIcon;
  onDelete: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border bg-background hover:bg-muted/30 transition-colors">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-md shrink-0"
        style={{ backgroundColor: `${icon.color}20` }}
      >
        {!imgError ? (
          <img
            src={icon.iconUrl}
            alt={icon.name}
            className="h-5 w-5 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{icon.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {CATEGORY_LABELS[icon.category]}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(icon.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
