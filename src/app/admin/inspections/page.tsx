"use client"

import * as React from "react"
import Link from "next/link"
import { MOCK_INSPECTIONS } from "@/lib/mock/admin-ops"
import { InspectionRecord } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StatusType } from "@/components/common/status-badge"

const DAMAGE_STATUS_BADGE: Record<string, { badge: StatusType; label: string }> = {
  no_damage: { badge: "success", label: "No Damage" },
  existing_noted: { badge: "neutral", label: "Pre-Existing Noted" },
  new_damage: { badge: "error", label: "New Damage" },
  needs_review: { badge: "warning", label: "Needs Review" },
  charge_proposed: { badge: "warning", label: "Charge Proposed" },
  resolved: { badge: "success", label: "Resolved" },
}

// Inspection detail embedded in the list view
function InspectionDetailPanel({ inspection }: { inspection: InspectionRecord }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Type", value: inspection.type === "pickup" ? "Pickup Handover" : "Return Inspection" },
          { label: "Inspector", value: inspection.inspector },
          { label: "Date", value: inspection.date },
          { label: "Status", value: inspection.completed ? "Completed" : "Pending" },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
            <div className="font-medium text-foreground">{value}</div>
          </div>
        ))}
        {[
          { label: "Start Odometer", value: `${inspection.startOdometer.toLocaleString()} km` },
          { label: "End Odometer", value: inspection.endOdometer ? `${inspection.endOdometer.toLocaleString()} km` : "—" },
          { label: "Fuel at Start", value: `${inspection.fuelLevelStart}%` },
          { label: "Fuel at Return", value: inspection.fuelLevelEnd != null ? `${inspection.fuelLevelEnd}%` : "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
            <div className="font-medium text-foreground">{value}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Inspection Checklist</h3>
        <div className="space-y-1.5">
          {inspection.checkItems.map((item, i) => (
            <div key={i} className="flex items-start justify-between p-2.5 rounded-lg border bg-background/50 gap-3">
              <div>
                <span className="text-xs font-medium">{item.area}</span>
                {item.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{item.notes}</p>}
              </div>
              <StatusBadge
                status={item.status === "pass" ? "success" : item.status === "fail" ? "error" : "warning"}
                label={item.status}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      {inspection.notes && (
        <div className="text-xs text-muted-foreground rounded-lg border border-dashed bg-muted/30 p-3">
          <strong className="text-foreground">Inspector Notes:</strong> {inspection.notes}
        </div>
      )}
    </div>
  )
}

export default function AdminInspectionsPage() {
  const [search, setSearch] = React.useState("")
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const filtered = React.useMemo(() => {
    if (!search.trim()) return MOCK_INSPECTIONS
    const q = search.toLowerCase()
    return MOCK_INSPECTIONS.filter(
      (i) =>
        i.vehicleName.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.reservationId.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Inspections"
        description="Pickup and return inspection records — damage tracking, checklists, and completion status."
      />
      <FilterBar
        searchPlaceholder="Search by vehicle, customer, reservation, or inspector…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => setSearch("")}
        totalCount={filtered.length}
      />
      <DataTableWrapper isEmpty={filtered.length === 0} totalItems={filtered.length} currentPage={1} totalPages={1}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reservation</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Damage</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ins) => {
              const damageCfg = DAMAGE_STATUS_BADGE[ins.damageStatus]
              const isExpanded = expandedId === ins.id
              return (
                <React.Fragment key={ins.id}>
                  <TableRow className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-semibold">
                      <Link href={`/admin/reservations/${ins.reservationId}`} className="text-primary hover:underline">
                        {ins.reservationId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{ins.vehicleName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{ins.vehiclePlate}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{ins.customerName}</TableCell>
                    <TableCell>
                      <span className="capitalize text-xs font-medium bg-muted px-2 py-0.5 rounded">
                        {ins.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{ins.inspector}</TableCell>
                    <TableCell className="text-xs">{ins.date}</TableCell>
                    <TableCell>
                      <StatusBadge status={damageCfg.badge} label={damageCfg.label} size="sm" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={ins.completed ? "success" : "pending"}
                        label={ins.completed ? "Done" : "Pending"}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="gap-1 text-xs"
                        onClick={() => setExpandedId(isExpanded ? null : ins.id)}
                      >
                        {isExpanded ? "Collapse" : "Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/20 p-4 border-t">
                        <InspectionDetailPanel inspection={ins} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </DataTableWrapper>
    </div>
  )
}
