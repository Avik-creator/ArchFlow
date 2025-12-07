"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // Offset label slightly based on edge direction to reduce overlaps
  const isHorizontal =
    Math.abs(targetX - sourceX) > Math.abs(targetY - sourceY);
  const offsetX = isHorizontal ? 0 : targetX > sourceX ? 10 : -10;
  const offsetY = isHorizontal ? (targetY > sourceY ? 10 : -10) : 0;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: selected ? "#a855f7" : style?.stroke || "#525252",
          strokeWidth: selected ? 2 : 1.5,
        }}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${
                labelX + offsetX
              }px, ${labelY + offsetY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div
              className="px-2 py-0.5 text-[10px] font-medium rounded-md border shadow-sm max-w-[140px] truncate"
              style={{
                backgroundColor: "rgba(10, 10, 10, 0.95)",
                borderColor: selected ? "#a855f7" : "rgba(82, 82, 82, 0.5)",
                color: selected ? "#e9d5ff" : "#a1a1aa",
              }}
              title={typeof label === "string" ? label : undefined}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
