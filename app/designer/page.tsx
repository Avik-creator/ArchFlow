"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ArchitectureDesigner } from "@/components/architecture-designer"
import { SyncedArchitectureDesigner } from "@/components/synced-architecture-designer"
import { LiveblocksWrapper } from "@/components/liveblocks-provider"
import { CollaborationRoom } from "@/components/collaboration-room"
import { Loader2 } from "lucide-react"

function DesignerContent() {
  const searchParams = useSearchParams()
  const roomId = searchParams.get("room")

  if (!roomId) {
    return <ArchitectureDesigner />
  }

  return (
    <LiveblocksWrapper>
      <CollaborationRoom roomId={roomId}>
        <SyncedArchitectureDesigner roomId={roomId} />
      </CollaborationRoom>
    </LiveblocksWrapper>
  )
}

export default function DesignerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <DesignerContent />
    </Suspense>
  )
}
