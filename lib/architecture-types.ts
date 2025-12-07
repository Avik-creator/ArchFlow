import type { Node, Edge } from "@xyflow/react";

export type ComponentCategory =
  | "compute"
  | "storage"
  | "network"
  | "clients"
  | "cloud"
  | "messaging"
  | "api";

export interface ApiConfig {
  enabled: boolean;
  type: "fetch" | "send" | "both";
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  body?: string;
  responseMapping?: string;
}

export interface ArchitectureComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  icon: string;
  description: string;
  color: string;
  iconUrl?: string; // Optional URL for external icons (e.g., from Simple Icons CDN)
}

export interface NodeData extends Record<string, unknown> {
  label: string;
  component: ArchitectureComponent;
  description?: string;
  dummyData?: string;
  transformationType?:
    | "passthrough"
    | "add-timestamp"
    | "filter"
    | "transform"
    | "aggregate"
    | "api-call";
  customTransform?: string;
  apiConfig?: ApiConfig; // Added API config to nodes
}

export interface EdgeData extends Record<string, unknown> {
  label?: string;
  animated?: boolean;
}

export type ArchitectureNode = Node<NodeData>;
export type ArchitectureEdge = Edge<EdgeData>;

export interface SimulationStep {
  nodeId: string;
  nodeName: string;
  inputData: unknown;
  outputData: unknown;
  timestamp: number;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentNodeId: string | null;
  steps: SimulationStep[];
  speed: number;
}

export const COMPONENT_LIBRARY: ArchitectureComponent[] = [
  // Compute
  {
    id: "server",
    name: "Server",
    category: "compute",
    icon: "server",
    description: "Application server",
    color: "#3b82f6",
  },
  {
    id: "container",
    name: "Docker",
    category: "compute",
    icon: "container",
    description: "Docker container",
    color: "#2496ED",
    iconUrl: "https://cdn.simpleicons.org/docker/2496ED",
  },
  {
    id: "lambda",
    name: "Lambda",
    category: "compute",
    icon: "lambda",
    description: "AWS Lambda function",
    color: "#FF9900",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "compute",
    icon: "kubernetes",
    description: "K8s cluster",
    color: "#326CE5",
    iconUrl: "https://cdn.simpleicons.org/kubernetes/326CE5",
  },
  {
    id: "vm",
    name: "Virtual Machine",
    category: "compute",
    icon: "vm",
    description: "Virtual machine instance",
    color: "#8b5cf6",
  },

  // Storage
  {
    id: "database",
    name: "PostgreSQL",
    category: "storage",
    icon: "database",
    description: "PostgreSQL database",
    color: "#4169E1",
    iconUrl: "https://cdn.simpleicons.org/postgresql/4169E1",
  },
  {
    id: "nosql",
    name: "MongoDB",
    category: "storage",
    icon: "nosql",
    description: "MongoDB database",
    color: "#47A248",
    iconUrl: "https://cdn.simpleicons.org/mongodb/47A248",
  },
  {
    id: "cache",
    name: "Redis",
    category: "storage",
    icon: "cache",
    description: "Redis cache",
    color: "#DC382D",
    iconUrl: "https://cdn.simpleicons.org/redis/DC382D",
  },
  {
    id: "storage",
    name: "S3",
    category: "storage",
    icon: "storage",
    description: "AWS S3 storage",
    color: "#569A31",
  },
  {
    id: "filesystem",
    name: "File System",
    category: "storage",
    icon: "filesystem",
    description: "File storage",
    color: "#84cc16",
  },

  // Network
  {
    id: "loadbalancer",
    name: "Load Balancer",
    category: "network",
    icon: "loadbalancer",
    description: "Traffic distribution",
    color: "#a855f7",
  },
  {
    id: "apigateway",
    name: "API Gateway",
    category: "network",
    icon: "apigateway",
    description: "API management",
    color: "#FF4F8B",
  },
  {
    id: "cdn",
    name: "Cloudflare",
    category: "network",
    icon: "cdn",
    description: "CDN & Security",
    color: "#F38020",
    iconUrl: "https://cdn.simpleicons.org/cloudflare/F38020",
  },
  {
    id: "firewall",
    name: "Firewall",
    category: "network",
    icon: "firewall",
    description: "Security firewall",
    color: "#ef4444",
  },
  {
    id: "dns",
    name: "DNS",
    category: "network",
    icon: "dns",
    description: "Domain name system",
    color: "#6366f1",
  },

  // Clients
  {
    id: "user",
    name: "User",
    category: "clients",
    icon: "user",
    description: "End user",
    color: "#8b5cf6",
  },
  {
    id: "browser",
    name: "Browser",
    category: "clients",
    icon: "browser",
    description: "Web browser",
    color: "#f59e0b",
  },
  {
    id: "mobile",
    name: "Mobile App",
    category: "clients",
    icon: "mobile",
    description: "Mobile application",
    color: "#10b981",
  },
  {
    id: "iot",
    name: "IoT Device",
    category: "clients",
    icon: "iot",
    description: "IoT device",
    color: "#06b6d4",
  },

  // Cloud
  {
    id: "aws",
    name: "AWS",
    category: "cloud",
    icon: "aws",
    description: "Amazon Web Services",
    color: "#FF9900",
  },
  {
    id: "gcp",
    name: "GCP",
    category: "cloud",
    icon: "gcp",
    description: "Google Cloud Platform",
    color: "#4285F4",
    iconUrl: "https://cdn.simpleicons.org/googlecloud/4285F4",
  },
  {
    id: "azure",
    name: "Azure",
    category: "cloud",
    icon: "azure",
    description: "Microsoft Azure",
    color: "#0078D4",
  },
  {
    id: "cloud",
    name: "Cloud",
    category: "cloud",
    icon: "cloud",
    description: "Generic cloud",
    color: "#6366f1",
  },

  // Messaging
  {
    id: "queue",
    name: "RabbitMQ",
    category: "messaging",
    icon: "queue",
    description: "Message queue",
    color: "#FF6600",
    iconUrl: "https://cdn.simpleicons.org/rabbitmq/FF6600",
  },
  {
    id: "eventbus",
    name: "Kafka",
    category: "messaging",
    icon: "eventbus",
    description: "Event streaming",
    color: "#231F20",
    iconUrl: "https://cdn.simpleicons.org/apachekafka/231F20",
  },
  {
    id: "pubsub",
    name: "Pub/Sub",
    category: "messaging",
    icon: "pubsub",
    description: "Google Pub/Sub",
    color: "#4285F4",
    iconUrl: "https://cdn.simpleicons.org/googlecloud/4285F4",
  },
  {
    id: "webhook",
    name: "Webhook",
    category: "messaging",
    icon: "webhook",
    description: "HTTP webhook",
    color: "#8b5cf6",
  },

  // API
  {
    id: "http-request",
    name: "HTTP Request",
    category: "api",
    icon: "http",
    description: "Make HTTP API calls",
    color: "#22c55e",
  },
  {
    id: "rest-api",
    name: "REST API",
    category: "api",
    icon: "rest",
    description: "RESTful API endpoint",
    color: "#3b82f6",
  },
  {
    id: "graphql",
    name: "GraphQL",
    category: "api",
    icon: "graphql",
    description: "GraphQL API",
    color: "#E10098",
    iconUrl: "https://cdn.simpleicons.org/graphql/E10098",
  },
  {
    id: "websocket",
    name: "WebSocket",
    category: "api",
    icon: "websocket",
    description: "Real-time WebSocket",
    color: "#f59e0b",
  },
];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  compute: "Compute",
  storage: "Storage",
  network: "Network",
  clients: "Clients",
  cloud: "Cloud",
  messaging: "Messaging",
  api: "API", // Added API category
};
