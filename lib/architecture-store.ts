import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ArchitectureNode,
  ArchitectureEdge,
  SimulationState,
  SimulationStep,
  NodeData,
} from "./architecture-types";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
} from "@xyflow/react";
import { getEdgeColor } from "@/lib/utils";

interface ArchitectureStore {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  simulation: SimulationState;

  // Node/Edge actions
  setNodes: (nodes: ArchitectureNode[]) => void;
  setEdges: (edges: ArchitectureEdge[]) => void;
  onNodesChange: (changes: NodeChange<ArchitectureNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ArchitectureEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: ArchitectureNode) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateEdgeData: (edgeId: string, data: Partial<{ label: string }>) => void;
  deleteSelected: () => void;
  clearCanvas: () => void;

  // Selection
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;

  // Simulation
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stopSimulation: () => void;
  addSimulationStep: (step: SimulationStep) => void;
  setCurrentSimulationNode: (nodeId: string | null) => void;
  setSimulationSpeed: (speed: number) => void;
  clearSimulationSteps: () => void;
}

const EDGE_STROKE_WIDTH = 2;

const enhanceEdges = (edges: ArchitectureEdge[]) =>
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

export const useArchitectureStore = create<ArchitectureStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      simulation: {
        isRunning: false,
        isPaused: false,
        currentNodeId: null,
        steps: [],
        speed: 1000,
      },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges: enhanceEdges(edges) }),

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: enhanceEdges(applyEdgeChanges(changes, get().edges)),
        });
      },

      onConnect: (connection) => {
        // Check minimum distance between nodes and adjust if needed
        const currentNodes = get().nodes;
        const sourceNode = currentNodes.find((n) => n.id === connection.source);
        const targetNode = currentNodes.find((n) => n.id === connection.target);
        let updatedNodes = currentNodes;

        if (sourceNode && targetNode) {
          const dx = targetNode.position.x - sourceNode.position.x;
          const dy = targetNode.position.y - sourceNode.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = 200; // Minimum distance between connected nodes

          // If nodes are too close, move target node away
          if (distance < minDistance) {
            // Handle case where nodes are at same position
            const angle = distance < 1 ? Math.PI / 4 : Math.atan2(dy, dx);
            const newX = sourceNode.position.x + Math.cos(angle) * minDistance;
            const newY = sourceNode.position.y + Math.sin(angle) * minDistance;

            updatedNodes = currentNodes.map((n) =>
              n.id === connection.target
                ? { ...n, position: { x: newX, y: newY } }
                : n
            );
          }
        }

        const edgeId = `e-${connection.source ?? "unknown"}-${
          connection.target ?? "unknown"
        }-${Date.now()}`;
        const color = getEdgeColor(edgeId);
        const connWithData = connection as Connection & {
          data?: { label?: string };
          label?: string;
        };
        const labelFromData =
          typeof connWithData.data?.label === "string"
            ? connWithData.data.label
            : "";
        const labelFromConnection =
          typeof connWithData.label === "string" ? connWithData.label : "";
        const label = labelFromConnection || labelFromData;

        set({
          nodes: updatedNodes,
          edges: enhanceEdges(
            addEdge(
              {
                ...connection,
                id: edgeId,
                type: "labeled",
                animated: false,
                label,
                style: { stroke: color, strokeWidth: 2 },
                data: { label, color },
              },
              get().edges
            )
          ),
        });
      },

      addNode: (node) => {
        set({ nodes: [...get().nodes, node] });
      },

      updateNodeData: (nodeId, data) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
        });
      },

      updateEdgeData: (edgeId, data) => {
        set({
          edges: get().edges.map((edge) =>
            edge.id === edgeId
              ? { ...edge, label: data.label, data: { ...edge.data, ...data } }
              : edge
          ),
        });
      },

      deleteSelected: () => {
        const { selectedNodeId, selectedEdgeId, nodes, edges } = get();
        if (selectedNodeId) {
          set({
            nodes: nodes.filter((n) => n.id !== selectedNodeId),
            edges: edges.filter(
              (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
            ),
            selectedNodeId: null,
          });
        }
        if (selectedEdgeId) {
          set({
            edges: edges.filter((e) => e.id !== selectedEdgeId),
            selectedEdgeId: null,
          });
        }
      },

      clearCanvas: () => {
        set({
          nodes: [],
          edges: [],
          selectedNodeId: null,
          selectedEdgeId: null,
        });
      },

      setSelectedNodeId: (id) =>
        set({ selectedNodeId: id, selectedEdgeId: null }),
      setSelectedEdgeId: (id) =>
        set({ selectedEdgeId: id, selectedNodeId: null }),

      startSimulation: () =>
        set({
          simulation: {
            ...get().simulation,
            isRunning: true,
            isPaused: false,
            steps: [],
            currentNodeId: null,
          },
        }),

      pauseSimulation: () =>
        set({
          simulation: { ...get().simulation, isPaused: true },
        }),

      resumeSimulation: () =>
        set({
          simulation: { ...get().simulation, isPaused: false },
        }),

      stopSimulation: () =>
        set({
          simulation: {
            ...get().simulation,
            isRunning: false,
            isPaused: false,
            currentNodeId: null,
          },
        }),

      addSimulationStep: (step) =>
        set({
          simulation: {
            ...get().simulation,
            steps: [...get().simulation.steps, step],
          },
        }),

      setCurrentSimulationNode: (nodeId) =>
        set({
          simulation: { ...get().simulation, currentNodeId: nodeId },
        }),

      setSimulationSpeed: (speed) =>
        set({
          simulation: { ...get().simulation, speed },
        }),

      clearSimulationSteps: () =>
        set({
          simulation: { ...get().simulation, steps: [] },
        }),
    }),
    {
      name: "archflow-canvas-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
