import { createClient } from "@liveblocks/client"
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react"
import type { ArchitectureNode, ArchitectureEdge } from "@/lib/architecture-types"

const client = createClient({
  authEndpoint: async (room) => {
    const response = await fetch(`/api/liveblocks-auth?roomId=${room}`, {
      method: "POST",
    })
    return await response.json()
  },
  throttle: 16,
})

type Presence = {
  cursor: { x: number; y: number } | null
  selectedNodeId: string | null
  name: string
  color: string
}

type Storage = {
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
}

type UserMeta = {
  id: string
  info: {
    name: string
    color: string
    picture: string
  }
}

type RoomEvent = {
  type: "SYNC_REQUEST"
}

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useSelf,
  useStorage,
  useMutation,
  useBroadcastEvent,
  useEventListener,
  useStatus,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client)

export const { LiveblocksProvider } = createLiveblocksContext(client)
