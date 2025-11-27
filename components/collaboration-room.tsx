"use client"

import type { PropsWithChildren } from "react"
import { RoomProvider, useStatus } from "@/liveblocks.config"
import { ClientSideSuspense } from "@liveblocks/react"
import { Loader2 } from "lucide-react"

interface CollaborationRoomProps extends PropsWithChildren {
  roomId: string
}

export function CollaborationRoom({ roomId, children }: CollaborationRoomProps) {
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const randomName = `User-${Math.floor(Math.random() * 9000) + 1000}`

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        selectedNodeId: null,
        name: randomName,
        color: randomColor,
      }}
      initialStorage={{
        nodes: [],
        edges: [],
      }}
    >
      <ClientSideSuspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Connecting to room...</p>
            </div>
          </div>
        }
      >
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  )
}

export function ConnectionStatus() {
  const status = useStatus()

  const statusConfig: Record<
    ReturnType<typeof useStatus>,
    { label: string; indicatorClass: string; textClass: string }
  > = {
    initial: {
      label: "Initializing collaboration",
      indicatorClass: "bg-muted",
      textClass: "text-muted-foreground",
    },
    connecting: {
      label: "Connecting…",
      indicatorClass: "bg-amber-500",
      textClass: "text-amber-500",
    },
    connected: {
      label: "Live sync active",
      indicatorClass: "bg-emerald-500",
      textClass: "text-emerald-500",
    },
    disconnected: {
      label: "Reconnecting…",
      indicatorClass: "bg-rose-500",
      textClass: "text-rose-500",
    },
    reconnecting: {
      label: "Trying to reconnect…",
      indicatorClass: "bg-amber-500",
      textClass: "text-amber-500",
    },
  }

  const config = statusConfig[status] ?? statusConfig.initial

  return (
    <div className="flex items-center gap-2 border-b border-border/50 bg-background/80 px-3 py-2 text-xs">
      <span className={`h-2 w-2 rounded-full ${config.indicatorClass} animate-pulse`} aria-hidden />
      <span className={`font-medium ${config.textClass}`}>{config.label}</span>
    </div>
  )
}
