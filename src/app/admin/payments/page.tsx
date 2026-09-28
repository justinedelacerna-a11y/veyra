"use client"

import * as React from "react"
import { MOCK_PAYMENTS } from "@/lib/mock/admin-ops"
import { PaymentRecord, PaymentStatus } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/admin/primitives"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RiRefundLine } from "@remixicon/react"
import type { StatusType } from "@/components/common/status-badge"
import Link from "next/link"

const STATUS_BADGE: Record<PaymentStatus, { badge: StatusType; label: string }> = {
  pending: { badge: "pending", label: "Pending" },
  authorized: { badge: "info", label: "Authorized" },
  captured: { badge: "success", label: "Captured" },
  failed: { badge: "error", label: "Failed" },
  refunded: { badge: "neutral", label: "Refunded" },
  partially_refunded: { badge: "warning", label: "Partial Refund" },
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [refundOpen, setRefundOpen] = React.useState(false)
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRecord | null>(null)

  const filtered = React.useMemo(() => {
    let items = MOCK_PAYMENTS
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
  }, [search, statusFilter])

  const totalRevenue = MOCK_PAYMENTS
    .filter((p) => p.status === "captured")
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = MOCK_PAYMENTS
    .filter((p) => p.status === "pending" || p.status === "authorized")
    .reduce((sum, p) => sum + p.amount, 0)
  const refundedAmount = MOCK_PAYMENTS
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Invoicing"
        description="Transaction records, authorization holds, and refund management."
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Captured Revenue", value: `₱${totalRevenue.toLocaleString()}`, badge: <StatusBadge status="success" label="Live" size="sm" /> },
          { label: "Authorized / Pending", value: `₱${pendingAmount.toLocaleString()}`, badge: <StatusBadge status="info" label="Held" size="sm" /> },
          { label: "Total Refunded", value: `₱${refundedAmount.toLocaleString()}`, badge: <StatusBadge status="neutral" label="Returned" size="sm" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="uppercase tracking-wide font-medium">{s.label}</span>
              {s.badge}
            </div>
            <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        {["all", "pending", "authorized", "captured", "failed", "refunded"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search by payment ID, transaction ref, reservation, or customer…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => { setSearch(""); setStatusFilter("all") }}
        totalCount={filtered.length}
      />

      <DataTableWrapper isEmpty={filtered.length === 0} totalItems={filtered.length} currentPage={1} totalPages={1}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Reservation</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const cfg = STATUS_BADGE[p.status]
              const canRefund = p.status === "captured" || p.status === "authorized"
              return (
                <TableRow key={p.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-xs font-semibold">{p.id}</TableCell>
                  <TableCell>
                    <Link href={`/admin/reservations/${p.reservationId}`} className="font-mono text-xs text-primary hover:underline">
                      {p.reservationId}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{p.customerName}</TableCell>
                  <TableCell className="text-right font-semibold">{p.currency}{p.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs capitalize">{p.method.replace("-", " ")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.provider}</TableCell>
                  <TableCell><StatusBadge status={cfg.badge} label={cfg.label} size="sm" /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canRefund && (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="gap-1 text-xs text-amber-700 hover:bg-amber-500/10"
                        onClick={() => { setSelectedPayment(p); setRefundOpen(true) }}
                      >
                        <RiRefundLine className="size-3" />
                        <span>Refund</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </DataTableWrapper>

      {selectedPayment && (
        <ConfirmationDialog
          open={refundOpen}
          onOpenChange={setRefundOpen}
          title="Initiate Refund"
          description={`You are requesting a refund of ₱${selectedPayment.amount.toLocaleString()} for reservation ${selectedPayment.reservationId} (${selectedPayment.customerName}). Confirm to proceed. Real refunds will be processed through PayMongo in production. This action cannot be reversed.`}
          confirmLabel="Confirm Refund Request"
          variant="destructive"
          onConfirm={() => {
            setRefundOpen(false)
            setSelectedPayment(null)
          }}
        />
      )}
    </div>
  )
}
