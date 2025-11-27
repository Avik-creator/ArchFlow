import { Liveblocks } from "@liveblocks/node"
import type { NextRequest } from "next/server"

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_dev_placeholder",
})

const COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#3b82f6",
  "#84cc16",
]

const NAMES = ["Anonymous Architect", "System Designer", "Cloud Builder", "API Crafter", "Data Wizard", "Flow Master"]

export async function POST(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId")

  if (!roomId) {
    return new Response(JSON.stringify({ error: "Missing roomId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Liveblocks not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const randomIndex = Math.floor(Math.random() * NAMES.length)
  const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name: NAMES[randomIndex],
      color: COLORS[randomIndex % COLORS.length],
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    },
  })

  session.allow(roomId, session.FULL_ACCESS)

  const { body, status } = await session.authorize()
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
