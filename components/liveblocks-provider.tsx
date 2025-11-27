"use client"

import type { PropsWithChildren } from "react"
import { LiveblocksProvider } from "@/liveblocks.config"

interface LiveblocksWrapperProps extends PropsWithChildren {}

export function LiveblocksWrapper({ children }: LiveblocksWrapperProps) {
  return <LiveblocksProvider>{children}</LiveblocksProvider>
}
