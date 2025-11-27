import type { ArchitectureNode, ArchitectureEdge, NodeData, ApiConfig } from "./architecture-types"

export function findStartNodes(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): ArchitectureNode[] {
  const targetNodeIds = new Set(edges.map((e) => e.target))
  return nodes.filter((n) => !targetNodeIds.has(n.id))
}

export function getOutgoingEdges(nodeId: string, edges: ArchitectureEdge[]): ArchitectureEdge[] {
  return edges.filter((e) => e.source === nodeId)
}

function parseExpressions(template: string, inputData: unknown): string {
  if (!template) return template

  return template.replace(/\{\{\s*\$input(?:\.([a-zA-Z0-9_.]+))?\s*\}\}/g, (match, path) => {
    if (!path) {
      // {{$input}} - return entire input
      return typeof inputData === "object" ? JSON.stringify(inputData) : String(inputData)
    }

    // {{$input.field}} or {{$input.nested.field}}
    const parts = path.split(".")
    let value: unknown = inputData

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return match // Return original if path not found
      }
    }

    return typeof value === "object" ? JSON.stringify(value) : String(value)
  })
}

function buildRequestBody(bodyTemplate: string | undefined, inputData: unknown): string | undefined {
  if (!bodyTemplate) {
    return inputData ? JSON.stringify(inputData) : undefined
  }

  // Parse expressions in the body template
  const parsedBody = parseExpressions(bodyTemplate, inputData)

  // Try to validate it's valid JSON after parsing
  try {
    JSON.parse(parsedBody)
    return parsedBody
  } catch {
    // If not valid JSON, wrap it
    return parsedBody
  }
}

async function executeApiCall(apiConfig: ApiConfig, inputData: unknown): Promise<unknown> {
  if (!apiConfig.enabled || !apiConfig.url) {
    return inputData
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...apiConfig.headers,
    }

    const options: RequestInit = {
      method: apiConfig.method,
      headers,
    }

    if (["POST", "PUT", "PATCH"].includes(apiConfig.method)) {
      options.body = buildRequestBody(apiConfig.body, inputData)
    }

    let url = parseExpressions(apiConfig.url, inputData)

    // For GET requests, append input data as query params if no body specified
    if (apiConfig.method === "GET" && inputData && typeof inputData === "object" && !apiConfig.body) {
      const params = new URLSearchParams()
      Object.entries(inputData as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const queryString = params.toString()
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString
      }
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      return {
        _error: true,
        _status: response.status,
        _statusText: response.statusText,
        _input: inputData,
      }
    }

    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      const jsonResponse = await response.json()
      return jsonResponse
    } else {
      const textResponse = await response.text()
      return {
        _response: textResponse,
        _status: response.status,
      }
    }
  } catch (error) {
    return {
      _error: true,
      _message: error instanceof Error ? error.message : "API call failed",
      _input: inputData,
    }
  }
}

export async function transformData(
  inputData: unknown,
  transformationType: NodeData["transformationType"],
  apiConfig?: ApiConfig,
): Promise<unknown> {
  const data = typeof inputData === "object" ? { ...(inputData as object) } : inputData

  switch (transformationType) {
    case "add-timestamp":
      return {
        ...(typeof data === "object" ? data : { value: data }),
        timestamp: new Date().toISOString(),
        processedAt: Date.now(),
      }

    case "filter":
      if (typeof data === "object" && data !== null) {
        const filtered: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(data)) {
          if (value !== null && value !== undefined && value !== "") {
            filtered[key] = value
          }
        }
        return filtered
      }
      return data

    case "transform":
      return {
        original: data,
        transformed: true,
        meta: { version: "1.0", engine: "archflow" },
      }

    case "aggregate":
      return {
        aggregated: true,
        data: Array.isArray(data) ? data : [data],
        count: Array.isArray(data) ? data.length : 1,
      }

    case "api-call":
      if (apiConfig?.enabled) {
        return await executeApiCall(apiConfig, inputData)
      }
      return data

    case "passthrough":
    default:
      return data
  }
}

export function parseNodeData(dummyData: string | undefined): unknown {
  if (!dummyData) return { _empty: true }
  try {
    return JSON.parse(dummyData)
  } catch {
    return { raw: dummyData }
  }
}

export interface SimulationRunner {
  run: () => Promise<void>
  stop: () => void
}

export function createSimulationRunner(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  speed: number,
  callbacks: {
    onNodeEnter: (nodeId: string) => void
    onNodeProcess: (nodeId: string, nodeName: string, input: unknown, output: unknown) => void
    onComplete: () => void
    isPaused: () => boolean
    isStopped: () => boolean
  },
): SimulationRunner {
  let stopped = false

  const delay = (ms: number) =>
    new Promise<void>((resolve) => {
      const check = () => {
        if (stopped || callbacks.isStopped()) {
          resolve()
          return
        }
        if (callbacks.isPaused()) {
          setTimeout(check, 100)
          return
        }
        resolve()
      }
      setTimeout(check, ms)
    })

  const processNode = async (node: ArchitectureNode, inputData: unknown): Promise<void> => {
    if (stopped || callbacks.isStopped()) return

    callbacks.onNodeEnter(node.id)
    await delay(speed)

    const output = await transformData(inputData, node.data.transformationType, node.data.apiConfig)
    callbacks.onNodeProcess(node.id, node.data.label, inputData, output)

    const outgoing = getOutgoingEdges(node.id, edges)
    for (const edge of outgoing) {
      const targetNode = nodes.find((n) => n.id === edge.target)
      if (targetNode) {
        await processNode(targetNode, output)
      }
    }
  }

  return {
    run: async () => {
      const startNodes = findStartNodes(nodes, edges)

      for (const startNode of startNodes) {
        if (stopped || callbacks.isStopped()) break
        const initialData = parseNodeData(startNode.data.dummyData)
        await processNode(startNode, initialData)
      }

      if (!stopped && !callbacks.isStopped()) {
        callbacks.onComplete()
      }
    },
    stop: () => {
      stopped = true
    },
  }
}
