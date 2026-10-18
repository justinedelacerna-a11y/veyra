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
  const [modeFilter, setModeFilter] = React.useState<"all" | "demo" | "live">("all")

  const filtered = React.useMemo(() => {
    let items = initialPayments
    if (statusFilter !== "all") items = items.filter((p) => p.status === statusFilter)
    if (modeFilter === "demo") items = items.filter((p) => p.isDemo)
    if (modeFilter === "live") items = items.filter((p) => !p.isDemo)

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.reservationId.toLowerCase().includes(q) ||
          p.transactionRef.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q)
      )
    }
    return items
  }, [initialPayments, search, statusFilter, modeFilter])

  // CRITICAL REQUIREMENT: Strictly exclude demo simulations from actual captured revenue
  const totalCapturedRevenue = initialPayments
    .filter((p) => !p.isDemo && p.status === "captured")
    .reduce((sum, p) => sum + p.amount, 0)

  const simulatedPaymentVolume = initialPayments
    .filter((p) => p.isDemo && p.status === "captured")
    .reduce((sum, p) => sum + p.amount, 0)

  const demoTransactionCount = initialPayments.filter((p) => p.isDemo).length

  const pendingAmount = initialPayments
    .filter((p) => p.status === "pending" || p.status === "authorized")
    .reduce((sum, p) => sum + p.amount, 0)

  const refundedAmount = initialPayments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0)

  const formatMethodLabel = (method: string, isDemo?: boolean) => {
    switch (method) {
      case "counter":
      case "pay_at_pickup":
        return "Pay at Pickup"
      case "card":
        return isDemo ? "Card (Demo)" : "Credit / Debit Card"
      case "gcash":
        return isDemo ? "GCash (Demo)" : "GCash"
      case "maya":
        return isDemo ? "Maya (Demo)" : "Maya"
      case "bank_transfer":
        return isDemo ? "Bank Transfer (Demo)" : "Bank Transfer"
      case "e_wallet":
      case "e-wallet":
        return isDemo ? "E-Wallet (Demo)" : "E-Wallet"
      default:
        return isDemo ? `${method.toUpperCase()} (Demo)` : method.toUpperCase()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Financial Ledger"
        description="Authoritative transaction records, simulation ledger, and reconciliation logged in Supabase."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Captured Revenue */}
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Captured Revenue (Real)</div>
          <div className="font-heading text-2xl font-bold text-foreground">
            ₱{totalCapturedRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Excludes all demo simulations</div>
        </div>

        {/* Simulated Payment Volume (Demo) */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
            Simulated Payment Volume (Demo)
          </div>
          <div className="font-heading text-2xl font-bold text-amber-700 dark:text-amber-300">
            ₱{simulatedPaymentVolume.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            {demoTransactionCount} total simulated demo {demoTransactionCount === 1 ? "entry" : "entries"}
          </div>
        </div>

        {/* Pending Holds */}
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Pending / Deferred Holds</div>
          <div className="font-heading text-2xl font-bold text-amber-600">
            ₱{pendingAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Counter and pending transactions</div>
        </div>

        {/* Refunded */}
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Refunded / Released</div>
          <div className="font-heading text-2xl font-bold text-muted-foreground">
            ₱{refundedAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Released deposit holds & refunds</div>
        </div>
      </div>

      {/* Filter and Mode Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg border bg-muted/30">
          <button
            type="button"
            onClick={() => setModeFilter("all")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              modeFilter === "all"
                ? "bg-card shadow-xs text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Entries ({initialPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setModeFilter("demo")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              modeFilter === "demo"
                ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Demo Simulations</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-[10px]">
              {demoTransactionCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setModeFilter("live")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              modeFilter === "live"
                ? "bg-card shadow-xs text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Live Payments ({initialPayments.filter((p) => !p.isDemo).length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border bg-card px-3 py-1.5 text-foreground focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="captured">Captured / Paid</option>
            <option value="pending">Pending</option>
            <option value="authorized">Authorized</option>
            <option value="failed">Failed / Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <FilterBar
        searchPlaceholder="Search by transaction ref, customer, method, or reservation UUID…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => {
          setSearch("")
          setStatusFilter("all")
          setModeFilter("all")
        }}
        totalCount={filtered.length}
      />

      <DataTableWrapper
        isEmpty={filtered.length === 0}
        emptyTitle="No payment records found"
        emptyDescription="Transactions will appear here when bookings are confirmed or simulated."
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
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold">{p.transactionRef}</span>
                      {p.isDemo && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-extrabold uppercase tracking-wide border border-amber-500/30">
                          Demo
                        </span>
                      )}
                    </div>
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
                  <TableCell className="text-xs">
                    {formatMethodLabel(p.method, p.isDemo)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={statusCfg.badge}
                      label={p.isDemo && p.status === "captured" ? "Paid (Demo)" : statusCfg.label}
                      size="sm"
                    />
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

