"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "./client"

// ─── Types ────────────────────────────────────────────────────────────────────

export type RealtimeStatus = "connecting" | "connected" | "disconnected" | "error"

export interface RealtimeTableConfig {
  /** Supabase table name to subscribe to */
  table: string
  /** Optional schema (defaults to "public") */
  schema?: string
  /** Optional filter e.g. "status=eq.active" */
  filter?: string
  /** Events to listen to. Defaults to all: INSERT, UPDATE, DELETE */
  events?: ("INSERT" | "UPDATE" | "DELETE" | "*")[]
}

export interface UseRealtimeRefreshOptions {
  /** Tables to subscribe to */
  tables: RealtimeTableConfig[]
  /** Minimum ms between consecutive refreshes (debounce). Default: 1000 */
  debounceMs?: number
  /** Channel name suffix for uniqueness */
  channelName: string
  /** Called whenever connection status changes */
  onStatusChange?: (status: RealtimeStatus) => void
  /** If false, subscriptions are not established. Default: true */
  enabled?: boolean
}

// ─── useRealtimeRefresh ───────────────────────────────────────────────────────

/**
 * Subscribes to one or more Supabase Realtime channels and triggers
 * `router.refresh()` on any matching database change event.
 *
 * Uses the anonymous/public Supabase client — Realtime RLS is enforced
 * server-side; the admin pages that consume this hook are already protected
 * by middleware and server-side auth checks.
 *
 * Returns the current connection status so callers can render an indicator.
 *
 * Pattern: emit refresh signal → Next.js re-runs the Server Component tree
 * with fresh data. No client-side join logic is duplicated.
 */
export function useRealtimeRefresh({
  tables,
  debounceMs = 1000,
  channelName,
  onStatusChange,
  enabled = true,
}: UseRealtimeRefreshOptions) {
  const router = useRouter()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatusState] = useState<RealtimeStatus>("connecting")
  const prevStatusRef = useRef<RealtimeStatus>("connecting")

  const setStatus = useCallback(
    (next: RealtimeStatus) => {
      if (prevStatusRef.current !== next) {
        prevStatusRef.current = next
        setStatusState(next)
        onStatusChange?.(next)
      }
    },
    [onStatusChange]
  )

  const triggerRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.refresh()
    }, debounceMs)
  }, [router, debounceMs])

  useEffect(() => {
    if (!enabled || tables.length === 0) return

    const supabase = createClient()
    const channel = supabase.channel(`veyra-realtime-${channelName}`)

    tables.forEach(({ table, schema = "public", filter, events = ["*"] }) => {
      events.forEach((event) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = {
          event,
          schema,
          table,
        }
        if (filter) config.filter = filter

        channel.on("postgres_changes", config, () => {
          triggerRefresh()
        })
      })
    })

    channel
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setStatus("connected")
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setStatus("error")
        } else if (status === "CLOSED") {
          setStatus("disconnected")
        } else {
          setStatus("connecting")
        }
      })

    channelRef.current = channel

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
      setStatus("disconnected")
    }
  // Tables array identity should be stable (defined outside or useMemo'd by caller)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, channelName, triggerRefresh, setStatus])

  return status
}
