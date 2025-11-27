import { create } from "zustand"
import type {
  ArchitectureNode,
  ArchitectureEdge,
  SimulationState,
  SimulationStep,
  NodeData,
} from "./architecture-types"
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
} from "@xyflow/react"

interface ArchitectureStore {
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  simulation: SimulationState

  // Node/Edge actions
  setNodes: (nodes: ArchitectureNode[]) => void
  setEdges: (edges: ArchitectureEdge[]) => void
  onNodesChange: (changes: NodeChange<ArchitectureNode>[]) => void
  onEdgesChange: (changes: EdgeChange<ArchitectureEdge>[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: ArchitectureNode) => void
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void
  updateEdgeData: (edgeId: string, data: Partial<{ label: string }>) => void
  deleteSelected: () => void
  clearCanvas: () => void

  // Selection
  setSelectedNodeId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void

  // Simulation
  startSimulation: () => void
  pauseSimulation: () => void
  resumeSimulation: () => void
  stopSimulation: () => void
  addSimulationStep: (step: SimulationStep) => void
  setCurrentSimulationNode: (nodeId: string | null) => void
  setSimulationSpeed: (speed: number) => void
  clearSimulationSteps: () => void
}

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
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
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#6366f1", strokeWidth: 2 },
          data: { label: "" },
        },
        get().edges,
      ),
    })
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] })
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node)),
    })
  },

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === edgeId ? { ...edge, label: data.label, data: { ...edge.data, ...data } } : edge,
      ),
    })
  },

  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId, nodes, edges } = get()
    if (selectedNodeId) {
      set({
        nodes: nodes.filter((n) => n.id !== selectedNodeId),
        edges: edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
        selectedNodeId: null,
      })
    }
    if (selectedEdgeId) {
      set({
        edges: edges.filter((e) => e.id !== selectedEdgeId),
        selectedEdgeId: null,
      })
    }
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null })
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

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
}))
