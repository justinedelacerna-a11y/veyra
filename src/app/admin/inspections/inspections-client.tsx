"use client"

import * as React from "react"
import Link from "next/link"
import { InspectionRecord } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StatusType } from "@/components/common/status-badge"
import { useRealtimeRefresh } from "@/lib/supabase/realtime"
import { RealtimeIndicator } from "@/components/admin/realtime-indicator"

const INSPECTION_TABLES = [
  { table: "inspections" },
  { table: "reservations" },
] as const

const DAMAGE_STATUS_BADGE: Record<string, { badge: StatusType; label: string }> = {
  no_damage: { badge: "success", label: "No Damage" },
  existing_noted: { badge: "neutral", label: "Pre-Existing Noted" },
  new_damage: { badge: "error", label: "New Damage" },
  needs_review: { badge: "warning", label: "Needs Review" },
  charge_proposed: { badge: "warning", label: "Charge Proposed" },
  resolved: { badge: "success", label: "Resolved" },
}

interface InspectionsClientProps {
  initialInspections: InspectionRecord[]
}

export function InspectionsClient({ initialInspections }: InspectionsClientProps) {
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const realtimeStatus = useRealtimeRefresh({
    channelName: "admin-inspections",
    tables: INSPECTION_TABLES as unknown as { table: string }[],
  })

  const filtered = React.useMemo(() => {
    let items = initialInspections
    if (typeFilter !== "all") items = items.filter((i) => i.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (i) =>
          i.vehicleName.toLowerCase().includes(q) ||
          i.vehiclePlate.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.reservationId.toLowerCase().includes(q)
      )
    }
    return items
  }, [initialInspections, search, typeFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Inspections"
        description="Pre-pickup handover and post-return condition reports logged in Supabase."
        actions={<RealtimeIndicator status={realtimeStatus} />}
      />

      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "All Inspections", value: "all" },
          { label: "Pickup Handover", value: "pickup" },
          { label: "Return Check", value: "return" },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === t.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search by vehicle, plate, customer, or reservation…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => {
          setSearch("")
          setTypeFilter("all")
        }}
        totalCount={filtered.length}
      />

      <DataTableWrapper
        isEmpty={filtered.length === 0}
        emptyTitle="No inspection records found"
        emptyDescription="Vehicle inspection reports performed by staff will appear here."
        totalItems={filtered.length}
        currentPage={1}
        totalPages={1}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ins) => {
              const damageCfg = DAMAGE_STATUS_BADGE[ins.damageStatus] || {
                badge: "neutral",
                label: ins.damageStatus,
              }
              return (
                <TableRow key={ins.id} className="hover:bg-muted/20">
                  <TableCell>
                    <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded border bg-muted/30">
                      {ins.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{ins.vehicleName}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs px-2 py-0.5 rounded border bg-muted/40 font-semibold">
                      {ins.vehiclePlate}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{ins.customerName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ins.inspector}</TableCell>
                  <TableCell className="text-xs">{ins.date}</TableCell>
                  <TableCell>
                    <StatusBadge status={damageCfg.badge} label={damageCfg.label} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/reservations/${ins.reservationId}`}>
                      <Button size="xs" variant="ghost" className="text-xs">
                        Reservation
                      </Button>
                    </Link>
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
