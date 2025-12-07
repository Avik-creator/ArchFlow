"use client";

import type React from "react";

import { useState } from "react";
import { Search, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  COMPONENT_LIBRARY,
  CATEGORY_LABELS,
  type ArchitectureComponent,
  type ComponentCategory,
} from "@/lib/architecture-types";
import { iconMap } from "./nodes/node-icons";
import { cn } from "@/lib/utils";

interface ComponentSidebarProps {
  onDragStart: (
    event: React.DragEvent,
    component: ArchitectureComponent
  ) => void;
  onMobileAdd?: (component: ArchitectureComponent) => void;
  isMobile?: boolean;
}

const categoryColors: Record<ComponentCategory, string> = {
  compute: "#3b82f6",
  storage: "#10b981",
  network: "#a855f7",
  clients: "#f59e0b",
  cloud: "#6366f1",
  messaging: "#ec4899",
  api: "#22c55e",
};

export function ComponentSidebar({
  onDragStart,
  onMobileAdd,
  isMobile,
}: ComponentSidebarProps) {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Set<ComponentCategory>
  >(new Set(["compute", "storage", "api"]));

  const filteredComponents = COMPONENT_LIBRARY.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const groupedComponents = filteredComponents.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<ComponentCategory, ArchitectureComponent[]>);

  const categories = Object.keys(CATEGORY_LABELS) as ComponentCategory[];

  const toggleCategory = (category: ComponentCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={cn(
          "flex h-full min-h-0 flex-col border-r border-border/50 bg-background flex-shrink-0",
          isMobile ? "w-full" : "w-56"
        )}
      >
        {/* Header */}
        <div className="border-b border-border/50 p-3 flex-shrink-0">
          {isMobile && (
            <h2 className="text-sm font-semibold mb-3">Components</h2>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm bg-muted/30 border-border/50"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          {categories.map((category) => {
            const components = groupedComponents[category] || [];
            if (components.length === 0) return null;

            const isExpanded =
              expandedCategories.has(category) || search.length > 0;

            return (
              <div key={category} className="mb-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50 group"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: categoryColors[category] }}
                  />
                  <span className="flex-1 text-xs font-medium text-muted-foreground">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {components.length}
                  </span>
                </button>

                {/* Components List */}
                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5 pl-4">
                    {components.map((component) => {
                      const IconComponent = iconMap[component.icon];
                      return (
                        <Tooltip key={component.id}>
                          <TooltipTrigger asChild>
                            <div
                              draggable={!isMobile}
                              onDragStart={(e) =>
                                !isMobile && onDragStart(e, component)
                              }
                              onClick={() =>
                                isMobile && onMobileAdd?.(component)
                              }
                              className={cn(
                                "group flex items-center gap-2 rounded-md px-2 py-2 transition-all",
                                "hover:bg-muted/50",
                                isMobile
                                  ? "cursor-pointer active:bg-muted"
                                  : "cursor-grab active:cursor-grabbing active:bg-muted"
                              )}
                            >
                              <div
                                className="flex h-7 w-7 items-center justify-center rounded"
                                style={{
                                  backgroundColor: `${component.color}15`,
                                }}
                              >
                                {component.iconUrl ? (
                                  <img
                                    src={component.iconUrl}
                                    alt={component.name}
                                    className="h-4 w-4"
                                  />
                                ) : (
                                  IconComponent && (
                                    <IconComponent
                                      className="h-4 w-4"
                                      style={{ color: component.color }}
                                    />
                                  )
                                )}
                              </div>
                              <span className="flex-1 text-xs text-foreground/80 group-hover:text-foreground">
                                {component.name}
                              </span>
                              {isMobile && (
                                <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </TooltipTrigger>
                          {!isMobile && (
                            <TooltipContent
                              side="right"
                              className="max-w-[180px]"
                            >
                              <p className="font-medium text-xs">
                                {component.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {component.description}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 p-3 flex-shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            {isMobile ? "Tap to add to canvas" : "Drag to canvas to add"}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
