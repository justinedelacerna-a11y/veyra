"use client"

import * as React from "react"
import Link from "next/link"
import { AdminReservation, RESERVATION_STATUS_CONFIG } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { RiArrowRightLine, RiCalendarLine } from "@remixicon/react"
import { useRealtimeRefresh } from "@/lib/supabase/realtime"
import { RealtimeIndicator } from "@/components/admin/realtime-indicator"

const RESERVATIONS_TABLES = [
  { table: "reservations" },
  { table: "vehicles" },
] as const

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pickup Ready", value: "pickup_ready" },
  { label: "Active", value: "active" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Payment Pending", value: "payment_pending" },
  { label: "Return Inspection", value: "return_inspection" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
]

const PAGE_SIZE = 10

interface ReservationsClientProps {
  initialReservations: AdminReservation[]
}

export function ReservationsClient({ initialReservations }: ReservationsClientProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [dateFilter, setDateFilter] = React.useState("")
  const [page, setPage] = React.useState(1)

  const realtimeStatus = useRealtimeRefresh({
    channelName: "admin-reservations",
    tables: RESERVATIONS_TABLES as unknown as { table: string }[],
  })

  const filtered = React.useMemo(() => {
    let items = initialReservations
    if (statusFilter !== "all") {
      items = items.filter((r) => r.status === statusFilter)
    }
    if (dateFilter.trim()) {
      items = items.filter((r) => r.pickupDate === dateFilter || r.returnDate === dateFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (r) =>
          r.reference?.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q) ||
          r.vehicleName.toLowerCase().includes(q) ||
          r.vehiclePlate.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q)
      )
    }
    return items
  }, [initialReservations, search, statusFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const paginated = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations Management"
        description="All live bookings across hubs — search, filter by date/status, and execute state transitions."
        actions={<RealtimeIndicator status={realtimeStatus} />}
      />

      {/* Status tab filter */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((sf) => {
          const count =
            sf.value === "all"
              ? initialReservations.length
              : initialReservations.filter((r) => r.status === sf.value).length
          return (
            <button
              key={sf.value}
              type="button"
              onClick={() => {
                setStatusFilter(sf.value)
                setPage(1)
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === sf.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {sf.label}
              <span className="ml-1.5 font-mono text-[11px] opacity-75">
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <FilterBar
            searchPlaceholder="Search by reference, customer name, vehicle, or plate…"
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            onClear={() => {
              setSearch("")
              setStatusFilter("all")
              setDateFilter("")
              setPage(1)
            }}
            totalCount={filtered.length}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-card text-xs text-muted-foreground">
            <RiCalendarLine className="size-3.5" />
            <input
              type="date"
              aria-label="Filter by date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setPage(1)
              }}
              className="bg-transparent border-0 outline-none text-foreground text-xs"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                className="text-muted-foreground hover:text-foreground ml-1"
                aria-label="Clear date filter"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <DataTableWrapper
        isEmpty={paginated.length === 0}
        emptyTitle="No reservations found"
        emptyDescription="Adjust your search criteria or status filter to see customer reservations."
        totalItems={filtered.length}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Pickup Window</TableHead>
              <TableHead>Return Window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((r) => {
              const config = RESERVATION_STATUS_CONFIG[r.status] || {
                badgeVariant: "neutral",
                label: r.status,
              }
              return (
                <TableRow key={r.id} className="hover:bg-muted/20">
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {r.reference || r.id.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{r.customerName}</span>
                      <span className="text-xs text-muted-foreground">{r.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{r.vehicleName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{r.vehiclePlate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div className="font-medium text-foreground">{r.pickupDate}</div>
                      <div className="text-muted-foreground">{r.pickupTime} · {r.pickupBarangay ? `Brgy. ${r.pickupBarangay}` : r.pickupLocationName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div className="font-medium text-foreground">{r.returnDate}</div>
                      <div className="text-muted-foreground">{r.returnTime} · {r.returnBarangay ? `Brgy. ${r.returnBarangay}` : r.returnLocationName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={config.badgeVariant} label={config.label} size="sm" />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    ₱{r.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/reservations/${r.id}`}>
                      <Button size="xs" variant="ghost" className="gap-1 text-xs">
                        <span>Details</span>
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
