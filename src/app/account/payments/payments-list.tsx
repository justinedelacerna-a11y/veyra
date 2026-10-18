"use client"

import * as React from "react"
import Link from "next/link"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { DemoReceiptDialog } from "@/features/payment/components/demo-receipt-dialog"
import type { CustomerPaymentRecord } from "@/features/account/server/customer-repository"
import { RiReceiptLine, RiArrowRightUpLine, RiBankCardLine } from "@remixicon/react"

const STATUS_BADGE_MAP: Record<string, { badge: StatusType; label: string }> = {
  pending: { badge: "pending", label: "Pending Settlement" },
  authorized: { badge: "info", label: "Authorized Hold" },
  captured: { badge: "success", label: "Paid (Demo)" },
  paid: { badge: "success", label: "Paid (Demo)" },
  failed: { badge: "error", label: "Simulation Failed" },
  refunded: { badge: "neutral", label: "Refunded" },
  partially_refunded: { badge: "warning", label: "Partially Refunded" },
}

interface CustomerPaymentsListProps {
  payments: CustomerPaymentRecord[]
}

export function CustomerPaymentsList({ payments }: CustomerPaymentsListProps) {
  const [selectedReceipt, setSelectedReceipt] = React.useState<CustomerPaymentRecord | null>(null)

  const formatMethodLabel = (method: string) => {
    switch (method) {
      case "counter":
      case "pay_at_pickup":
        return "Pay at Pickup"
      case "card":
        return "Credit / Debit Card (Demo)"
      case "gcash":
        return "GCash (Demo)"
      case "maya":
        return "Maya (Demo)"
      case "bank_transfer":
        return "Bank Transfer (Demo)"
      case "e_wallet":
        return "Digital E-Wallet (Demo)"
      default:
        return method.toUpperCase()
    }
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card/40 p-8 text-center space-y-3">
        <RiBankCardLine className="size-8 mx-auto text-muted-foreground" />
        <h3 className="font-heading text-sm font-semibold">No Payment Records Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Transactions and demo receipts will appear here automatically when you complete rental reservations.
        </p>
        <Link href="/booking">
          <Button size="sm" className="mt-1 text-xs">Book a Vehicle</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-card divide-y overflow-hidden shadow-xs">
        {payments.map((p) => {
          const statusCfg = STATUS_BADGE_MAP[p.status] || {
            badge: "neutral" as StatusType,
            label: p.status,
          }
          const dateDisplay = new Date(p.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })

          return (
            <div
              key={p.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {p.reservationReference}
                  </span>
                  <StatusBadge
                    status={statusCfg.badge}
                    label={statusCfg.label}
                    size="sm"
                  />
                  {p.isDemo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                      Demo
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Method: {formatMethodLabel(p.method)}
                  {p.providerTxnRef ? ` · Ref: ${p.providerTxnRef}` : ""}
                  {p.failureReason ? ` · Note: ${p.failureReason}` : ""}
                </p>
                {p.vehicleName && (
                  <p className="text-[11px] text-muted-foreground/90">
                    Vehicle: {p.vehicleName} {p.rentalDays ? `(${p.rentalDays} days)` : ""}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="font-heading text-base font-bold text-foreground block">
                    ₱{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {dateDisplay}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => setSelectedReceipt(p)}
                  >
                    <RiReceiptLine className="size-3.5" />
                    <span>Receipt</span>
                  </Button>

                  {p.status === "pending" && p.isDemo && (
                    <Link
                      href={`/booking/demo-checkout?ref=${encodeURIComponent(
                        p.reservationReference
                      )}&method=${encodeURIComponent(p.method)}`}
                    >
                      <Button size="sm" className="h-8 text-xs gap-1 bg-primary text-primary-foreground">
                        <RiArrowRightUpLine className="size-3.5" />
                        <span>Pay Demo</span>
                      </Button>
                    </Link>
                  )}

                  <Link href={`/account/reservations`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      Itinerary
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedReceipt && (
        <DemoReceiptDialog
          payment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </>
  )
}
