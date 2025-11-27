import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const EDGE_COLOR_PALETTE = [
  "#f87171",
  "#fb7185",
  "#f472b6",
  "#e879f9",
  "#c084fc",
  "#a855f7",
  "#818cf8",
  "#60a5fa",
  "#38bdf8",
  "#22d3ee",
  "#2dd4bf",
  "#34d399",
  "#4ade80",
  "#a3e635",
  "#fbbf24",
  "#f97316",
  "#fb923c",
  "#facc15",
  "#ef4444",
  "#f472b6",
]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEdgeColor(key: string) {
  if (!key) {
    return EDGE_COLOR_PALETTE[0]
  }

  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }

  const index = Math.abs(hash) % EDGE_COLOR_PALETTE.length
  return EDGE_COLOR_PALETTE[index]
}
