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
import { getAdminDashboardData } from "@/features/admin/server/dashboard-service"
import { RESERVATION_STATUS_CONFIG } from "@/features/admin/types"
import {
  RiCalendarLine, RiCarLine, RiAlertLine, RiToolsLine,
  RiArrowRightLine, RiAddLine, RiSearchLine, RiMoneyDollarCircleLine,
  RiScanLine, RiGasStationLine, RiArrowUpDownLine, RiPercentLine,
} from "@remixicon/react"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { DashboardRealtimeWrapper } from "./dashboard-realtime-wrapper"

export const metadata: Metadata = {
  title: "Operations Dashboard — Veyra Admin",
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  await requireAdminStaff()

  const {
    fleetSummary,
    todayPickups,
    todayReturns,
    activeRentals,
    needsAttention,
    pendingApprovals,
    totalRevenue,
    utilizationRate,
    lowFuelVehicles,
    serviceDueVehicles,
    maintenanceAlertCount,
  } = await getAdminDashboardData()

  return (
    <DashboardRealtimeWrapper>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Operations Dashboard"
          description="Butuan City hub operational overview — real-time fleet, bookings, revenue, and active rental status."
        />
        <div className="flex items-center gap-2">
          <StatusBadge status="success" label="Butuan Hub Live" size="sm" />
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg border bg-card/60 backdrop-blur-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Quick Actions:
        </span>
        <Link href="/admin/fleet">
          <Button size="xs" variant="default" className="gap-1.5 shadow-2xs">
            <RiAddLine className="size-3.5" />
            <span>Add Vehicle</span>
          </Button>
        </Link>
        <Link href="/search">
          <Button size="xs" variant="outline" className="gap-1.5">
            <RiSearchLine className="size-3.5" />
            <span>New Booking</span>
          </Button>
        </Link>
        <Link href="/admin/payments">
          <Button size="xs" variant="outline" className="gap-1.5">
            <RiMoneyDollarCircleLine className="size-3.5" />
            <span>Record Payment</span>
          </Button>
        </Link>
        <Link href="/admin/maintenance">
          <Button size="xs" variant="outline" className="gap-1.5">
            <RiToolsLine className="size-3.5" />
            <span>Schedule Maintenance</span>
          </Button>
        </Link>
        <Link href="/admin/inspections">
          <Button size="xs" variant="outline" className="gap-1.5">
            <RiScanLine className="size-3.5" />
            <span>Start Inspection</span>
          </Button>
        </Link>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <MetricCard
          label="Today's Pickups"
          value={todayPickups.length}
          icon={RiCalendarLine}
          description={`${todayPickups.filter((r) => r.status === "pickup_ready").length} staged ready`}
        />
        <MetricCard
          label="Today's Returns"
          value={todayReturns.length}
          icon={RiArrowUpDownLine}
          description={`${todayReturns.filter((r) => r.status === "return_inspection").length} inspecting`}
        />
        <MetricCard
          label="Active Rentals"
          value={activeRentals.length}
          icon={RiCarLine}
          description="Currently on road"
        />
        <MetricCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          icon={RiAlertLine}
          badge={pendingApprovals.length > 0 ? (
            <StatusBadge status="warning" label="Pending" size="sm" />
          ) : undefined}
          description="Hold / payment pending"
        />
        <MetricCard
          label="Fleet Utilization"
          value={`${utilizationRate}%`}
          icon={RiPercentLine}
          description={`${fleetSummary.rented + fleetSummary.reserved} of ${fleetSummary.total} units`}
        />
      </div>

      {/* Secondary Financial & Fleet Status Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground font-medium">Total Revenue</div>
          <div className="font-heading text-lg font-bold text-foreground mt-0.5">
            ₱{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Confirmed & active</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground font-medium">Available Units</div>
          <div className="font-heading text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {fleetSummary.available} / {fleetSummary.total}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Ready for booking</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground font-medium">Rented / On Road</div>
          <div className="font-heading text-lg font-bold text-violet-600 dark:text-violet-400 mt-0.5">
            {fleetSummary.rented}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Customer active</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground font-medium">Maintenance Bay</div>
          <div className="font-heading text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {fleetSummary.maintenance}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{maintenanceAlertCount} alerts</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground font-medium">Total Fleet</div>
          <div className="font-heading text-lg font-bold text-foreground mt-0.5">
            {fleetSummary.total}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">All registered vehicles</div>
        </div>
      </div>

      {/* Alerts Row: Low Fuel & Maintenance Due */}
      {(lowFuelVehicles.length > 0 || serviceDueVehicles.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowFuelVehicles.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiGasStationLine className="size-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Low Fuel Alert ({lowFuelVehicles.length} vehicles)
                  </span>
                </div>
                <Link href="/admin/fleet" className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline">
                  View Fleet
                </Link>
              </div>
              <div className="space-y-1.5 pt-1">
                {lowFuelVehicles.slice(0, 3).map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{v.make} {v.model} ({v.plateNumber})</span>
                    <span className="font-mono text-amber-600 font-bold">{v.fuelLevel}% Fuel</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {serviceDueVehicles.length > 0 && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiToolsLine className="size-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-900 dark:text-red-200">
                    Service Due / Maintenance ({serviceDueVehicles.length} vehicles)
                  </span>
                </div>
                <Link href="/admin/maintenance" className="text-[11px] text-red-700 dark:text-red-300 hover:underline">
                  View Maintenance
                </Link>
              </div>
              <div className="space-y-1.5 pt-1">
                {serviceDueVehicles.slice(0, 3).map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{v.make} {v.model} ({v.plateNumber})</span>
                    <span className="font-mono text-xs text-red-600">Due: {v.nextMaintenanceDue || "Immediate"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                const config = RESERVATION_STATUS_CONFIG[res.status] || {
                  label: res.status,
                  badgeVariant: "neutral",
                  description: "Operational record",
                }
                return (
                  <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {res.reference || res.id}
                        </span>
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
                  const config = RESERVATION_STATUS_CONFIG[res.status] || {
                    label: res.status,
                    badgeVariant: "neutral",
                  }
                  return (
                    <TableRow key={res.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-semibold">
                        {res.reference || res.id}
                      </TableCell>
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

      {/* Active Rentals Quick Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="p-6 text-center text-xs text-muted-foreground">No active rentals currently on road.</div>
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

        {/* Fleet Maintenance Status Quick Card */}
        <section aria-labelledby="maintenance-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Fleet Status Overview"
              badge={fleetSummary.maintenance > 0 ? (
                <StatusBadge status="warning" label={`${fleetSummary.maintenance} in Bay`} size="sm" />
              ) : (
                <StatusBadge status="neutral" label="All Clear" size="sm" />
              )}
            />
            <Link href="/admin/fleet" className="text-xs font-medium text-primary hover:underline">View fleet</Link>
          </div>
          <div className="rounded-lg border bg-card divide-y">
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Available for immediate booking</span>
              <span className="text-sm font-semibold text-emerald-600">{fleetSummary.available} vehicles</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Under maintenance / service bay</span>
              <span className="text-sm font-semibold text-amber-600">{fleetSummary.maintenance} vehicles</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Currently on active customer rentals</span>
              <span className="text-sm font-semibold text-primary">{fleetSummary.rented} vehicles</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Reserved for upcoming confirmed trips</span>
              <span className="text-sm font-semibold text-sky-600">{fleetSummary.reserved} vehicles</span>
            </div>
          </div>
        </section>
      </div>
    </div>
    </DashboardRealtimeWrapper>
  )
}
