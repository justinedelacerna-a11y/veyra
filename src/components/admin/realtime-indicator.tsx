"use client"

import * as React from "react"
import { RealtimeStatus } from "@/lib/supabase/realtime"
import { cn } from "@/lib/utils"

interface RealtimeIndicatorProps {
  status: RealtimeStatus
  /** Extra class name for the wrapper */
  className?: string
}

const STATUS_CONFIG: Record<
  RealtimeStatus,
  { label: string; dotClass: string; textClass: string; animate: boolean }
> = {
  connecting: {
    label: "Connecting…",
    dotClass: "bg-amber-400",
    textClass: "text-amber-600",
    animate: true,
  },
  connected: {
    label: "Live",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700 dark:text-emerald-400",
    animate: true,
  },
  disconnected: {
    label: "Offline",
    dotClass: "bg-muted-foreground",
    textClass: "text-muted-foreground",
    animate: false,
  },
  error: {
    label: "Sync error",
    dotClass: "bg-destructive",
    textClass: "text-destructive",
    animate: false,
  },
}

/**
 * Small pill that shows the current Supabase Realtime connection status.
 * Meant to be placed in page headers alongside the data it covers.
 */
export function RealtimeIndicator({ status, className }: RealtimeIndicatorProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-card text-xs font-medium transition-colors",
        className
      )}
      role="status"
      aria-label={`Realtime status: ${config.label}`}
      aria-live="polite"
    >
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          config.dotClass,
          config.animate && "animate-pulse"
        )}
        aria-hidden="true"
      />
      <span className={config.textClass}>{config.label}</span>
    </div>
  )
}
