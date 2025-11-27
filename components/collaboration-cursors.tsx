"use client"

import { useOthers, useSelf } from "@liveblocks/react/suspense"

export function CollaborationCursors() {
  const others = useOthers()

  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        if (!presence.cursor) return null

        return (
          <div
            key={connectionId}
            className="pointer-events-none absolute z-50 transition-transform duration-75"
            style={{
              left: presence.cursor.x,
              top: presence.cursor.y,
              transform: "translate(-4px, -4px)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={info.color} className="drop-shadow-md">
              <path d="M5.65376 12.4561L8.06366 14.8661L14.8657 8.06405L5.65376 2.65405V12.4561Z" />
            </svg>
            <span
              className="absolute left-4 top-4 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs text-white"
              style={{ backgroundColor: info.color }}
            >
              {info.name}
            </span>
          </div>
        )
      })}
    </>
  )
}

export function CollaborationAvatars() {
  const others = useOthers()
  const self = useSelf()

  const allUsers = [
    ...(self ? [{ connectionId: "self", info: self.info }] : []),
    ...others.map((other) => ({ connectionId: other.connectionId, info: other.info })),
  ]

  if (allUsers.length === 0) return null

  return (
    <div className="flex items-center -space-x-2">
      {allUsers.slice(0, 5).map(({ connectionId, info }) => (
        <div
          key={connectionId}
          className="relative h-7 w-7 rounded-full border-2 border-background overflow-hidden"
          style={{ backgroundColor: info.color }}
          title={info.name}
        >
          <img src={info.picture || "/placeholder.svg"} alt={info.name} className="h-full w-full object-cover" />
        </div>
      ))}
      {allUsers.length > 5 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
          +{allUsers.length - 5}
        </div>
      )}
    </div>
  )
}
