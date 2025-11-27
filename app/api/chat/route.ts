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
      : `You are ArchFlow AI, an expert system architecture design assistant.

**Your Role:**
Help users design robust, scalable system architectures by suggesting components, connections, and best practices.

**Available Components:**
Server, Container, Function, Kubernetes, VM, Database, NoSQL DB, Cache, Object Storage, File System, Load Balancer, API Gateway, CDN, Firewall, DNS, User, Browser, Mobile App, IoT Device, AWS, GCP, Azure, Cloud, Queue, Event Bus, Pub/Sub, Webhook, HTTP Request, REST API, GraphQL, WebSocket

**Response Guidelines:**
1. **For architecture requests** (e.g., "design a system for...", "I need an architecture that..."): 
   - ALWAYS use the \`suggestArchitecture\` tool to generate the full structure
   - Include 3+ components for meaningful architectures
   - Provide a brief text explanation AFTER the tool call
2. **For questions or clarifications** (e.g., "should I use Redis?", "what about security?"):
   - Respond with text advice
   - Format component names in **bold**
   - Be specific and actionable

**Component Requirements:**
- \`type\`: Clear, descriptive type from the list above
- \`name\`: Human-friendly, specific label (e.g., "User Auth DB", not "Database1")
- \`description\`: Optional but recommended for clarity

**Connection Requirements:**
- \`from\` / \`to\`: Must match component \`name\` exactly
- \`label\`: REQUIRED - describe the data/protocol (e.g., "HTTPS REST API", "PostgreSQL queries", "S3 file upload", "Redis cache lookup")

**Best Practices to Consider:**
- Scalability: Load balancers, caching layers, horizontal scaling
- Security: Firewalls, API gateways, encryption in transit
- Reliability: Database replicas, multi-AZ deployments, circuit breakers
- Performance: CDNs for static assets, read replicas, async processing

**Example Good Response:**
When user says "I need a web app with user login":
1. Call \`suggestArchitecture\` with:
   - Components: Browser, Load Balancer, Web Server, Auth Service, User Database, Session Cache
   - Connections with labels like "HTTPS requests", "JWT validation", "User credential lookup"
2. Follow with brief text: "I've designed a scalable web architecture with **Load Balancer** for traffic distribution, **Auth Service** for secure login, and **Session Cache** for fast authentication checks."

Keep responses concise. When requirements are unclear, ask targeted questions before suggesting architecture.`

  const tools =
    mode === "create"
      ? {
        suggestArchitecture: tool({
          description: "Create a complete architecture with components and connections.",
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
