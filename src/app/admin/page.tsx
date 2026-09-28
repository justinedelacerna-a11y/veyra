import * as React from "react"
import Link from "next/link"
import { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { MetricCard, SectionHeader } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { MOCK_ADMIN_RESERVATIONS } from "@/lib/mock/admin-reservations"
import { getFleetSummary } from "@/lib/mock/fleet"
import { MOCK_MAINTENANCE } from "@/lib/mock/admin-ops"
import { RESERVATION_STATUS_CONFIG } from "@/features/admin/types"
import {
  RiCalendarLine, RiCarLine, RiAlertLine, RiToolsLine,
  RiArrowRightLine, RiCheckboxCircleLine, RiTimeLine,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "Operations Dashboard — Veyra Admin",
  robots: { index: false, follow: false },
}

export default function AdminDashboardPage() {
  const fleetSummary = getFleetSummary()

  const todayPickups = MOCK_ADMIN_RESERVATIONS.filter(
    (r) => r.status === "pickup_ready" || r.status === "confirmed"
  )
  const activeRentals = MOCK_ADMIN_RESERVATIONS.filter((r) => r.status === "active")
  const needsAttention = MOCK_ADMIN_RESERVATIONS.filter(
    (r) => r.status === "payment_pending" || r.status === "return_inspection" || r.status === "disputed"
  )
  const overdueMaintenances = MOCK_MAINTENANCE.filter(
    (m) => m.status === "overdue" || m.status === "due"
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description="Today's operational overview — pickups, active rentals, and fleet status."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-3 py-1.5 bg-card">
            <span className="size-1.5 rounded-full bg-emerald-500 inline-block" aria-hidden="true" />
            <span>Live Prototype — Sep 28, 2026</span>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Today's Pickups"
          value={todayPickups.length}
          icon={RiCalendarLine}
          description={`${todayPickups.filter((r) => r.status === "pickup_ready").length} pickup-ready`}
        />
        <MetricCard
          label="Active Rentals"
          value={activeRentals.length}
          icon={RiCarLine}
          description="Currently on road"
        />
        <MetricCard
          label="Needs Attention"
          value={needsAttention.length}
          icon={RiAlertLine}
          badge={needsAttention.length > 0 ? (
            <StatusBadge status="warning" label="Action" size="sm" />
          ) : undefined}
          description="Payment/inspection pending"
        />
        <MetricCard
          label="Maintenance Alerts"
          value={overdueMaintenances.length}
          icon={RiToolsLine}
          badge={overdueMaintenances.length > 0 ? (
            <StatusBadge status="error" label="Overdue" size="sm" />
          ) : undefined}
          description={`${fleetSummary.maintenance} in service bay`}
        />
      </div>

      {/* Fleet Availability Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Available", value: fleetSummary.available, color: "emerald" },
          { label: "Reserved", value: fleetSummary.reserved, color: "sky" },
          { label: "Rented", value: fleetSummary.rented, color: "violet" },
          { label: "Maintenance/Inspection", value: fleetSummary.maintenance, color: "amber" },
          { label: "Total Fleet", value: fleetSummary.total, color: "foreground" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-3 text-center">
            <div className="font-heading text-2xl font-bold text-foreground">{item.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Today's Operations: Needs Attention */}
      {needsAttention.length > 0 && (
        <section aria-labelledby="attention-heading" className="space-y-3">
          <SectionHeader
            title="Needs Immediate Attention"
            badge={<StatusBadge status="warning" label={`${needsAttention.length} Items`} size="sm" />}
          />
          <div className="rounded-lg border border-amber-500/30 bg-card overflow-hidden">
            <div className="divide-y">
              {needsAttention.map((res) => {
                const config = RESERVATION_STATUS_CONFIG[res.status]
                return (
                  <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-foreground">{res.id}</span>
                        <StatusBadge status={config.badgeVariant} label={config.label} size="sm" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {res.customerName} — {res.vehicleName}
                      </p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                    <Link href={`/admin/reservations/${res.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                        <span>View</span>
                        <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Today's Pickups */}
      <section aria-labelledby="pickups-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Upcoming Pickups"
            badge={<StatusBadge status="info" label={`${todayPickups.length} Scheduled`} size="sm" />}
          />
          <Link href="/admin/reservations" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            <span>All Reservations</span>
            <RiArrowRightLine className="size-3.5" />
          </Link>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Pickup Hub</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayPickups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    No pickups scheduled today.
                  </TableCell>
                </TableRow>
              ) : (
                todayPickups.map((res) => {
                  const config = RESERVATION_STATUS_CONFIG[res.status]
                  return (
                    <TableRow key={res.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-semibold">{res.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{res.customerName}</span>
                          <span className="text-xs text-muted-foreground">{res.customerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{res.vehicleName}</span>
                          <span className="font-mono text-xs text-muted-foreground">{res.vehiclePlate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {res.pickupLocationName}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{res.pickupTime}</TableCell>
                      <TableCell>
                        <StatusBadge status={config.badgeVariant} label={config.label} size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/reservations/${res.id}`}>
                          <Button size="xs" variant="ghost" className="gap-1 text-xs">
                            <span>Open</span>
                            <RiArrowRightLine className="size-3" data-icon="inline-end" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Active Rentals & Maintenance quick cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rentals */}
        <section aria-labelledby="active-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Active Rentals"
              badge={<StatusBadge status="success" label={`${activeRentals.length} On Road`} size="sm" />}
            />
            <Link href="/admin/reservations" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="rounded-lg border bg-card divide-y">
            {activeRentals.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No active rentals.</div>
            ) : (
              activeRentals.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3.5 gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                      <RiCarLine className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{res.vehicleName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{res.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">Returns: {res.returnDate} {res.returnTime}</p>
                    </div>
                  </div>
                  <Link href={`/admin/reservations/${res.id}`}>
                    <Button size="xs" variant="ghost" className="text-xs shrink-0">View</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Maintenance Alerts */}
        <section aria-labelledby="maintenance-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Maintenance Alerts"
              badge={overdueMaintenances.length > 0 ? (
                <StatusBadge status="error" label={`${overdueMaintenances.length} Urgent`} size="sm" />
              ) : (
                <StatusBadge status="neutral" label="All Clear" size="sm" />
              )}
            />
            <Link href="/admin/maintenance" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="rounded-lg border bg-card divide-y">
            {overdueMaintenances.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <RiCheckboxCircleLine className="size-5 text-emerald-500" />
                <span>No overdue maintenance items.</span>
              </div>
            ) : (
              overdueMaintenances.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3.5 gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 p-1.5 rounded-md bg-red-500/10 text-red-600 shrink-0">
                      <RiToolsLine className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{m.vehicleName}</p>
                      <p className="text-[11px] text-muted-foreground">{m.typeLabel}</p>
                      <div className="flex items-center gap-1 text-[11px]">
                        <RiTimeLine className="size-3 text-muted-foreground" />
                        <span className="text-red-600 dark:text-red-400 font-medium capitalize">{m.status}</span>
                        <span className="text-muted-foreground">· Due {m.scheduledDate}</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/admin/maintenance">
                    <Button size="xs" variant="ghost" className="text-xs shrink-0">View</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
