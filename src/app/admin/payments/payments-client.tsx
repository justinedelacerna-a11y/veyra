"use client"

import * as React from "react"
import Link from "next/link"
import { PaymentRecord, PaymentStatus } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StatusType } from "@/components/common/status-badge"

const STATUS_BADGE: Record<PaymentStatus, { badge: StatusType; label: string }> = {
  pending: { badge: "pending", label: "Pending" },
  authorized: { badge: "info", label: "Authorized" },
  captured: { badge: "success", label: "Captured" },
  failed: { badge: "error", label: "Failed" },
  refunded: { badge: "neutral", label: "Refunded" },
  partially_refunded: { badge: "warning", label: "Partial Refund" },
}

interface PaymentsClientProps {
  initialPayments: PaymentRecord[]
}

export function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const filtered = React.useMemo(() => {
    let items = initialPayments
    if (statusFilter !== "all") items = items.filter((p) => p.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.reservationId.toLowerCase().includes(q) ||
          p.transactionRef.toLowerCase().includes(q)
      )
    }
    return items
  }, [initialPayments, search, statusFilter])

  const totalRevenue = initialPayments
    .filter((p) => p.status === "captured")
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = initialPayments
    .filter((p) => p.status === "pending" || p.status === "authorized")
    .reduce((sum, p) => sum + p.amount, 0)
  const refundedAmount = initialPayments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Financial Ledger"
        description="Live transaction records, payment statuses, and reconciliation logged in Supabase."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Captured Revenue</div>
          <div className="font-heading text-2xl font-bold text-foreground">₱{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Pending / Deferred Holds</div>
          <div className="font-heading text-2xl font-bold text-amber-600">₱{pendingAmount.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Refunded / Released</div>
          <div className="font-heading text-2xl font-bold text-muted-foreground">₱{refundedAmount.toLocaleString()}</div>
        </div>
      </div>

      <FilterBar
        searchPlaceholder="Search by transaction ref, customer, or reservation UUID…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => {
          setSearch("")
          setStatusFilter("all")
        }}
        totalCount={filtered.length}
      />

      <DataTableWrapper
        isEmpty={filtered.length === 0}
        emptyTitle="No payment records found"
        emptyDescription="Transactions will appear here when bookings are confirmed or processed."
        totalItems={filtered.length}
        currentPage={1}
        totalPages={1}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Reservation</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const statusCfg = STATUS_BADGE[p.status] || { badge: "neutral", label: p.status }
              return (
                <TableRow key={p.id} className="hover:bg-muted/20">
                  <TableCell>
                    <span className="font-mono text-xs font-semibold">{p.transactionRef}</span>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{p.customerName}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/reservations/${p.reservationId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {p.reservationId.slice(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    ₱{p.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize text-xs">{p.method}</TableCell>
                  <TableCell>
                    <StatusBadge status={statusCfg.badge} label={statusCfg.label} size="sm" />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/reservations/${p.reservationId}`}>
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
