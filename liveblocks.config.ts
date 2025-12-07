import { createClient, LiveList, LiveObject } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: async (room) => {
    const response = await fetch(`/api/liveblocks-auth?roomId=${room}`, {
      method: "POST",
    });
    return await response.json();
  },
  throttle: 16,
});

type Presence = {
  cursor: { x: number; y: number } | null;
  selectedNodeId: string | null;
  name: string;
  color: string;
};

// Serializable versions of node/edge data for Liveblocks storage
export type SerializedNodeData = {
  label: string;
  component: {
    id: string;
    name: string;
    category: string;
    icon: string;
    description: string;
    color: string;
    iconUrl?: string;
  };
  description?: string;
  dummyData?: string;
  transformationType?: string;
  customTransform?: string;
  apiConfig?: {
    enabled: boolean;
    type: string;
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
    responseMapping?: string;
  };
};

export type SerializedNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: SerializedNodeData;
};

export type SerializedEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  data?: {
    label?: string;
    animated?: boolean;
  };
};

type Storage = {
  nodes: LiveList<LiveObject<SerializedNode>>;
  edges: LiveList<LiveObject<SerializedEdge>>;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
    picture: string;
  };
};

type RoomEvent = {
  type: "SYNC_REQUEST";
};

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
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export const { LiveblocksProvider } = createLiveblocksContext(client);
