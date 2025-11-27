import { convertToModelMessages, streamText, tool, type UIMessage } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

const architectureSuggestionSchema = z.object({
  name: z.string().describe("Name of the architecture"),
  components: z.array(
    z.object({
      type: z.string().describe("Component type like server, database, loadbalancer"),
      name: z.string().describe("Label for the component"),
      description: z.string().optional(),
    }),
  ),
  connections: z.array(
    z.object({
      from: z.string().describe("Source component name"),
      to: z.string().describe("Target component name"),
      label: z.string().optional(),
    }),
  ),
})

export const maxDuration = 45

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const url = new URL(req.url)
  const mode = url.searchParams.get("mode") || "create"

  const prompt = convertToModelMessages(messages)

  const systemPrompt =
    mode === "understand"
      ? `You are ArchFlow AI, an expert at analyzing and explaining system architecture diagrams. 

When given a diagram context (JSON with nodes and edges), you can:
- Explain what the architecture does and how data flows through it
- Identify potential bottlenecks, single points of failure, or scalability issues
- Suggest improvements for performance, security, or reliability
- Answer specific questions about how components interact
- Provide security reviews and best practice recommendations

Always be specific and reference actual components from the diagram by their labels.
Format your responses clearly with component names in **bold**.
Keep responses helpful and actionable.`
      : `You are ArchFlow AI, an expert architecture design assistant. You help users design system architectures by suggesting:
- What components to add (servers, databases, load balancers, etc.)
- How to connect them
- Best practices for scalability, security, and performance
- API configurations for data flow

When users describe what they want to build, provide specific actionable suggestions.
You can suggest adding these component types: Server, Container, Function, Kubernetes, VM, Database, NoSQL DB, Cache, Object Storage, File System, Load Balancer, API Gateway, CDN, Firewall, DNS, User, Browser, Mobile App, IoT Device, AWS, GCP, Azure, Cloud, Queue, Event Bus, Pub/Sub, Webhook, HTTP Request, REST API, GraphQL, WebSocket.

Format your responses clearly with component names in **bold** when suggesting them.
Keep responses concise and actionable.`

  const tools =
    mode === "create"
      ? {
        suggestArchitecture: tool({
          description: "Suggest a complete architecture with components and connections",
          inputSchema: architectureSuggestionSchema,
          execute: async (params: z.infer<typeof architectureSuggestionSchema>) => {
            return params
          },
        }),
      }
      : undefined

  const result = streamText({
    model: groq("moonshotai/kimi-k2-instruct-0905"),
    system: systemPrompt,
    messages: prompt,
    tools,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
