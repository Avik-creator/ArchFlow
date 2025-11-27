"use client"

import { Play, Pause, Square, Sparkles, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useArchitectureStore } from "@/lib/architecture-store"
import { cn } from "@/lib/utils"

interface MobileToolbarProps {
  onStartSimulation: () => void
  onToggleAIChat: () => void
  aiChatOpen: boolean
  onExportPng: () => Promise<void>
  onExportSvg: () => Promise<void>
  onExportJson: () => void
}

export function MobileToolbar({
  onStartSimulation,
  onToggleAIChat,
  aiChatOpen,
  onExportPng,
  onExportSvg,
  onExportJson,
}: MobileToolbarProps) {
  const { simulation, pauseSimulation, resumeSimulation, stopSimulation, clearCanvas } = useArchitectureStore()

  return (
    <div className="flex items-center gap-1">
      {/* Simulation Controls */}
      {!simulation.isRunning ? (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={onStartSimulation}>
          <Play className="h-4 w-4" />
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={simulation.isPaused ? resumeSimulation : pauseSimulation}
          >
            {simulation.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={stopSimulation}>
            <Square className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* AI Chat */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", aiChatOpen ? "text-primary bg-primary/10" : "text-primary")}
        onClick={onToggleAIChat}
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onExportPng}>Export PNG</DropdownMenuItem>
          <DropdownMenuItem onClick={onExportSvg}>Export SVG</DropdownMenuItem>
          <DropdownMenuItem onClick={onExportJson}>Export JSON</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={clearCanvas} className="text-red-500">
            Clear Canvas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Running indicator */}
      {simulation.isRunning && (
        <span
          className={cn("h-2 w-2 rounded-full", simulation.isPaused ? "bg-yellow-500" : "animate-pulse bg-emerald-500")}
        />
      )}
    </div>
  )
}
