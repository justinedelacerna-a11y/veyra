"use client"

import * as React from "react"
import Link from "next/link"
import { FleetVehicle, FleetVehicleStatus } from "@/features/admin/types"
import { FleetSummary } from "@/features/admin/server/fleet-service"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge, type StatusType } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { RiArrowRightLine } from "@remixicon/react"
import { VehicleImage } from "@/components/ui/vehicle-image"
import { useRealtimeRefresh } from "@/lib/supabase/realtime"
import { RealtimeIndicator } from "@/components/admin/realtime-indicator"

const FLEET_REALTIME_TABLES = [
  { table: "vehicles" },
  { table: "maintenance_records" },
  { table: "reservations" },
] as const

const FLEET_STATUS_MAP: Record<FleetVehicleStatus, { badge: StatusType; label: string }> = {
  available: { badge: "success", label: "Available" },
  reserved: { badge: "info", label: "Reserved" },
  rented: { badge: "success", label: "Rented Out" },
  inspection: { badge: "pending", label: "Inspection" },
  maintenance: { badge: "warning", label: "Maintenance" },
  inactive: { badge: "neutral", label: "Inactive" },
  retired: { badge: "neutral", label: "Retired" },
}

const CONDITION_MAP = {
  excellent: { badge: "success" as StatusType, label: "Excellent" },
  good: { badge: "neutral" as StatusType, label: "Good" },
  fair: { badge: "warning" as StatusType, label: "Fair" },
  poor: { badge: "error" as StatusType, label: "Poor" },
}

interface FleetClientProps {
  initialVehicles: FleetVehicle[]
  summary: FleetSummary
}

export function FleetClient({ initialVehicles, summary }: FleetClientProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [page, setPage] = React.useState(1)
  const realtimeStatus = useRealtimeRefresh({
    channelName: "admin-fleet",
    tables: FLEET_REALTIME_TABLES as unknown as { table: string }[],
  })
  const PAGE_SIZE = 10

  const filtered = React.useMemo(() => {
    let items = initialVehicles
    if (statusFilter !== "all") {
      items = items.filter((v) => v.fleetStatus === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (v) =>
          `${v.make} ${v.model}`.toLowerCase().includes(q) ||
          v.plateNumber.toLowerCase().includes(q) ||
          (v.barangay && v.barangay.toLowerCase().includes(q)) ||
          v.branch.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      )
    }
    return items
  }, [initialVehicles, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const paginated = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)

  const statusOptions: { value: string; label: string }[] = [
    { value: "all", label: `All Fleet (${summary.total})` },
    { value: "available", label: `Available (${summary.available})` },
    { value: "reserved", label: `Reserved (${summary.reserved})` },
    { value: "rented", label: `Rented (${summary.rented})` },
    { value: "maintenance", label: `Maintenance (${summary.maintenance})` },
    { value: "inspection", label: `Inspection (${summary.inspection})` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Management"
        description="All live fleet vehicles operating in Butuan City, Agusan del Norte — status, telemetry, and maintenance."
        actions={<RealtimeIndicator status={realtimeStatus} />}
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Fleet", value: summary.total },
          { label: "Available", value: summary.available },
          { label: "Reserved", value: summary.reserved },
          { label: "Rented", value: summary.rented },
          { label: "In Service", value: summary.maintenance },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
            <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setStatusFilter(opt.value)
              setPage(1)
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search by vehicle, plate, branch, or category…"
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        onClear={() => {
          setSearch("")
          setStatusFilter("all")
          setPage(1)
        }}
        totalCount={filtered.length}
      />

      <DataTableWrapper
        isEmpty={paginated.length === 0}
        emptyTitle="No vehicles found"
        emptyDescription="Adjust your search criteria or status filter to see fleet vehicles."
        totalItems={filtered.length}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Station / Barangay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead className="text-right">Odometer</TableHead>
              <TableHead>Next Service</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((v) => {
              const statusCfg = FLEET_STATUS_MAP[v.fleetStatus] || {
                badge: "neutral",
                label: v.fleetStatus,
              }
              const condCfg = CONDITION_MAP[v.condition] || {
                badge: "neutral",
                label: v.condition,
              }
              return (
                <TableRow key={v.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-16 shrink-0 rounded-lg overflow-hidden border bg-muted/40">
                        <VehicleImage
                          src={v.primaryImage || v.images?.[0] || null}
                          alt={`${v.make} ${v.model}`}
                          aspectRatio="none"
                          category={v.category}
                          containerClassName="h-11 w-16"
                          showFallbackBadge={false}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{v.make} {v.model}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                          <span>{v.category} · {v.year}</span>
                          {(!v.images || v.images.length === 0) && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">· No photo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs px-2 py-0.5 rounded border bg-muted/40 font-semibold">
                      {v.plateNumber}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-foreground">
                      {v.barangay ? `Brgy. ${v.barangay}` : v.branch}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                      {v.locationName || "Butuan City Hub"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={statusCfg.badge} label={statusCfg.label} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={condCfg.badge} label={condCfg.label} size="sm" />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {v.odometer.toLocaleString()} km
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {v.nextMaintenanceDue}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/fleet/${v.id}`}>
                      <Button size="xs" variant="ghost" className="gap-1 text-xs">
                        <span>Open</span>
                        <RiArrowRightLine className="size-3" data-icon="inline-end" />
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
