"use client"

import * as React from "react"
import { useRealtimeRefresh } from "@/lib/supabase/realtime"
import { RealtimeIndicator } from "@/components/admin/realtime-indicator"

const DASHBOARD_TABLES = [
  { table: "reservations" },
  { table: "vehicles" },
  { table: "maintenance_records" },
] as const

interface DashboardRealtimeWrapperProps {
  children: React.ReactNode
}

/**
 * Thin client wrapper around the admin dashboard Server Component tree.
 *
 * Establishes Supabase Realtime subscriptions for the tables the dashboard
 * displays (reservations, vehicles, maintenance). When any row changes,
 * router.refresh() is triggered, which re-runs the async Server Component
 * and pushes updated data to this page without a full navigation.
 *
 * The live indicator is rendered as a fixed pill in the top-right corner
 * of the dashboard area — it does not displace any existing header content.
 */
export function DashboardRealtimeWrapper({ children }: DashboardRealtimeWrapperProps) {
  const realtimeStatus = useRealtimeRefresh({
    channelName: "admin-dashboard",
    tables: DASHBOARD_TABLES as unknown as { table: string }[],
  })

  return (
    <div className="relative">
      {/* Live status indicator — positioned in the dashboard context */}
      <div className="absolute top-0 right-0 z-10">
        <RealtimeIndicator status={realtimeStatus} />
      </div>
      {children}
    </div>
  )
}
