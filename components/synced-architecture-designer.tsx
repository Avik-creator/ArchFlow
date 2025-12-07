"use client";

import type React from "react";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type EdgeTypes,
  type NodeChange,
  type EdgeChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  useStorage,
  useMutation,
  useUpdateMyPresence,
  useOthers,
  useSelf,
  type SerializedNode,
  type SerializedEdge,
} from "@/liveblocks.config";
import { LiveList, LiveObject } from "@liveblocks/client";
import { exportToPng, exportToSvg, exportToJson } from "@/lib/export-utils";
import { ComponentSidebar } from "./component-sidebar";
import { PropertiesPanel } from "./properties-panel";
import { Toolbar } from "./toolbar";
import { MobileToolbar } from "./mobile-toolbar";
import { SimulationConsole } from "./simulation-console";
import { AIChatPanel } from "./ai-chat-panel";
import { ArchitectureNode } from "./nodes/architecture-node";
import { LabeledEdge } from "./edges/labeled-edge";
import { CollaborationPanel } from "./collaboration-panel";
import { ConnectionStatus } from "./collaboration-room";
import { createSimulationRunner } from "@/lib/simulation-engine";
import type {
  ArchitectureComponent,
  NodeData,
  ArchitectureNode as ArchNode,
  ArchitectureEdge,
} from "@/lib/architecture-types";
import { cn, getEdgeColor } from "@/lib/utils";
import { Menu, PanelRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const nodeTypes: NodeTypes = {
  architecture: ArchitectureNode,
};

const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
};

const EDGE_STROKE_WIDTH = 2;

const colorizeEdges = (edges: ArchitectureEdge[]) =>
  edges.map((edge, index) => {
    const key =
      edge.id ?? `${edge.source ?? "edge"}-${edge.target ?? "edge"}-${index}`;
    const color = (edge.data?.color as string | undefined) ?? getEdgeColor(key);
    return {
      ...edge,
      style: {
        ...edge.style,
        stroke: color,
        strokeWidth: edge.style?.strokeWidth ?? EDGE_STROKE_WIDTH,
      },
      data: { ...edge.data, color },
    };
  });

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

interface SyncedArchitectureDesignerInnerProps {
  roomId: string;
}

function SyncedArchitectureDesignerInner({
  roomId,
}: SyncedArchitectureDesignerInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  const isMobile = useIsMobile();
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const self = useSelf();

  const nodesLiveList = useStorage((root) => root.nodes);
  const edgesLiveList = useStorage((root) => root.edges);

  // Convert LiveList to arrays for use in ReactFlow
  const nodes: ArchNode[] = nodesLiveList
    ? Array.from(nodesLiveList).map((node) => {
      // LiveList items are already plain objects when accessed
      const nodeData = node as unknown as SerializedNode;
      return {
        id: nodeData.id,
        type: nodeData.type || "architecture",
        position: nodeData.position,
        data: nodeData.data,
      } as ArchNode;
    })
    : [];

  const edges: ArchitectureEdge[] = edgesLiveList
    ? Array.from(edgesLiveList).map((edge) => {
      // LiveList items are already plain objects when accessed
      const edgeData = edge as unknown as SerializedEdge;
      const key = edgeData.id ?? `${edgeData.source}-${edgeData.target}`;
      const data = edgeData.data || {};
      const color = (data as any).color as string | undefined ?? getEdgeColor(key);
      return {
        id: edgeData.id,
        source: edgeData.source,
        target: edgeData.target,
        sourceHandle: edgeData.sourceHandle,
        targetHandle: edgeData.targetHandle,
        type: edgeData.type || "labeled",
        label: data.label,
        style: {
          stroke: color,
          strokeWidth: EDGE_STROKE_WIDTH
        },
        data: { ...data, color },
      } as ArchitectureEdge;
    })
    : [];

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [collabPanelOpen, setCollabPanelOpen] = useState(false);
  const [simulation, setSimulation] = useState({
    isRunning: false,
    isPaused: false,
    currentNodeId: null as string | null,
    steps: [] as any[],
    speed: 1000,
  });

  const setNodes = useMutation(({ storage }, newNodes: ArchNode[]) => {
    const liveList = new LiveList<LiveObject<SerializedNode>>([]);
    for (const node of newNodes) {
      liveList.push(
        new LiveObject<SerializedNode>({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })
      );
    }
    storage.set("nodes", liveList);
  }, []);

  const setEdges = useMutation(({ storage }, newEdges: ArchitectureEdge[]) => {
    const colorized = colorizeEdges(newEdges);
    const liveList = new LiveList<LiveObject<SerializedEdge>>([]);
    for (const edge of colorized) {
      liveList.push(
        new LiveObject<SerializedEdge>({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type,
          data: edge.data,
        })
      );
    }
    storage.set("edges", liveList);
  }, []);

  useEffect(() => {
    if (!edges.length) return;
    if (edges.some((edge) => !edge.style?.stroke)) {
      setEdges(edges);
    }
  }, [edges, setEdges]);

  const addNode = useMutation(({ storage }, node: ArchNode) => {
    const nodes = storage.get("nodes");
    if (nodes) {
      nodes.push(
        new LiveObject<SerializedNode>({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })
      );
    }
  }, []);

  const updateNodeData = useMutation(
    ({ storage }, nodeId: string, data: Partial<NodeData>) => {
      const nodes = storage.get("nodes");
      if (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes.get(i);
          if (node && node.get("id") === nodeId) {
            const currentData = node.get("data");
            node.set("data", { ...currentData, ...data });
            break;
          }
        }
      }
    },
    []
  );

  const updateEdgeData = useMutation(
    ({ storage }, edgeId: string, data: { label?: string }) => {
      const edges = storage.get("edges");
      if (edges) {
        for (let i = 0; i < edges.length; i++) {
          const edge = edges.get(i);
          if (edge && edge.get("id") === edgeId) {
            const currentData = edge.get("data") || {};
            edge.set("data", { ...currentData, ...data });
            break;
          }
        }
      }
    },
    []
  );

  const deleteNode = useMutation(({ storage }, nodeId: string) => {
    const nodes = storage.get("nodes");
    const edges = storage.get("edges");
    if (nodes) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes.get(i);
        if (node && node.get("id") === nodeId) {
          nodes.delete(i);
        }
      }
    }
    if (edges) {
      for (let i = edges.length - 1; i >= 0; i--) {
        const edge = edges.get(i);
        if (edge && (edge.get("source") === nodeId || edge.get("target") === nodeId)) {
          edges.delete(i);
        }
      }
    }
  }, []);

  const deleteEdge = useMutation(({ storage }, edgeId: string) => {
    const edges = storage.get("edges");
    if (edges) {
      for (let i = edges.length - 1; i >= 0; i--) {
        const edge = edges.get(i);
        if (edge && edge.get("id") === edgeId) {
          edges.delete(i);
        }
      }
    }
  }, []);

  const clearCanvas = useMutation(({ storage }) => {
    const emptyNodes = new LiveList<LiveObject<SerializedNode>>([]);
    const emptyEdges = new LiveList<LiveObject<SerializedEdge>>([]);
    storage.set("nodes", emptyNodes);
    storage.set("edges", emptyEdges);
  }, []);

  useEffect(() => {
    if (isMobile && (selectedNodeId || selectedEdgeId)) {
      setRightSidebarOpen(true);
    }
  }, [isMobile, selectedNodeId, selectedEdgeId]);

  useEffect(() => {
    const resizeObserverErr = (e: ErrorEvent) => {
      if (
        e.message ===
        "ResizeObserver loop completed with undelivered notifications."
      ) {
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("error", resizeObserverErr);
    return () => window.removeEventListener("error", resizeObserverErr);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<ArchNode>[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes as ArchNode[]);
      setNodes(updatedNodes);
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<ArchitectureEdge>[]) => {
      const updatedEdges = applyEdgeChanges(
        changes,
        edges as ArchitectureEdge[]
      );
      setEdges(updatedEdges);
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdgeId = `e-${connection.source}-${connection.target
        }-${Date.now()}`;
      const color = getEdgeColor(newEdgeId);
      const label = "";

      const newEdge: ArchitectureEdge = {
        id: newEdgeId,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: "labeled",
        animated: false,
        label,
        style: { stroke: color, strokeWidth: 2 },
        data: { label, color },
      };
      setEdges([...edges, newEdge]);
    },
    [edges, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const componentData = event.dataTransfer.getData("application/json");
      if (!componentData) return;

      const component: ArchitectureComponent = JSON.parse(componentData);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: ArchNode = {
        id: `${component.id}-${Date.now()}`,
        type: "architecture",
        position,
        data: {
          label: component.name,
          component,
          description: "",
          dummyData: "",
          transformationType: "passthrough",
        },
      };

      addNode(newNode);
      if (isMobile) setLeftSidebarOpen(false);
    },
    [screenToFlowPosition, addNode, isMobile]
  );

  const handleDragStart = (
    event: React.DragEvent,
    component: ArchitectureComponent
  ) => {
    event.dataTransfer.setData("application/json", JSON.stringify(component));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleMobileAddComponent = useCallback(
    (component: ArchitectureComponent) => {
      const position = {
        x: Math.random() * 200 + 100,
        y: Math.random() * 200 + 100,
      };
      const newNode: ArchNode = {
        id: `${component.id}-${Date.now()}`,
        type: "architecture",
        position,
        data: {
          label: component.name,
          component,
          description: "",
          dummyData: "",
          transformationType: "passthrough",
        },
      };
      addNode(newNode);
      setLeftSidebarOpen(false);
      fitView({ padding: 0.2 });
    },
    [addNode, fitView]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
      setSelectedNodeId(null);
    }
    if (selectedEdgeId) {
      deleteEdge(selectedEdgeId);
      setSelectedEdgeId(null);
    }
  }, [selectedNodeId, selectedEdgeId, deleteNode, deleteEdge]);

  const handleExportPng = useCallback(async () => {
    const flowElement = document.querySelector(".react-flow") as HTMLElement;
    if (flowElement) await exportToPng(flowElement, "architecture-diagram");
  }, []);

  const handleExportSvg = useCallback(async () => {
    const flowElement = document.querySelector(".react-flow") as HTMLElement;
    if (flowElement) await exportToSvg(flowElement, "architecture-diagram");
  }, []);

  const handleExportJson = useCallback(() => {
    exportToJson(
      nodes as ArchNode[],
      edges as ArchitectureEdge[],
      "architecture-diagram"
    );
  }, [nodes, edges]);

  const handleStartSimulation = useCallback(() => {
    if (nodes.length === 0) return;
    setSimulation((s) => ({
      ...s,
      isRunning: true,
      isPaused: false,
      steps: [],
      currentNodeId: null,
    }));
    setConsoleOpen(true);

    const runner = createSimulationRunner(
      nodes as ArchNode[],
      edges as ArchitectureEdge[],
      simulation.speed,
      {
        onNodeEnter: (nodeId) =>
          setSimulation((s) => ({ ...s, currentNodeId: nodeId })),
        onNodeProcess: (nodeId, nodeName, input, output) => {
          setSimulation((s) => ({
            ...s,
            steps: [
              ...s.steps,
              {
                nodeId,
                nodeName,
                inputData: input,
                outputData: output,
                timestamp: Date.now(),
              },
            ],
          }));
        },
        onComplete: () =>
          setSimulation((s) => ({
            ...s,
            isRunning: false,
            isPaused: false,
            currentNodeId: null,
          })),
        isPaused: () => simulation.isPaused,
        isStopped: () => !simulation.isRunning,
      }
    );
    runner.run();
  }, [
    nodes,
    edges,
    simulation.speed,
    simulation.isPaused,
    simulation.isRunning,
  ]);

  // Track cursor position for collaboration
  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        updateMyPresence({
          cursor: {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          },
        });
      }
    },
    [updateMyPresence]
  );

  const onPointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Provide store-like interface for PropertiesPanel
  const storeInterface = {
    nodes: [...nodes] as ArchNode[],
    edges: [...edges] as ArchitectureEdge[],
    selectedNodeId,
    selectedEdgeId,
    simulation,
    updateNodeData,
    updateEdgeData,
    deleteSelected: handleDeleteSelected,
    setSelectedNodeId,
    setSelectedEdgeId,
    startSimulation: handleStartSimulation,
    pauseSimulation: () => setSimulation((s) => ({ ...s, isPaused: true })),
    resumeSimulation: () => setSimulation((s) => ({ ...s, isPaused: false })),
    stopSimulation: () =>
      setSimulation((s) => ({ ...s, isRunning: false, currentNodeId: null })),
    clearSimulationSteps: () => setSimulation((s) => ({ ...s, steps: [] })),
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-background overflow-hidden">
      <ConnectionStatus />

      {/* Header */}
      <header className="flex h-12 items-center justify-between border-b border-border/50 bg-background px-3 md:px-4 shrink-0">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <ComponentSidebar
                  onDragStart={handleDragStart}
                  onMobileAdd={handleMobileAddComponent}
                  isMobile
                />
              </SheetContent>
            </Sheet>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <svg
              className="h-4 w-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
              <path d="M12 22V12M2 7l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:block">
            ArchFlow
          </span>
          <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live ({others.length + 1})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Collaboration Avatars */}
          <div className="hidden sm:flex items-center -space-x-2">
            {self && (
              <div
                className="h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-medium text-white"
                style={{ backgroundColor: self.presence.color }}
                title={`${self.presence.name} (you)`}
              >
                {self.presence.name.charAt(0).toUpperCase()}
              </div>
            )}
            {others.slice(0, 3).map((other) => (
              <div
                key={other.connectionId}
                className="h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-medium text-white"
                style={{ backgroundColor: other.presence.color }}
                title={other.presence.name}
              >
                {other.presence.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {others.length > 3 && (
              <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                +{others.length - 3}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs hidden sm:flex text-green-500"
            onClick={() => setCollabPanelOpen(!collabPanelOpen)}
          >
            <Users className="h-3.5 w-3.5" />
            Share
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

      <CollaborationPanel
        isOpen={collabPanelOpen}
        onClose={() => setCollabPanelOpen(false)}
        roomId={roomId}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!isMobile && <ComponentSidebar onDragStart={handleDragStart} />}

        <div className="relative flex flex-1 flex-col min-h-0 overflow-hidden">
          <div
            ref={reactFlowWrapper}
            className="flex-1 min-h-0 touch-none relative"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            <ReactFlow
              nodes={nodes as ArchNode[]}
              edges={edges as ArchitectureEdge[]}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onNodeClick={(_, node) => {
                setSelectedNodeId(node.id);
                updateMyPresence({ selectedNodeId: node.id });
              }}
              onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
              onPaneClick={() => {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                updateMyPresence({ selectedNodeId: null });
                if (isMobile) setRightSidebarOpen(false);
              }}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              colorMode="dark"
              defaultEdgeOptions={{
                type: "labeled",
                style: { strokeWidth: 1.5 },
                animated: false,
              }}
              proOptions={{ hideAttribution: true }}
              panOnDrag
              zoomOnPinch
              preventScrolling
            >
              {showGrid && (
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1}
                  color="#333333"
                />
              )}
              <Controls
                className={cn(
                  "rounded-lg! border-border/50! bg-background! shadow-none! [&>button]:border-border/50! [&>button]:bg-background!",
                  isMobile && "bottom-16! left-2!"
                )}
                showInteractive={false}
              />
              {!isMobile && (
                <MiniMap
                  className="rounded-lg! border-border/50! bg-background/90! shadow-none!"
                  nodeColor={(node) => {
                    const data = node.data as NodeData;
                    return data.component?.color || "#8b5cf6";
                  }}
                  maskColor="rgba(0,0,0,0.8)"
                  pannable
                  zoomable
                />
              )}
            </ReactFlow>

            {/* Remote Cursors */}
            {others.map((other) =>
              other.presence.cursor ? (
                <div
                  key={other.connectionId}
                  className="pointer-events-none absolute z-50 transition-transform duration-75"
                  style={{
                    left: other.presence.cursor.x,
                    top: other.presence.cursor.y,
                    transform: "translate(-4px, -4px)",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5.5 3L19 12L12 13L9 20L5.5 3Z"
                      fill={other.presence.color}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div
                    className="absolute left-4 top-4 px-1.5 py-0.5 rounded text-[10px] text-white whitespace-nowrap"
                    style={{ backgroundColor: other.presence.color }}
                  >
                    {other.presence.name}
                  </div>
                </div>
              ) : null
            )}

            {nodes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {isMobile
                      ? "Tap menu to add components"
                      : "Drag components to start building"}
                  </p>
                </div>
              </div>
            )}

            <AIChatPanel
              isOpen={aiChatOpen}
              onToggle={() => setAiChatOpen(!aiChatOpen)}
              isMobile={isMobile}
            />
          </div>

          <SimulationConsole
            isOpen={consoleOpen}
            onToggle={() => setConsoleOpen(!consoleOpen)}
          />
        </div>

        {!isMobile && <PropertiesPanel store={storeInterface} />}

        {isMobile && (
          <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
            <SheetContent side="right" className="w-[300px] p-0">
              <PropertiesPanel
                store={storeInterface}
                isMobile
                onClose={() => setRightSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}

interface SyncedArchitectureDesignerProps {
  roomId: string;
}

export function SyncedArchitectureDesigner({
  roomId,
}: SyncedArchitectureDesignerProps) {
  return (
    <ReactFlowProvider>
      <SyncedArchitectureDesignerInner roomId={roomId} />
    </ReactFlowProvider>
  );
}
