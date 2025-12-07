"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import type { Connection } from "@xyflow/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Loader2,
  Trash2,
  MessageSquare,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useArchitectureStore } from "@/lib/architecture-store";
import { COMPONENT_LIBRARY } from "@/lib/architecture-types";
import {
  useCustomIconsStore,
  customIconToComponent,
} from "@/lib/custom-icons-store";
import { useChatHistoryStore, type ChatMode } from "@/lib/chat-history-store";
import ReactMarkdown, {
  type Components as MarkdownComponents,
} from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

type AIMode = ChatMode;

const markdownComponents: MarkdownComponents = {
  code({ inline, className, children, ...props }: any) {
    if (inline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-[0.85em]"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/70 p-3 text-[0.85em]">
        <code className={className}>{children}</code>
      </pre>
    );
  },
  a: ({ children, ...props }) => (
    <a
      {...props}
      className="text-primary underline decoration-dotted underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded border border-border/60">
      {children}
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      {...props}
      className="border border-border/60 bg-muted/40 px-2 py-1 text-left text-[0.85em] font-semibold"
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td {...props} className="border border-border/60 px-2 py-1 text-[0.85em]">
      {children}
    </td>
  ),
  ul: ({ children, ...props }) => (
    <ul {...props} className="list-disc pl-5">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} className="list-decimal pl-5">
      {children}
    </ol>
  ),
};

function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="prose prose-invert text-xs leading-relaxed prose-p:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:mt-3 prose-headings:mb-2 prose-pre:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function AIChatPanel({ isOpen, onToggle, isMobile }: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AIMode>("create");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { nodes, edges, addNode, onConnect } = useArchitectureStore();
  const { icons: customIcons } = useCustomIconsStore();
  const { histories, setHistory, clearHistory } = useChatHistoryStore();
  const historyForMode = histories[mode] ?? [];

  // Merge built-in and custom components
  const allComponents = [
    ...COMPONENT_LIBRARY,
    ...customIcons.map(customIconToComponent),
  ];

  const { messages, sendMessage, status, setMessages } = useChat({
    id: `archflow-${mode}`,
    messages: historyForMode,
    transport: new DefaultChatTransport({
      api: `/api/chat?mode=${mode}`,
    }),
    onFinish: ({ messages: updatedMessages }) => {
      setHistory(mode, updatedMessages);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let messageText = input;

    // Add custom icons context for create mode
    if (mode === "create" && customIcons.length > 0) {
      const customComponentsList = customIcons
        .map((icon) => `${icon.name} (${icon.category})`)
        .join(", ");
      messageText = `[ADDITIONAL COMPONENTS AVAILABLE]\n${customComponentsList}\n\n[USER REQUEST]\n${input}`;
    }

    if (mode === "understand" && nodes.length > 0) {
      const diagramContext = JSON.stringify({
        nodes: nodes.map((n) => ({
          id: n.id,
          label: n.data.label,
          type: n.data.component?.name,
          description: n.data.description,
          hasApi: n.data.apiConfig?.enabled,
        })),
        edges: edges.map((e) => ({
          from: nodes.find((n) => n.id === e.source)?.data.label,
          to: nodes.find((n) => n.id === e.target)?.data.label,
          label: e.label,
        })),
      });
      messageText = `[DIAGRAM CONTEXT]\n${diagramContext}\n\n[USER QUESTION]\n${input}`;
    }

    sendMessage({ text: messageText });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const applyArchitectureSuggestion = (suggestion: {
    components: Array<{ type: string; name: string; description?: string }>;
    connections: Array<{ from: string; to: string; label?: string }>;
  }) => {
    const nodeMap: Record<string, string> = {};

    // Calculate starting position based on existing nodes
    const existingNodes = nodes;
    const startX =
      existingNodes.length > 0
        ? Math.max(...existingNodes.map((n) => n.position.x)) + 300
        : 100;
    const startY = 100;

    // Better spacing to prevent overlapping - generous spacing
    const horizontalSpacing = 280; // Space between node centers horizontally
    const verticalSpacing = 180; // Space between node centers vertically
    const nodesPerRow = 3; // Nodes per row for better readability

    suggestion.components.forEach((comp, index) => {
      const componentDef = allComponents.find(
        (c) =>
          c.id === comp.type.toLowerCase() ||
          c.name.toLowerCase() === comp.type.toLowerCase()
      );
      if (componentDef) {
        const nodeId = `${componentDef.id}-${Date.now()}-${index}`;
        nodeMap[comp.name] = nodeId;

        // Calculate position with proper spacing
        const col = index % nodesPerRow;
        const row = Math.floor(index / nodesPerRow);

        addNode({
          id: nodeId,
          type: "architecture",
          position: {
            x: startX + col * horizontalSpacing,
            y: startY + row * verticalSpacing,
          },
          data: {
            label: comp.name,
            component: componentDef,
            description: comp.description || "",
            dummyData: "",
            transformationType: "passthrough",
          },
        });
      }
    });

    setTimeout(() => {
      suggestion.connections.forEach((conn) => {
        const sourceId = nodeMap[conn.from];
        const targetId = nodeMap[conn.to];
        if (sourceId && targetId) {
          onConnect({
            source: sourceId,
            target: targetId,
            sourceHandle: null,
            targetHandle: null,
            label: conn.label || "",
          } as Connection);
        }
      });
    }, 100);
  };

  const createModePrompts = [
    "Microservices backend",
    "Serverless API",
    "Real-time chat",
    "E-commerce platform",
  ];
  const understandModePrompts = [
    "Explain this architecture",
    "Find bottlenecks",
    "Suggest improvements",
    "Security review",
  ];

  const handleModeChange = (nextMode: AIMode) => {
    if (nextMode === mode) return;
    setHistory(mode, messages);
    setMode(nextMode);
  };

  return (
    <div
      className={cn(
        "absolute z-50 flex flex-col rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm shadow-lg transition-all duration-200",
        isMobile
          ? isOpen
            ? "inset-2 h-auto w-auto"
            : "right-2 bottom-2 h-10 w-10"
          : isOpen
          ? "right-4 bottom-4 h-[480px] w-[360px]"
          : "right-4 bottom-4 h-10 w-10"
      )}
    >
      {!isOpen ? (
        <button
          onClick={onToggle}
          className="flex h-full w-full items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col border-b border-border/50 shrink-0">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Assistant</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => {
                    setMessages([]);
                    clearHistory(mode);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={onToggle}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex gap-1 px-3 pb-2">
              <button
                onClick={() => handleModeChange("create")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === "create"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <Wand2 className="h-3 w-3" />
                Create
              </button>
              <button
                onClick={() => handleModeChange("understand")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === "understand"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="h-3 w-3" />
                Understand
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="mb-3 rounded-full bg-muted/50 p-3">
                  {mode === "create" ? (
                    <Wand2 className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {mode === "create"
                    ? "Describe what you want to build"
                    : nodes.length > 0
                    ? "Ask questions about your diagram"
                    : "Add components to analyze"}
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {(mode === "create"
                    ? createModePrompts
                    : understandModePrompts
                  ).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-xs",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        let displayText = part.text;
                        if (
                          message.role === "user" &&
                          displayText.includes("[DIAGRAM CONTEXT]")
                        ) {
                          displayText =
                            displayText.split("[USER QUESTION]")[1]?.trim() ||
                            displayText;
                        }
                        return (
                          <MarkdownMessage key={index} text={displayText} />
                        );
                      }
                      const legacyToolInvocation =
                        part.type === "tool-invocation"
                          ? (
                              part as {
                                toolInvocation?: {
                                  toolName?: string;
                                  state?: string;
                                  result?: unknown;
                                };
                              }
                            ).toolInvocation
                          : undefined;
                      const isLegacyToolPart =
                        legacyToolInvocation?.toolName ===
                          "suggestArchitecture" &&
                        legacyToolInvocation?.state === "result";
                      const isNewToolPart =
                        (part.type === "tool-suggestArchitecture" ||
                          (part.type === "dynamic-tool" &&
                            part.toolName === "suggestArchitecture")) &&
                        part.state === "output-available" &&
                        "output" in part &&
                        !!part.output &&
                        (part as { preliminary?: boolean }).preliminary !==
                          true;

                      if (isLegacyToolPart || isNewToolPart) {
                        const suggestion = (
                          isLegacyToolPart
                            ? (legacyToolInvocation!.result as unknown)
                            : (part as { output: unknown }).output
                        ) as {
                          name: string;
                          components: Array<{
                            type: string;
                            name: string;
                            description?: string;
                          }>;
                          connections: Array<{
                            from: string;
                            to: string;
                            label?: string;
                          }>;
                        };
                        return (
                          <div
                            key={index}
                            className="mt-2 p-2 rounded bg-background/50 border border-border/50"
                          >
                            <p className="text-[10px] text-muted-foreground mb-1.5">
                              {suggestion.components.length} components
                            </p>
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs"
                              onClick={() =>
                                applyArchitectureSuggestion(suggestion)
                              }
                            >
                              Apply to Canvas
                            </Button>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.1s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border/50 p-2 shrink-0"
          >
            <div className="flex gap-1.5">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "create"
                    ? "Describe your architecture..."
                    : "Ask about your diagram..."
                }
                className="min-h-[36px] max-h-[80px] resize-none text-xs bg-muted/30 border-border/50"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
