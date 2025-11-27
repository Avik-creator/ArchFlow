"use client"

import { useEffect, useState, useCallback } from "react"
import { X, Globe, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, HelpCircle, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useArchitectureStore } from "@/lib/architecture-store"
import { iconMap } from "./nodes/node-icons"
import type { NodeData, ApiConfig, ArchitectureNode, ArchitectureEdge } from "@/lib/architecture-types"
import { cn } from "@/lib/utils"

interface StoreInterface {
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void
  updateEdgeData: (edgeId: string, data: { label?: string }) => void
  setSelectedNodeId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void
}

interface PropertiesPanelProps {
  isMobile?: boolean
  onClose?: () => void
  store?: StoreInterface // Optional external store for synced mode
}

export function PropertiesPanel({ isMobile, onClose, store }: PropertiesPanelProps) {
  const zustandStore = useArchitectureStore()
  const activeStore = store || zustandStore

  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    setSelectedNodeId,
    setSelectedEdgeId,
    updateNodeData,
    updateEdgeData,
  } = activeStore

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)

  const [nodeLabel, setNodeLabel] = useState("")
  const [nodeDescription, setNodeDescription] = useState("")
  const [nodeDummyData, setNodeDummyData] = useState("")
  const [nodeTransform, setNodeTransform] = useState<NodeData["transformationType"]>("passthrough")
  const [edgeLabel, setEdgeLabel] = useState("")

  // API Config State
  const [apiEnabled, setApiEnabled] = useState(false)
  const [apiType, setApiType] = useState<ApiConfig["type"]>("fetch")
  const [apiMethod, setApiMethod] = useState<ApiConfig["method"]>("GET")
  const [apiUrl, setApiUrl] = useState("")
  const [apiHeaders, setApiHeaders] = useState("")
  const [apiBody, setApiBody] = useState("")
  const [copiedExpr, setCopiedExpr] = useState<string | null>(null)

  useEffect(() => {
    if (selectedNode) {
      setNodeLabel(selectedNode.data.label)
      setNodeDescription(selectedNode.data.description || "")
      setNodeDummyData(selectedNode.data.dummyData || "")
      setNodeTransform(selectedNode.data.transformationType || "passthrough")

      const apiConfig = selectedNode.data.apiConfig
      if (apiConfig) {
        setApiEnabled(apiConfig.enabled)
        setApiType(apiConfig.type)
        setApiMethod(apiConfig.method)
        setApiUrl(apiConfig.url)
        setApiHeaders(apiConfig.headers ? JSON.stringify(apiConfig.headers, null, 2) : "")
        setApiBody(apiConfig.body || "")
      } else {
        setApiEnabled(false)
        setApiType("fetch")
        setApiMethod("GET")
        setApiUrl("")
        setApiHeaders("")
        setApiBody("")
      }
    }
  }, [selectedNode])

  useEffect(() => {
    if (selectedEdge) {
      setEdgeLabel((selectedEdge.label as string) || "")
    }
  }, [selectedEdge])

  const handleNodeUpdate = useCallback(() => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, {
        label: nodeLabel,
        description: nodeDescription,
        dummyData: nodeDummyData,
        transformationType: nodeTransform,
      })
    }
  }, [selectedNodeId, nodeLabel, nodeDescription, nodeDummyData, nodeTransform, updateNodeData])

  const saveApiConfig = useCallback(
    (
      updates: Partial<{
        enabled: boolean
        type: ApiConfig["type"]
        method: ApiConfig["method"]
        url: string
        headersStr: string
        body: string
      }>,
    ) => {
      if (!selectedNodeId) return

      const newEnabled = updates.enabled ?? apiEnabled
      const newType = updates.type ?? apiType
      const newMethod = updates.method ?? apiMethod
      const newUrl = updates.url ?? apiUrl
      const newHeaders = updates.headersStr ?? apiHeaders
      const newBody = updates.body ?? apiBody

      let headers: Record<string, string> | undefined
      try {
        headers = newHeaders ? JSON.parse(newHeaders) : undefined
      } catch {
        headers = undefined
      }

      updateNodeData(selectedNodeId, {
        apiConfig: {
          enabled: newEnabled,
          type: newType,
          method: newMethod,
          url: newUrl,
          headers,
          body: newBody,
        },
        transformationType: newEnabled ? "api-call" : nodeTransform === "api-call" ? "passthrough" : nodeTransform,
      })
    },
    [selectedNodeId, apiEnabled, apiType, apiMethod, apiUrl, apiHeaders, apiBody, nodeTransform, updateNodeData],
  )

  const handleEdgeUpdate = useCallback(() => {
    if (selectedEdgeId) {
      updateEdgeData(selectedEdgeId, { label: edgeLabel })
    }
  }, [selectedEdgeId, edgeLabel, updateEdgeData])

  const toggleApiEnabled = useCallback(() => {
    const newEnabled = !apiEnabled
    setApiEnabled(newEnabled)
    saveApiConfig({ enabled: newEnabled })
  }, [apiEnabled, saveApiConfig])

  const copyExpression = (expr: string) => {
    navigator.clipboard.writeText(expr)
    setCopiedExpr(expr)
    setTimeout(() => setCopiedExpr(null), 1500)
  }

  const handleClose = () => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    onClose?.()
  }

  if (!selectedNode && !selectedEdge) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center border-l border-border/40 bg-background/50 p-6 text-center flex-shrink-0",
          isMobile ? "w-full" : "w-72",
        )}
      >
        <p className="text-xs text-muted-foreground">Select a node or edge to edit</p>
      </div>
    )
  }

  if (selectedNode) {
    const IconComponent = iconMap[selectedNode.data.component?.icon]

    return (
      <TooltipProvider delayDuration={300}>
        <div
          className={cn(
            "flex h-full flex-col border-l border-border/40 bg-background/50 flex-shrink-0",
            isMobile ? "w-full border-l-0" : "w-72",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded"
                style={{ backgroundColor: `${selectedNode.data.component?.color || "#8b5cf6"}20` }}
              >
                {IconComponent && (
                  <IconComponent className="h-3.5 w-3.5" style={{ color: selectedNode.data.component?.color }} />
                )}
              </div>
              <span className="text-sm font-medium truncate max-w-[140px]">{selectedNode.data.label}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-transparent h-9 p-0 px-4">
                <TabsTrigger
                  value="general"
                  className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 pb-2"
                >
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="api"
                  className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 pb-2"
                >
                  API
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 pb-2"
                >
                  Data
                </TabsTrigger>
              </TabsList>

              <div className="p-4">
                {/* General Tab */}
                <TabsContent value="general" className="space-y-4 mt-0">
                  <div className="space-y-1.5">
                    <Label htmlFor="node-label" className="text-xs text-muted-foreground">
                      Label
                    </Label>
                    <Input
                      id="node-label"
                      value={nodeLabel}
                      onChange={(e) => setNodeLabel(e.target.value)}
                      onBlur={handleNodeUpdate}
                      placeholder="Node name"
                      className="h-9 text-sm bg-muted/20 border-border/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="node-desc" className="text-xs text-muted-foreground">
                      Description
                    </Label>
                    <Textarea
                      id="node-desc"
                      value={nodeDescription}
                      onChange={(e) => setNodeDescription(e.target.value)}
                      onBlur={handleNodeUpdate}
                      placeholder="Optional description"
                      rows={2}
                      className="text-sm bg-muted/20 border-border/40 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transform" className="text-xs text-muted-foreground">
                      Transform
                    </Label>
                    <Select
                      value={nodeTransform}
                      onValueChange={(v) => {
                        setNodeTransform(v as NodeData["transformationType"])
                        if (selectedNodeId) {
                          updateNodeData(selectedNodeId, {
                            transformationType: v as NodeData["transformationType"],
                          })
                        }
                      }}
                    >
                      <SelectTrigger id="transform" className="h-9 text-sm bg-muted/20 border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passthrough">Pass Through</SelectItem>
                        <SelectItem value="add-timestamp">Add Timestamp</SelectItem>
                        <SelectItem value="filter">Filter Fields</SelectItem>
                        <SelectItem value="transform">Transform</SelectItem>
                        <SelectItem value="aggregate">Aggregate</SelectItem>
                        <SelectItem value="api-call">API Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* API Tab */}
                <TabsContent value="api" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Globe className={`h-4 w-4 ${apiEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
                      <span className="text-sm">Enable API</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleApiEnabled}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        apiEnabled ? "bg-emerald-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          apiEnabled ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {apiEnabled && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Method</Label>
                          <Select
                            value={apiMethod}
                            onValueChange={(v) => {
                              const newMethod = v as ApiConfig["method"]
                              setApiMethod(newMethod)
                              saveApiConfig({ method: newMethod })
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                              <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <Select
                            value={apiType}
                            onValueChange={(v) => {
                              const newType = v as ApiConfig["type"]
                              setApiType(newType)
                              saveApiConfig({ type: newType })
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs bg-muted/20 border-border/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fetch">
                                <span className="flex items-center gap-1.5">
                                  <ArrowDownToLine className="h-3 w-3" /> Fetch
                                </span>
                              </SelectItem>
                              <SelectItem value="send">
                                <span className="flex items-center gap-1.5">
                                  <ArrowUpFromLine className="h-3 w-3" /> Send
                                </span>
                              </SelectItem>
                              <SelectItem value="both">
                                <span className="flex items-center gap-1.5">
                                  <ArrowLeftRight className="h-3 w-3" /> Both
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">URL</Label>
                        <Input
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          onBlur={() => saveApiConfig({ url: apiUrl })}
                          placeholder="https://api.example.com/endpoint"
                          className="h-9 text-xs font-mono bg-muted/20 border-border/40"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Headers (JSON)</Label>
                        <Textarea
                          value={apiHeaders}
                          onChange={(e) => setApiHeaders(e.target.value)}
                          onBlur={() => saveApiConfig({ headersStr: apiHeaders })}
                          placeholder={'{\n  "Authorization": "Bearer token"\n}'}
                          rows={3}
                          className="text-xs font-mono bg-muted/20 border-border/40 resize-none"
                        />
                      </div>

                      {apiMethod !== "GET" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Body</Label>
                          <Textarea
                            value={apiBody}
                            onChange={(e) => setApiBody(e.target.value)}
                            onBlur={() => saveApiConfig({ body: apiBody })}
                            placeholder={'{"key": "{{$input.key}}"}'}
                            rows={3}
                            className="text-xs font-mono bg-muted/20 border-border/40 resize-none"
                          />
                        </div>
                      )}

                      <div className="space-y-2 pt-2 border-t border-border/40">
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Expressions</span>
                        </div>
                        <div className="space-y-1">
                          {[
                            { expr: "{{$input}}", desc: "Full input data" },
                            { expr: "{{$input.field}}", desc: "Specific field" },
                            { expr: '"{{$input}}"', desc: "Quoted string" },
                          ].map((item) => (
                            <div
                              key={item.expr}
                              className="flex items-center justify-between p-2 rounded bg-muted/30 group"
                            >
                              <div className="space-y-0.5">
                                <code className="text-xs text-emerald-400">{item.expr}</code>
                                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => copyExpression(item.expr)}
                              >
                                {copiedExpr === item.expr ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Data Tab */}
                <TabsContent value="data" className="space-y-4 mt-0">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Simulation Data (JSON)</Label>
                    <Textarea
                      value={nodeDummyData}
                      onChange={(e) => setNodeDummyData(e.target.value)}
                      onBlur={handleNodeUpdate}
                      placeholder={'{\n  "id": 1,\n  "name": "Test"\n}'}
                      rows={6}
                      className="text-xs font-mono bg-muted/20 border-border/40 resize-none"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    This data will be used as input when running simulations. Use valid JSON format.
                  </p>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  // Edge selected
  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-border/40 bg-background/50 flex-shrink-0",
        isMobile ? "w-full border-l-0" : "w-72",
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 flex-shrink-0">
        <span className="text-sm font-medium">Connection</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edge-label" className="text-xs text-muted-foreground">
            Label
          </Label>
          <Input
            id="edge-label"
            value={edgeLabel}
            onChange={(e) => setEdgeLabel(e.target.value)}
            onBlur={handleEdgeUpdate}
            placeholder="Connection label"
            className="h-9 text-sm bg-muted/20 border-border/40"
          />
        </div>
      </div>
    </div>
  )
}
