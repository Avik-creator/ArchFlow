/**
 * Predefined Challenge Definitions
 *
 * This file contains all built-in architecture challenges organized by difficulty.
 * Challenges cover web applications, microservices, real-time systems, and data pipelines.
 *
 * Requirements: 5.1, 5.2
 */

import type { Challenge } from "./challenge-types";

// ============================================================================
// Beginner Challenges
// ============================================================================

const simpleWebApp: Challenge = {
  id: "beginner-simple-web-app",
  title: "Simple Web Application",
  difficulty: "beginner",
  category: "web-applications",
  description:
    "Design a basic web application architecture with a frontend, backend API, and database. This is a foundational pattern used in most web applications.",
  requirements: [
    {
      id: "req-1",
      description:
        "Include a web frontend component (e.g., React, Vue, or static HTML)",
      evaluationCriteria:
        "Architecture must contain a frontend/client component that serves the user interface",
    },
    {
      id: "req-2",
      description: "Include a backend API server to handle business logic",
      evaluationCriteria:
        "Architecture must contain a backend/API server component that processes requests",
    },
    {
      id: "req-3",
      description: "Include a database for persistent data storage",
      evaluationCriteria:
        "Architecture must contain a database component for storing application data",
    },
    {
      id: "req-4",
      description: "Connect the frontend to the backend API",
      evaluationCriteria:
        "There must be a connection/edge from the frontend to the backend API",
    },
    {
      id: "req-5",
      description: "Connect the backend API to the database",
      evaluationCriteria:
        "There must be a connection/edge from the backend API to the database",
    },
  ],
  hints: [
    "Start by placing the three main components: Frontend, API Server, and Database",
    "Use arrows to show the direction of data flow - typically Frontend → API → Database",
    "Consider labeling your connections with the type of communication (HTTP, SQL, etc.)",
  ],
  isCustom: false,
};

const basicRestApi: Challenge = {
  id: "beginner-basic-rest-api",
  title: "Basic REST API",
  difficulty: "beginner",
  category: "web-applications",
  description:
    "Design a REST API architecture that serves data to multiple client types. Focus on the API layer and its connections to data storage.",
  requirements: [
    {
      id: "req-1",
      description: "Include an API Gateway or load balancer as the entry point",
      evaluationCriteria:
        "Architecture must contain an API Gateway or load balancer component",
    },
    {
      id: "req-2",
      description: "Include at least one REST API service",
      evaluationCriteria:
        "Architecture must contain at least one API/service component",
    },
    {
      id: "req-3",
      description: "Include a database for data persistence",
      evaluationCriteria: "Architecture must contain a database component",
    },
    {
      id: "req-4",
      description:
        "Show at least two different client types (web, mobile, etc.)",
      evaluationCriteria:
        "Architecture must contain at least two distinct client components",
    },
  ],
  hints: [
    "An API Gateway acts as a single entry point for all clients",
    "Different clients (web browser, mobile app) can connect to the same API Gateway",
    "The API service sits between the gateway and the database",
  ],
  isCustom: false,
};

const staticWebsite: Challenge = {
  id: "beginner-static-website",
  title: "Static Website with CDN",
  difficulty: "beginner",
  category: "web-applications",
  description:
    "Design a static website architecture using a CDN for global content delivery. Learn about edge caching and content distribution.",
  requirements: [
    {
      id: "req-1",
      description:
        "Include a CDN (Content Delivery Network) for content distribution",
      evaluationCriteria: "Architecture must contain a CDN component",
    },
    {
      id: "req-2",
      description: "Include an origin server or storage for static assets",
      evaluationCriteria:
        "Architecture must contain a storage or origin server component",
    },
    {
      id: "req-3",
      description: "Show users/clients connecting through the CDN",
      evaluationCriteria:
        "Architecture must show client connections going through the CDN",
    },
    {
      id: "req-4",
      description: "Include a DNS component for domain resolution",
      evaluationCriteria: "Architecture must contain a DNS component",
    },
  ],
  hints: [
    "Users first hit DNS to resolve the domain name",
    "The CDN serves cached content from edge locations close to users",
    "The origin server is only contacted when the CDN cache misses",
  ],
  isCustom: false,
};

// ============================================================================
// Intermediate Challenges
// ============================================================================

const microservicesBasic: Challenge = {
  id: "intermediate-microservices-basic",
  title: "Microservices Architecture",
  difficulty: "intermediate",
  category: "microservices",
  description:
    "Design a microservices architecture with multiple independent services communicating through an API gateway. Implement service separation and inter-service communication.",
  requirements: [
    {
      id: "req-1",
      description: "Include an API Gateway as the single entry point",
      evaluationCriteria:
        "Architecture must contain an API Gateway component that routes requests",
    },
    {
      id: "req-2",
      description: "Include at least 3 separate microservices",
      evaluationCriteria:
        "Architecture must contain at least 3 distinct service components",
    },
    {
      id: "req-3",
      description:
        "Each microservice should have its own database (database per service pattern)",
      evaluationCriteria:
        "Each microservice must be connected to its own dedicated database",
    },
    {
      id: "req-4",
      description: "Include a service discovery or service registry component",
      evaluationCriteria:
        "Architecture must contain a service discovery/registry component",
    },
    {
      id: "req-5",
      description:
        "Show inter-service communication between at least two services",
      evaluationCriteria:
        "At least two microservices must have a direct connection for communication",
    },
  ],
  hints: [
    "Common microservices include User Service, Order Service, Product Service, etc.",
    "Service discovery helps services find and communicate with each other",
    "The API Gateway routes external requests to the appropriate microservice",
    "Consider using a message queue for asynchronous inter-service communication",
  ],
  isCustom: false,
};

const cachingLayer: Challenge = {
  id: "intermediate-caching-layer",
  title: "Application with Caching Layer",
  difficulty: "intermediate",
  category: "web-applications",
  description:
    "Design a web application architecture that implements caching at multiple levels to improve performance. Learn about cache-aside pattern and cache invalidation.",
  requirements: [
    {
      id: "req-1",
      description: "Include a web application frontend",
      evaluationCriteria:
        "Architecture must contain a frontend/client component",
    },
    {
      id: "req-2",
      description: "Include a backend API server",
      evaluationCriteria: "Architecture must contain a backend API component",
    },
    {
      id: "req-3",
      description:
        "Include a caching layer (e.g., Redis, Memcached) between API and database",
      evaluationCriteria:
        "Architecture must contain a cache component positioned between the API and database",
    },
    {
      id: "req-4",
      description: "Include a primary database",
      evaluationCriteria: "Architecture must contain a database component",
    },
    {
      id: "req-5",
      description:
        "Show the cache-aside pattern: API checks cache first, then database",
      evaluationCriteria:
        "API must have connections to both cache and database, with cache checked first",
    },
    {
      id: "req-6",
      description: "Include a CDN for static asset caching",
      evaluationCriteria:
        "Architecture must contain a CDN component for frontend asset caching",
    },
  ],
  hints: [
    "Redis or Memcached are popular choices for application-level caching",
    "The cache-aside pattern: check cache → if miss, query database → store in cache → return",
    "CDN caching is separate from application caching - it handles static assets",
    "Consider showing the data flow for both cache hits and cache misses",
  ],
  isCustom: false,
};

const messageQueueSystem: Challenge = {
  id: "intermediate-message-queue",
  title: "Event-Driven Architecture with Message Queue",
  difficulty: "intermediate",
  category: "microservices",
  description:
    "Design an event-driven system using message queues for asynchronous communication between services. Implement the publish-subscribe pattern.",
  requirements: [
    {
      id: "req-1",
      description:
        "Include a message broker/queue (e.g., RabbitMQ, Kafka, SQS)",
      evaluationCriteria:
        "Architecture must contain a message queue or message broker component",
    },
    {
      id: "req-2",
      description:
        "Include at least one producer service that publishes messages",
      evaluationCriteria:
        "At least one service must have an outgoing connection to the message queue",
    },
    {
      id: "req-3",
      description:
        "Include at least two consumer services that process messages",
      evaluationCriteria:
        "At least two services must have incoming connections from the message queue",
    },
    {
      id: "req-4",
      description: "Include an API layer for external requests",
      evaluationCriteria:
        "Architecture must contain an API component for handling external requests",
    },
    {
      id: "req-5",
      description: "Show dead letter queue for failed message handling",
      evaluationCriteria:
        "Architecture must contain a dead letter queue component",
    },
  ],
  hints: [
    "Message queues decouple producers from consumers",
    "Multiple consumers can process messages from the same queue (competing consumers)",
    "A dead letter queue stores messages that fail processing for later analysis",
    "Common use cases: order processing, notification sending, data synchronization",
  ],
  isCustom: false,
};

// ============================================================================
// Advanced Challenges
// ============================================================================

const realTimeChat: Challenge = {
  id: "advanced-real-time-chat",
  title: "Real-Time Chat System",
  difficulty: "advanced",
  category: "real-time-systems",
  description:
    "Design a scalable real-time chat application supporting millions of concurrent users. Implement WebSocket connections, message persistence, and presence tracking.",
  requirements: [
    {
      id: "req-1",
      description:
        "Include WebSocket servers for real-time bidirectional communication",
      evaluationCriteria:
        "Architecture must contain WebSocket server components",
    },
    {
      id: "req-2",
      description:
        "Include a load balancer to distribute WebSocket connections",
      evaluationCriteria:
        "Architecture must contain a load balancer in front of WebSocket servers",
    },
    {
      id: "req-3",
      description:
        "Include a pub/sub system (e.g., Redis Pub/Sub) for message broadcasting across servers",
      evaluationCriteria:
        "Architecture must contain a pub/sub component connecting multiple WebSocket servers",
    },
    {
      id: "req-4",
      description: "Include a message database for chat history persistence",
      evaluationCriteria:
        "Architecture must contain a database for storing message history",
    },
    {
      id: "req-5",
      description: "Include a presence service for tracking online users",
      evaluationCriteria:
        "Architecture must contain a presence/status tracking component",
    },
    {
      id: "req-6",
      description:
        "Include a notification service for offline message delivery",
      evaluationCriteria:
        "Architecture must contain a notification service component",
    },
    {
      id: "req-7",
      description: "Include a CDN for media/file sharing",
      evaluationCriteria:
        "Architecture must contain a CDN or storage component for media files",
    },
  ],
  hints: [
    "WebSocket servers maintain persistent connections with clients",
    "Redis Pub/Sub allows messages to be broadcast across multiple WebSocket server instances",
    "Presence service typically uses Redis with TTL for tracking online status",
    "Consider separating read and write paths for message storage",
    "Push notifications handle message delivery when users are offline",
  ],
  isCustom: false,
};

const dataIngestionPipeline: Challenge = {
  id: "advanced-data-pipeline",
  title: "Real-Time Data Ingestion Pipeline",
  difficulty: "advanced",
  category: "data-pipelines",
  description:
    "Design a data pipeline that ingests, processes, and stores large volumes of streaming data in real-time. Implement the lambda architecture pattern.",
  requirements: [
    {
      id: "req-1",
      description: "Include data ingestion endpoints (API or collectors)",
      evaluationCriteria:
        "Architecture must contain data ingestion/collector components",
    },
    {
      id: "req-2",
      description:
        "Include a streaming platform (e.g., Kafka, Kinesis) for data buffering",
      evaluationCriteria:
        "Architecture must contain a streaming/message platform component",
    },
    {
      id: "req-3",
      description:
        "Include a stream processing layer (e.g., Flink, Spark Streaming)",
      evaluationCriteria:
        "Architecture must contain a stream processing component",
    },
    {
      id: "req-4",
      description:
        "Include a batch processing layer for historical data analysis",
      evaluationCriteria:
        "Architecture must contain a batch processing component",
    },
    {
      id: "req-5",
      description:
        "Include a data lake or data warehouse for long-term storage",
      evaluationCriteria:
        "Architecture must contain a data lake or data warehouse component",
    },
    {
      id: "req-6",
      description: "Include a serving layer for query access (speed layer)",
      evaluationCriteria:
        "Architecture must contain a serving/query layer component",
    },
    {
      id: "req-7",
      description: "Include monitoring and alerting components",
      evaluationCriteria:
        "Architecture must contain monitoring/alerting components",
    },
  ],
  hints: [
    "Lambda architecture has three layers: batch, speed (real-time), and serving",
    "Kafka acts as the central nervous system, buffering data for both batch and stream processing",
    "Stream processing provides low-latency results, batch processing ensures accuracy",
    "The serving layer merges results from both batch and speed layers",
    "Consider data partitioning and retention policies for the streaming platform",
  ],
  isCustom: false,
};

// ============================================================================
// Challenge Collections
// ============================================================================

/**
 * All beginner-level challenges
 */
export const beginnerChallenges: Challenge[] = [
  simpleWebApp,
  basicRestApi,
  staticWebsite,
];

/**
 * All intermediate-level challenges
 */
export const intermediateChallenges: Challenge[] = [
  microservicesBasic,
  cachingLayer,
  messageQueueSystem,
];

/**
 * All advanced-level challenges
 */
export const advancedChallenges: Challenge[] = [
  realTimeChat,
  dataIngestionPipeline,
];

/**
 * All predefined challenges combined
 */
export const predefinedChallenges: Challenge[] = [
  ...beginnerChallenges,
  ...intermediateChallenges,
  ...advancedChallenges,
];

/**
 * Get challenges by difficulty level
 */
export function getChallengesByDifficulty(
  difficulty: "beginner" | "intermediate" | "advanced"
): Challenge[] {
  return predefinedChallenges.filter((c) => c.difficulty === difficulty);
}

/**
 * Get challenges by category
 */
export function getChallengesByCategory(
  category: Challenge["category"]
): Challenge[] {
  return predefinedChallenges.filter((c) => c.category === category);
}

/**
 * Get a challenge by ID
 */
export function getChallengeById(id: string): Challenge | undefined {
  return predefinedChallenges.find((c) => c.id === id);
}
