"use client"

import { useState } from "react"
import { Users, Copy, Check, Link2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CollaborationPanelProps {
  isOpen: boolean
  onClose: () => void
  roomId?: string | null
}

export function CollaborationPanel({ isOpen, onClose, roomId }: CollaborationPanelProps) {
  const [newRoomId, setNewRoomId] = useState("")
  const [copied, setCopied] = useState(false)

  const currentUrl = typeof window !== "undefined" ? window.location.origin : ""
  const shareUrl = roomId ? `${currentUrl}/designer?room=${roomId}` : ""

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateRoom = () => {
    const id = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`
    window.location.href = `/designer?room=${id}`
  }

  const handleJoinRoom = () => {
    if (newRoomId.trim()) {
      window.location.href = `/designer?room=${newRoomId.trim()}`
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute left-1/2 top-16 z-50 w-[320px] -translate-x-1/2 rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Collaboration</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {roomId ? (
          // Already in a room - show share options
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Share this link to invite others to collaborate in real-time.
            </p>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-xs bg-muted/30 h-8" />
              <Button size="sm" variant="outline" className="h-8 px-2 shrink-0 bg-transparent" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">
                Room ID: <span className="font-mono text-foreground">{roomId}</span>
              </p>
            </div>
          </div>
        ) : (
          // Not in a room - show create/join options
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium">Create a new room</p>
              <Button size="sm" className="w-full h-8 text-xs" onClick={handleCreateRoom}>
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                Create Room
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium">Join existing room</p>
              <div className="flex gap-2">
                <Input
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="text-xs bg-muted/30 h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 shrink-0 text-xs bg-transparent"
                  onClick={handleJoinRoom}
                  disabled={!newRoomId.trim()}
                >
                  Join
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/50">
          All data stays in your browser. Collaboration is peer-to-peer.
        </p>
      </div>
    </div>
  )
}
