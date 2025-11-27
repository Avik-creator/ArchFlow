"use client"

import { useEffect, useRef } from "react"
import { Terminal, ChevronDown, ChevronUp, Trash2, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useArchitectureStore } from "@/lib/architecture-store"
import { cn } from "@/lib/utils"

interface SimulationConsoleProps {
  isOpen: boolean
  onToggle: () => void
}

export function SimulationConsole({ isOpen, onToggle }: SimulationConsoleProps) {
  const { simulation, clearSimulationSteps } = useArchitectureStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [simulation.steps])

  const isApiError = (data: unknown): boolean => {
    if (typeof data === "object" && data !== null) {
      return "_error" in data && (data as Record<string, unknown>)._error === true
    }
    return false
  }

  return (
    <div
      className={cn(
        "border-t border-border/50 bg-background transition-all duration-200",
        isOpen ? "h-48 md:h-64" : "h-10",
      )}
    >
      {/* Header */}
      <div
        className="flex h-10 cursor-pointer items-center justify-between px-3 hover:bg-muted/30 active:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Console</span>
          {simulation.steps.length > 0 && (
            <span className="text-[10px] text-muted-foreground/70">{simulation.steps.length} steps</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {simulation.steps.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                clearSimulationSteps()
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <ScrollArea className="h-[calc(100%-2.5rem)]" ref={scrollRef}>
          <div className="p-2 font-mono text-[11px]">
            {simulation.steps.length === 0 ? (
              <div className="flex h-24 md:h-32 items-center justify-center">
                <p className="text-xs text-muted-foreground">No simulation data yet</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {simulation.steps.map((step, index) => {
                  const hasError = isApiError(step.outputData)

                  return (
                    <div
                      key={index}
                      className={cn(
                        "rounded border bg-muted/20 p-2",
                        hasError ? "border-red-500/30" : "border-border/50",
                      )}
                    >
                      {/* Step Header */}
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{index + 1}.</span>
                          <span className="font-medium text-foreground font-sans text-xs">{step.nodeName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground/60">
                          <Clock className="h-2.5 w-2.5" />
                          <span className="text-[10px]">{new Date(step.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center gap-1.5">
                        <div className="flex-1 rounded bg-muted/50 p-1.5 overflow-hidden">
                          <pre className="text-amber-500/80 truncate text-[10px]">{JSON.stringify(step.inputData)}</pre>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 rotate-90 md:rotate-0 self-center" />
                        <div className="flex-1 rounded bg-muted/50 p-1.5 overflow-hidden">
                          <pre
                            className={cn("truncate text-[10px]", hasError ? "text-red-400" : "text-emerald-500/80")}
                          >
                            {JSON.stringify(step.outputData)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
