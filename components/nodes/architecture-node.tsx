"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { iconMap } from "./node-icons";
import type { NodeData } from "@/lib/architecture-types";
import { useArchitectureStore } from "@/lib/architecture-store";
import { cn } from "@/lib/utils";

function ArchitectureNodeComponent({ data, id, selected }: NodeProps) {
  const { simulation } = useArchitectureStore();
  const IconComponent = iconMap[(data as NodeData).component.icon];
  const nodeData = data as NodeData;
  const isSimulating = simulation.currentNodeId === id;
  const hasApiEnabled = nodeData.apiConfig?.enabled;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-lg border bg-background p-3 transition-all",
        selected
          ? "border-primary shadow-sm"
          : "border-border/60 hover:border-border",
        isSimulating && "border-emerald-500 shadow-md shadow-emerald-500/20",
        hasApiEnabled && !selected && !isSimulating && "border-emerald-500/40"
      )}
      style={{ minWidth: 100 }}
    >
      {/* Glow effect for simulation */}
      {isSimulating && (
        <div
          className="absolute inset-0 -z-10 rounded-lg blur-xl opacity-50"
          style={{ backgroundColor: nodeData.component.color }}
        />
      )}

      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground/50 !transition-all hover:!bg-primary"
        style={{ top: -5 }}
      />

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground/50 !transition-all hover:!bg-primary"
        style={{ left: -5 }}
      />

      {/* Icon */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-md"
        style={{ backgroundColor: `${nodeData.component.color}15` }}
      >
        {nodeData.component.iconUrl ? (
          <img
            src={nodeData.component.iconUrl}
            alt={nodeData.component.name}
            className="h-5 w-5"
            style={{
              filter: "brightness(0) saturate(100%)",
              color: nodeData.component.color,
            }}
          />
        ) : (
          IconComponent && (
            <IconComponent
              className="h-5 w-5"
              style={{ color: nodeData.component.color }}
            />
          )
        )}
      </div>

      {/* Label - Force white color for export visibility */}
      <p
        className="text-xs font-medium text-center max-w-[90px] truncate"
        style={{ color: "#ffffff" }}
      >
        {nodeData.label}
      </p>

      {/* API Badge */}
      {hasApiEnabled && (
        <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
          A
        </div>
      )}

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground/50 !transition-all hover:!bg-primary"
        style={{ right: -5 }}
      />

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground/50 !transition-all hover:!bg-primary"
        style={{ bottom: -5 }}
      />
    </div>
  );
}

export const ArchitectureNode = memo(ArchitectureNodeComponent);
