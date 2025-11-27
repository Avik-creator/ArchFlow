"use client"

import type React from "react"

import { useCallback, useRef, useState, useEffect } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useArchitectureStore } from "@/lib/architecture-store"
import { exportToPng, exportToSvg, exportToJson } from "@/lib/export-utils"
import { ComponentSidebar } from "./component-sidebar"
import { PropertiesPanel } from "./properties-panel"
import { Toolbar } from "./toolbar"
import { MobileToolbar } from "./mobile-toolbar"
import { SimulationConsole } from "./simulation-console"
import { AIChatPanel } from "./ai-chat-panel"
import { ArchitectureNode } from "./nodes/architecture-node"
import { CollaborationPanel } from "./collaboration-panel"
import { CollaborationCursors, CollaborationAvatars } from "./collaboration-cursors"
import { createSimulationRunner } from "@/lib/simulation-engine"
import type { ArchitectureComponent, NodeData } from "@/lib/architecture-types"
import { cn } from "@/lib/utils"
import { Menu, PanelRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const nodeTypes: NodeTypes = {
  architecture: ArchitectureNode,
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

interface ArchitectureDesignerInnerProps {
  roomId?: string | null
}

function ArchitectureDesignerInner({ roomId }: ArchitectureDesignerInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow()
  const isMobile = useIsMobile()

  const {
    nodes,
    edges,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
    setSelectedEdgeId,
    selectedNodeId,
    selectedEdgeId,
    simulation,
    startSimulation,
    stopSimulation,
    setCurrentSimulationNode,
    addSimulationStep,
  } = useArchitectureStore()

  const [showGrid, setShowGrid] = useState(true)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [collabPanelOpen, setCollabPanelOpen] = useState(false)
  const simulationRunnerRef = useRef<ReturnType<typeof createSimulationRunner> | null>(null)

  useEffect(() => {
    if (!edges.length) return
    if (edges.some((edge) => !edge.style?.stroke)) {
      setEdges(edges)
    }
  }, [edges, setEdges])

  useEffect(() => {
    if (isMobile && (selectedNodeId || selectedEdgeId)) {
      setRightSidebarOpen(true)
    }
  }, [isMobile, selectedNodeId, selectedEdgeId])

  useEffect(() => {
    const resizeObserverErr = (e: ErrorEvent) => {
      if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
        e.stopImmediatePropagation()
      }
    }
    window.addEventListener("error", resizeObserverErr)
    return () => window.removeEventListener("error", resizeObserverErr)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const componentData = event.dataTransfer.getData("application/json")
      if (!componentData) return

      const component: ArchitectureComponent = JSON.parse(componentData)
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode = {
        id: `${component.id}-${Date.now()}`,
        type: "architecture",
        position,
        data: {
          label: component.name,
          component,
          description: "",
          dummyData: "",
          transformationType: "passthrough" as const,
        } satisfies NodeData,
      }

      addNode(newNode)
      if (isMobile) {
        setLeftSidebarOpen(false)
      }
    },
    [screenToFlowPosition, addNode, isMobile],
  )

  const handleDragStart = (event: React.DragEvent, component: ArchitectureComponent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(component))
    event.dataTransfer.effectAllowed = "move"
  }

  const handleMobileAddComponent = useCallback(
    (component: ArchitectureComponent) => {
      const position = {
        x: Math.random() * 200 + 100,
        y: Math.random() * 200 + 100,
      }

      const newNode = {
        id: `${component.id}-${Date.now()}`,
        type: "architecture",
        position,
        data: {
          label: component.name,
          component,
          description: "",
          dummyData: "",
          transformationType: "passthrough" as const,
        } satisfies NodeData,
      }

      addNode(newNode)
      setLeftSidebarOpen(false)
      fitView({ padding: 0.2 })
    },
    [addNode, fitView],
  )

  const handleExportPng = useCallback(async () => {
    const flowElement = document.querySelector(".react-flow") as HTMLElement
    if (flowElement) {
      await exportToPng(flowElement, "architecture-diagram")
    }
  }, [])

  const handleExportSvg = useCallback(async () => {
    const flowElement = document.querySelector(".react-flow") as HTMLElement
    if (flowElement) {
      await exportToSvg(flowElement, "architecture-diagram")
    }
  }, [])

  const handleExportJson = useCallback(() => {
    exportToJson(nodes, edges, "architecture-diagram")
  }, [nodes, edges])

  const handleStartSimulation = useCallback(() => {
    if (nodes.length === 0) return

    startSimulation()
    setConsoleOpen(true)

    const runner = createSimulationRunner(nodes, edges, simulation.speed, {
      onNodeEnter: (nodeId) => setCurrentSimulationNode(nodeId),
      onNodeProcess: (nodeId, nodeName, input, output) => {
        addSimulationStep({
          nodeId,
          nodeName,
          inputData: input,
          outputData: output,
          timestamp: Date.now(),
        })
      },
      onComplete: () => {
        setCurrentSimulationNode(null)
        stopSimulation()
      },
      isPaused: () => useArchitectureStore.getState().simulation.isPaused,
      isStopped: () => !useArchitectureStore.getState().simulation.isRunning,
    })

    simulationRunnerRef.current = runner
    runner.run()
  }, [nodes, edges, simulation.speed, startSimulation, stopSimulation, setCurrentSimulationNode, addSimulationStep])

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex h-12 items-center justify-between border-b border-border/50 bg-background px-3 md:px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <ComponentSidebar onDragStart={handleDragStart} onMobileAdd={handleMobileAddComponent} isMobile />
              </SheetContent>
            </Sheet>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
              <path d="M12 22V12M2 7l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:block">ArchFlow</span>
          {roomId && (
            <span className="hidden sm:flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {roomId && (
            <div className="hidden sm:block">
              <CollaborationAvatars />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 gap-1.5 text-xs hidden sm:flex", roomId && "text-green-500")}
            onClick={() => setCollabPanelOpen(!collabPanelOpen)}
          >
            <Users className="h-3.5 w-3.5" />
            {roomId ? "Share" : "Collaborate"}
          </Button>

          {isMobile ? (
            <MobileToolbar
              onStartSimulation={handleStartSimulation}
              onToggleAIChat={() => setAiChatOpen(!aiChatOpen)}
              aiChatOpen={aiChatOpen}
              onExportPng={handleExportPng}
              onExportSvg={handleExportSvg}
              onExportJson={handleExportJson}
            />
          ) : (
            <Toolbar
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onFitView={() => fitView({ padding: 0.2 })}
              onExportPng={handleExportPng}
              onExportSvg={handleExportSvg}
              onExportJson={handleExportJson}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid(!showGrid)}
              onStartSimulation={handleStartSimulation}
              onToggleAIChat={() => setAiChatOpen(!aiChatOpen)}
              aiChatOpen={aiChatOpen}
            />
          )}

          {isMobile && (selectedNodeId || selectedEdgeId) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <CollaborationPanel isOpen={collabPanelOpen} onClose={() => setCollabPanelOpen(false)} roomId={roomId} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && <ComponentSidebar onDragStart={handleDragStart} />}

        {/* Canvas */}
        <div className="relative flex flex-1 flex-col min-h-0 overflow-hidden">
          <div ref={reactFlowWrapper} className="flex-1 min-h-0 touch-none relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
              onPaneClick={() => {
                setSelectedNodeId(null)
                setSelectedEdgeId(null)
                if (isMobile) setRightSidebarOpen(false)
              }}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              colorMode="dark"
              defaultEdgeOptions={{
                type: "smoothstep",
                style: { strokeWidth: 1.5 },
                animated: false,
              }}
              proOptions={{ hideAttribution: true }}
              panOnDrag={!isMobile || true}
              zoomOnPinch
              preventScrolling
            >
              {showGrid && <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#333333" />}
              <Controls
                className={cn(
                  "!rounded-lg !border-border/50 !bg-background !shadow-none [&>button]:!border-border/50 [&>button]:!bg-background",
                  isMobile && "!bottom-16 !left-2",
                )}
                showInteractive={false}
              />
              {!isMobile && (
                <MiniMap
                  className="!rounded-lg !border-border/50 !bg-background/90 !shadow-none"
                  nodeColor={(node) => {
                    const data = node.data as NodeData
                    return data.component?.color || "#8b5cf6"
                  }}
                  maskColor="rgba(0,0,0,0.8)"
                  pannable
                  zoomable
                />
              )}
            </ReactFlow>

            {roomId && <CollaborationCursors />}

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {isMobile ? "Tap menu to add components" : "Drag components to start building"}
                  </p>
                </div>
              </div>
            )}

            {/* AI Chat Panel */}
            <AIChatPanel isOpen={aiChatOpen} onToggle={() => setAiChatOpen(!aiChatOpen)} isMobile={isMobile} />
          </div>

          {/* Simulation Console */}
          <SimulationConsole isOpen={consoleOpen} onToggle={() => setConsoleOpen(!consoleOpen)} />
        </div>

        {/* Desktop Properties Panel */}
        {!isMobile && <PropertiesPanel />}

        {isMobile && (
          <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
            <SheetContent side="right" className="w-[300px] p-0">
              <PropertiesPanel isMobile onClose={() => setRightSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  )
}

interface ArchitectureDesignerProps {
  roomId?: string | null
}

export function ArchitectureDesigner({ roomId }: ArchitectureDesignerProps) {
  return (
    <ReactFlowProvider>
      <ArchitectureDesignerInner roomId={roomId} />
    </ReactFlowProvider>
  )
}
