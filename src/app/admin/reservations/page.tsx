"use client"

import * as React from "react"
import Link from "next/link"
import { MOCK_ADMIN_RESERVATIONS } from "@/lib/mock/admin-reservations"
import { RESERVATION_STATUS_CONFIG } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { RiArrowRightLine, RiDownloadLine } from "@remixicon/react"

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

export default function AdminReservationsClient() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    let items = MOCK_ADMIN_RESERVATIONS
    if (statusFilter !== "all") {
      items = items.filter((r) => r.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.vehicleName.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q)
      )
    }
    return items
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const paginated = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations"
        description="All bookings across branches — search, filter, and manage reservation state."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <RiDownloadLine className="size-3.5" data-icon="inline-start" />
            <span>Export CSV</span>
          </Button>
        }
      />

      {/* Status tab filter */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            type="button"
            onClick={() => setStatusFilter(sf.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === sf.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {sf.label}
            {sf.value !== "all" && (
              <span className="ml-1.5 font-mono">
                ({MOCK_ADMIN_RESERVATIONS.filter((r) => r.status === sf.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search by reference, customer, vehicle, or branch…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => { setSearch(""); setStatusFilter("all") }}
        totalCount={filtered.length}
      />

      <DataTableWrapper
        isEmpty={paginated.length === 0}
        emptyTitle="No reservations found"
        emptyDescription="Adjust your search or filter criteria."
        totalItems={filtered.length}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((r) => {
              const config = RESERVATION_STATUS_CONFIG[r.status]
              const paymentBadge = {
                captured: { status: "success" as const, label: "Captured" },
                authorized: { status: "info" as const, label: "Authorized" },
                pending: { status: "pending" as const, label: "Pending" },
                refunded: { status: "neutral" as const, label: "Refunded" },
                failed: { status: "error" as const, label: "Failed" },
              }[r.paymentStatus] || { status: "neutral" as const, label: r.paymentStatus }

              return (
                <TableRow key={r.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-xs font-semibold">{r.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight">{r.customerName}</span>
                      <span className="text-xs text-muted-foreground">{r.branch}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight">{r.vehicleName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{r.vehiclePlate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{r.pickupDate}</span>
                      <span className="text-muted-foreground">{r.pickupTime}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{r.returnDate}</span>
                      <span className="text-muted-foreground">{r.returnTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={config.badgeVariant} label={config.label} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={paymentBadge.status} label={paymentBadge.label} size="sm" />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {r.currency}{r.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/reservations/${r.id}`}>
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
