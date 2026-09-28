"use client"

import * as React from "react"
import { MOCK_MAINTENANCE } from "@/lib/mock/admin-ops"
import { MaintenanceStatus, MaintenancePriority } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StatusType } from "@/components/common/status-badge"

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

export default function AdminMaintenancePage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const filtered = React.useMemo(() => {
    let items = MOCK_MAINTENANCE
    if (statusFilter !== "all") items = items.filter((m) => m.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (m) =>
          m.vehicleName.toLowerCase().includes(q) ||
          m.typeLabel.toLowerCase().includes(q) ||
          m.branch.toLowerCase().includes(q)
      )
    }
    return items
  }, [search, statusFilter])

  const statusCounts = React.useMemo(() => {
    return MOCK_MAINTENANCE.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [])

  const overdue = MOCK_MAINTENANCE.filter((m) => m.status === "overdue" || m.status === "due").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Schedule"
        description="Fleet maintenance tracking — scheduled, in-progress, overdue, and completed service records."
        actions={
          overdue > 0 ? (
            <StatusBadge status="error" label={`${overdue} Urgent/Overdue`} />
          ) : <StatusBadge status="success" label="No Overdue Items" />
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {["all", "overdue", "due", "in_progress", "scheduled", "completed"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
            {s !== "all" && statusCounts[s] ? ` (${statusCounts[s]})` : ""}
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search by vehicle, type, or branch…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => { setSearch(""); setStatusFilter("all") }}
        totalCount={filtered.length}
      />

      <DataTableWrapper isEmpty={filtered.length === 0} totalItems={filtered.length} currentPage={1} totalPages={1}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Est. Cost</TableHead>
              <TableHead>Provider</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => {
              const statusCfg = STATUS_BADGE[m.status]
              const priorityCfg = PRIORITY_BADGE[m.priority]
              return (
                <TableRow key={m.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{m.vehicleName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{m.vehiclePlate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{m.typeLabel}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{m.branch}</TableCell>
                  <TableCell className="text-sm font-medium">{m.scheduledDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={priorityCfg.badge} label={priorityCfg.label} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={statusCfg.badge} label={statusCfg.label} size="sm" />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {m.currency}{m.estimatedCost.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.provider || "—"}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </DataTableWrapper>
    </div>
  )
}
