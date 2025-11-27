"use client"

import { Trash2, ZoomIn, ZoomOut, Maximize, Play, Pause, Square, RotateCcw, Grid3X3, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useArchitectureStore } from "@/lib/architecture-store"
import { ExportMenu } from "./export-menu"
import { cn } from "@/lib/utils"

interface ToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onExportPng: () => Promise<void>
  onExportSvg: () => Promise<void>
  onExportJson: () => void
  showGrid: boolean
  onToggleGrid: () => void
  onStartSimulation: () => void
  onToggleAIChat?: () => void
  aiChatOpen?: boolean
}

export function Toolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onExportPng,
  onExportSvg,
  onExportJson,
  showGrid,
  onToggleGrid,
  onStartSimulation,
  onToggleAIChat,
  aiChatOpen,
}: ToolbarProps) {
  const {
    deleteSelected,
    clearCanvas,
    selectedNodeId,
    selectedEdgeId,
    simulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    setSimulationSpeed,
  } = useArchitectureStore()

  const hasSelection = selectedNodeId || selectedEdgeId

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5">
        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={deleteSelected}
              disabled={!hasSelection}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Delete</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border/50 mx-1" />

        {/* Zoom Controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onZoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Zoom Out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onZoomIn}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onFitView}
            >
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Fit</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border/50 mx-1" />

        {/* Grid Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", showGrid ? "text-foreground" : "text-muted-foreground")}
              onClick={onToggleGrid}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Grid</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border/50 mx-1" />

        {/* Simulation Controls */}
        {!simulation.isRunning ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                onClick={onStartSimulation}
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Run</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={simulation.isPaused ? resumeSimulation : pauseSimulation}
                >
                  {simulation.isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{simulation.isPaused ? "Resume" : "Pause"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  onClick={stopSimulation}
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Stop</TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-1.5 px-2">
              <Slider
                value={[simulation.speed]}
                onValueChange={([v]) => setSimulationSpeed(v)}
                min={200}
                max={2000}
                step={100}
                className="w-16"
              />
            </div>
          </>
        )}

        <div className="w-px h-4 bg-border/50 mx-1" />

        {/* AI Chat */}
        {onToggleAIChat && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  aiChatOpen ? "text-primary bg-primary/10" : "text-primary hover:bg-primary/10",
                )}
                onClick={onToggleAIChat}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">AI</TooltipContent>
          </Tooltip>
        )}

        <ExportMenu onExportPng={onExportPng} onExportSvg={onExportSvg} onExportJson={onExportJson} />

        {/* Clear */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              onClick={clearCanvas}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Clear</TooltipContent>
        </Tooltip>

        {/* Status indicator */}
        {simulation.isRunning && (
          <div
            className={cn(
              "ml-2 flex items-center gap-1.5 rounded-full px-2 py-0.5",
              simulation.isPaused ? "bg-yellow-500/10" : "bg-emerald-500/10",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                simulation.isPaused ? "bg-yellow-500" : "animate-pulse bg-emerald-500",
              )}
            />
            <span
              className={cn("text-[10px] font-medium", simulation.isPaused ? "text-yellow-500" : "text-emerald-500")}
            >
              {simulation.isPaused ? "Paused" : "Running"}
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
