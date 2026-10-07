"use client"

import * as React from "react"
import { AuditEvent, AuditAction } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { StatusType } from "@/components/common/status-badge"

const ACTION_FILTERS: { label: string; value: string }[] = [
  { label: "All Actions", value: "all" },
  { label: "Reservations", value: "reservation" },
  { label: "Payments", value: "payment" },
  { label: "Vehicles", value: "vehicle" },
  { label: "Fleet", value: "fleet" },
  { label: "Inspections", value: "inspection" },
  { label: "Customers", value: "customer" },
  { label: "Users", value: "user" },
  { label: "Settings", value: "settings" },
]

const PAGE_SIZE = 20

interface AuditClientProps {
  initialEvents: AuditEvent[]
}

export function AuditClient({ initialEvents }: AuditClientProps) {
  const [search, setSearch] = React.useState("")
  const [actionFilter, setActionFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    let items = initialEvents
    if (actionFilter !== "all") {
      items = items.filter((e) => e.action.startsWith(actionFilter))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (e) =>
          e.actorName.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.resource.toLowerCase().includes(q) ||
          e.resourceId.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q)
      )
    }
    return items
  }, [initialEvents, search, actionFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const paginated = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)

  function actionBadge(action: AuditAction): StatusType {
    if (action.includes("cancelled") || action.includes("suspended") || action.includes("rejected")) return "error"
    if (action.includes("payment")) return "warning"
    if (action.includes("completed") || action.includes("confirmed")) return "success"
    if (action.includes("maintenance") || action.includes("inspection")) return "pending"
    return "neutral"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Immutable record of all system actions — bookings, payments, fleet changes, and staff operations."
      />

      {/* Action category filters */}
      <div className="flex flex-wrap gap-1.5">
        {ACTION_FILTERS.map((af) => {
          const count =
            af.value === "all"
              ? initialEvents.length
              : initialEvents.filter((e) => e.action.startsWith(af.value)).length
          return (
            <button
              key={af.value}
              type="button"
              onClick={() => { setActionFilter(af.value); setPage(1) }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                actionFilter === af.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {af.label}
              <span className="ml-1.5 font-mono text-[11px] opacity-75">({count})</span>
            </button>
          )
        })}
      </div>

      <FilterBar
        searchPlaceholder="Search by actor, action, resource ID, or details…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onClear={() => { setSearch(""); setActionFilter("all"); setPage(1) }}
        totalCount={filtered.length}
      />

      <DataTableWrapper
        isEmpty={paginated.length === 0}
        emptyTitle="No audit events found"
        emptyDescription="Audit events are recorded automatically when staff perform significant system operations."
        totalItems={filtered.length}
        currentPage={clampedPage}
        totalPages={totalPages}
        onPageChange={setPage}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="max-w-[300px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((e) => (
              <TableRow key={e.id} className="hover:bg-muted/20">
                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {new Date(e.timestamp).toLocaleString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium truncate max-w-[150px]">{e.actorName}</span>
                    <span className="text-[11px] text-muted-foreground capitalize">{e.actorRole.replace(/_/g, " ")}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={actionBadge(e.action)}
                    label={e.action.replace(/\./g, " › ")}
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium capitalize">{e.resource.replace(/_/g, " ")}</span>
                    <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                      {e.resourceId.length > 16 ? `…${e.resourceId.slice(-12)}` : e.resourceId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={e.result === "success" ? "success" : "error"}
                    label={e.result}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[300px]">
                  <span className="line-clamp-2">{e.details}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableWrapper>

      <p className="text-xs text-muted-foreground text-center">
        Audit log is append-only. No records can be edited or deleted.
      </p>
    </div>
  )
}
