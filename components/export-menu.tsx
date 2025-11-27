"use client"

import { useState } from "react"
import { Download, FileJson, ImageIcon, FileCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface ExportMenuProps {
  onExportPng: () => Promise<void>
  onExportSvg: () => Promise<void>
  onExportJson: () => void
}

export function ExportMenu({ onExportPng, onExportSvg, onExportJson }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<string | null>(null)

  const handleExport = async (type: string, exportFn: () => Promise<void> | void) => {
    setIsExporting(true)
    setExportType(type)
    try {
      await exportFn()
    } catch (error) {
      console.error(`Export ${type} failed:`, error)
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Export</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Export As</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport("png", onExportPng)} disabled={isExporting} className="text-sm">
            <ImageIcon className="mr-2 h-3.5 w-3.5" />
            PNG Image
            {exportType === "png" && <Loader2 className="ml-auto h-3 w-3 animate-spin" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("svg", onExportSvg)} disabled={isExporting} className="text-sm">
            <FileCode className="mr-2 h-3.5 w-3.5" />
            SVG Vector
            {exportType === "svg" && <Loader2 className="ml-auto h-3 w-3 animate-spin" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleExport("json", async () => onExportJson())}
            disabled={isExporting}
            className="text-sm"
          >
            <FileJson className="mr-2 h-3.5 w-3.5" />
            JSON Data
            {exportType === "json" && <Loader2 className="ml-auto h-3 w-3 animate-spin" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
