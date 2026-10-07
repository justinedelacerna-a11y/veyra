"use client"

import * as React from "react"
import { MaintenanceRecord, MaintenanceStatus, MaintenancePriority } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StatusType } from "@/components/common/status-badge"
import { useRealtimeRefresh } from "@/lib/supabase/realtime"
import { RealtimeIndicator } from "@/components/admin/realtime-indicator"

const MAINTENANCE_TABLES = [
  { table: "maintenance_records" },
  { table: "vehicles" },
] as const

const STATUS_BADGE: Record<MaintenanceStatus, { badge: StatusType; label: string }> = {
  scheduled: { badge: "info", label: "Scheduled" },
  due: { badge: "warning", label: "Due" },
  in_progress: { badge: "pending", label: "In Progress" },
  completed: { badge: "success", label: "Completed" },
  overdue: { badge: "error", label: "Overdue" },
}

const PRIORITY_BADGE: Record<MaintenancePriority, { badge: StatusType; label: string }> = {
  low: { badge: "neutral", label: "Low" },
  normal: { badge: "neutral", label: "Normal" },
  high: { badge: "warning", label: "High" },
  urgent: { badge: "error", label: "Urgent" },
}

interface MaintenanceClientProps {
  initialMaintenances: MaintenanceRecord[]
}

export function MaintenanceClient({ initialMaintenances }: MaintenanceClientProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const realtimeStatus = useRealtimeRefresh({
    channelName: "admin-maintenance",
    tables: MAINTENANCE_TABLES as unknown as { table: string }[],
  })

  const filtered = React.useMemo(() => {
    let items = initialMaintenances
    if (statusFilter !== "all") items = items.filter((m) => m.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (m) =>
          m.vehicleName.toLowerCase().includes(q) ||
          m.vehiclePlate.toLowerCase().includes(q) ||
          m.typeLabel.toLowerCase().includes(q) ||
          m.branch.toLowerCase().includes(q)
      )
    }
    return items
  }, [initialMaintenances, search, statusFilter])

  const statusCounts = React.useMemo(() => {
    return initialMaintenances.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [initialMaintenances])

  const overdue = initialMaintenances.filter((m) => m.status === "overdue" || m.status === "due").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Maintenance Schedule"
        description="Live fleet maintenance tracking — scheduled, in-progress, and service bay records."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs border rounded-md px-3 py-1.5 bg-card">
              <span className={`size-2 rounded-full ${overdue > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
              <span>{overdue > 0 ? `${overdue} Alerts Due` : "All Services On Track"}</span>
            </div>
            <RealtimeIndicator status={realtimeStatus} />
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "All Records", value: "all", count: initialMaintenances.length },
          { label: "Scheduled", value: "scheduled", count: statusCounts["scheduled"] || 0 },
          { label: "Due", value: "due", count: statusCounts["due"] || 0 },
          { label: "In Progress", value: "in_progress", count: statusCounts["in_progress"] || 0 },
          { label: "Completed", value: "completed", count: statusCounts["completed"] || 0 },
        ].map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {s.label} <span className="ml-1 opacity-75 font-mono text-[11px]">({s.count})</span>
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search by vehicle, plate, service type, or branch…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => {
          setSearch("")
          setStatusFilter("all")
        }}
        totalCount={filtered.length}
      />

      <DataTableWrapper
        isEmpty={filtered.length === 0}
        emptyTitle="No maintenance records found"
        emptyDescription="Schedule a vehicle service or adjust your status filters."
        totalItems={filtered.length}
        currentPage={1}
        totalPages={1}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Estimated Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => {
              const statusCfg = STATUS_BADGE[m.status] || { badge: "neutral", label: m.status }
              const priorityCfg = PRIORITY_BADGE[m.priority] || { badge: "neutral", label: m.priority }
              return (
                <TableRow key={m.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-sm">{m.vehicleName}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs px-2 py-0.5 rounded border bg-muted/40 font-semibold">
                      {m.vehiclePlate}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{m.typeLabel}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.branch}</TableCell>
                  <TableCell className="text-xs font-medium">{m.scheduledDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={priorityCfg.badge} label={priorityCfg.label} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={statusCfg.badge} label={statusCfg.label} size="sm" />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    ₱{m.estimatedCost.toLocaleString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </DataTableWrapper>
    </div>
  )
}
