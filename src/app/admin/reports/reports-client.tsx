"use client"

import * as React from "react"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import type { ReportSummary, VehicleUtilization } from "@/features/admin/server/reports-service"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { RiBarChartLine, RiCarLine, RiMoneyDollarCircleLine, RiCalendarLine } from "@remixicon/react"

interface ReportsClientProps {
  summary: ReportSummary
  fromDate: string
  toDate: string
}

function MetricCard({ label, value, icon: Icon, unit, color }: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  unit?: string
  color?: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={`p-1.5 rounded-md ${color || "bg-muted"}`}>
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="font-heading text-2xl font-bold text-foreground">
        {unit}{typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  )
}

function SparkBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="truncate max-w-[140px]">{label}</span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function ReportsClient({ summary, fromDate, toDate }: ReportsClientProps) {
  const maxRevDay = Math.max(...summary.revenueByDay.map((d) => d.revenue), 1)
  const maxVehicleRentals = Math.max(...summary.topVehicles.map((v) => v.totalRentals), 1)

  // Only show recent days with data
  const recentDays = summary.revenueByDay.slice(-14)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description={`Booking analytics and revenue data from ${fromDate} to ${toDate} (Butuan City Operations).`}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={summary.totalRevenue}
          icon={RiMoneyDollarCircleLine}
          unit="₱"
          color="bg-emerald-500/10"
        />
        <MetricCard
          label="Total Reservations"
          value={summary.totalReservations}
          icon={RiCalendarLine}
          color="bg-sky-500/10"
        />
        <MetricCard
          label="Completed Rentals"
          value={summary.completedReservations}
          icon={RiCarLine}
          color="bg-violet-500/10"
        />
        <MetricCard
          label="Total Customers"
          value={summary.totalCustomers}
          icon={RiBarChartLine}
          color="bg-amber-500/10"
        />
      </div>

      {/* Status breakdown row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Completed", value: summary.completedReservations, status: "success" as const },
          { label: "Cancelled", value: summary.cancelledReservations, status: "error" as const },
          { label: "Pending Payments", value: summary.pendingPayments, status: "warning" as const },
          { label: "Avg. Rental Days", value: `${summary.averageRentalDays}d`, status: "neutral" as const },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-heading">{item.value}</span>
              <StatusBadge status={item.status} label={item.status} size="sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by day */}
        <section className="space-y-3">
          <SectionHeader title="Revenue Activity (Last 14 Days)" />
          <div className="rounded-lg border bg-card p-4 space-y-2">
            {recentDays.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No revenue data in selected range.</p>
            ) : (
              recentDays.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-muted-foreground w-20 shrink-0">
                    {new Date(d.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </span>
                  <div className="flex-1 h-5 rounded overflow-hidden bg-muted">
                    <div
                      className="h-full bg-primary/70 transition-all"
                      style={{ width: maxRevDay > 0 ? `${Math.max((d.revenue / maxRevDay) * 100, d.revenue > 0 ? 2 : 0)}%` : "0%" }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground w-20 text-right shrink-0">
                    {d.revenue > 0 ? `₱${d.revenue.toLocaleString()}` : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {d.reservations > 0 ? `${d.reservations} booking${d.reservations !== 1 ? "s" : ""}` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top vehicles */}
        <section className="space-y-3">
          <SectionHeader title="Most Rented Vehicles" />
          <div className="rounded-lg border bg-card p-4 space-y-3">
            {summary.topVehicles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No vehicle utilization data available.</p>
            ) : (
              summary.topVehicles.slice(0, 8).map((v) => (
                <SparkBar
                  key={v.vehicleId}
                  value={v.totalRentals}
                  max={maxVehicleRentals}
                  label={`${v.vehicleName} · ${v.plateNumber}`}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Vehicle utilization table */}
      {summary.topVehicles.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Vehicle Revenue Breakdown" />
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Rentals</TableHead>
                  <TableHead className="text-right">Total Days</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topVehicles.map((v: VehicleUtilization) => (
                  <TableRow key={v.vehicleId} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{v.vehicleName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{v.plateNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.branch}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{v.totalRentals}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{v.totalDays}d</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {v.totalRevenue > 0 ? `₱${v.totalRevenue.toLocaleString()}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Revenue figures reflect completed and active rentals only. Cancelled reservations are excluded from revenue totals.
      </p>
    </div>
  )
}
