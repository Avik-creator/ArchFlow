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
    borderRadius: 12,
  });

  // Calculate dynamic offset based on edge angle to spread labels apart
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx);

  // Offset perpendicular to the edge direction for better separation
  const offsetDistance = 15;
  const offsetX = Math.sin(angle) * offsetDistance;
  const offsetY = -Math.cos(angle) * offsetDistance;

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
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <div
              className="px-2 py-1 text-[10px] font-medium rounded-md border shadow-lg text-center leading-tight"
              style={{
                backgroundColor: "rgba(10, 10, 10, 0.98)",
                borderColor: selected ? "#a855f7" : "rgba(82, 82, 82, 0.6)",
                color: selected ? "#e9d5ff" : "#d4d4d8",
                maxWidth: "120px",
                wordWrap: "break-word",
                whiteSpace: "normal",
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
