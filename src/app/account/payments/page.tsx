import * as React from "react"
import { Metadata } from "next"
import Link from "next/link"
import { getCustomerPayments } from "@/features/account/server"
import { getAvailablePaymentMethods, isPaymentGatewayConfigured } from "@/features/payment/server"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  RiBankCardLine,
  RiHandCoinLine,
  RiWallet3Line,
  RiQrCodeLine,
  RiGlobalLine,
  RiShieldCheckLine,
  RiHistoryLine,
  RiCarLine,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "Payment Methods & History — Veyra Account",
  description: "View available payment methods and live transaction records.",
}

const STATUS_BADGE_MAP: Record<string, { badge: StatusType; label: string }> = {
  pending: { badge: "pending", label: "Pending Settlement" },
  authorized: { badge: "info", label: "Authorized Hold" },
  captured: { badge: "success", label: "Paid & Captured" },
  paid: { badge: "success", label: "Paid" },
  failed: { badge: "error", label: "Payment Failed" },
  refunded: { badge: "neutral", label: "Refunded" },
  partially_refunded: { badge: "warning", label: "Partially Refunded" },
}

export default async function CustomerPaymentsPage() {
  const [payments, methods] = await Promise.all([
    getCustomerPayments(),
    Promise.resolve(getAvailablePaymentMethods()),
  ])

  const gatewayOnline = isPaymentGatewayConfigured()

  const formatMethodLabel = (method: string) => {
    switch (method) {
      case "counter":
      case "pay_at_pickup":
        return "Pay at Pickup"
      case "card":
        return "Credit / Debit Card"
      case "gcash":
        return "GCash E-Wallet"
      case "maya":
        return "Maya E-Wallet"
      case "e_wallet":
        return "Digital E-Wallet"
      default:
        return method.toUpperCase()
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Payment Methods & Billing
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Review accepted settlement channels and inspect your transaction ledger.
        </p>
      </div>

      {/* Available Payment Methods Card */}
      <section className="space-y-4" aria-labelledby="methods-heading">
        <div className="flex items-center justify-between">
          <h2 id="methods-heading" className="font-heading text-base font-bold text-foreground">
            Configured Settlement Channels
          </h2>
          <span className="text-xs text-muted-foreground">
            {gatewayOnline ? "Instant & In-Person Active" : "In-Person Settlement Active"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {methods.map((method) => {
            const isPickup = method.id === "pay_at_pickup"
            return (
              <div
                key={method.id}
                className="flex flex-col justify-between rounded-xl border bg-card/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {method.iconName === "bank-card" ? (
                      <RiBankCardLine className="size-5" />
                    ) : method.iconName === "wallet" ? (
                      <RiWallet3Line className="size-5" />
                    ) : method.iconName === "qr-code" ? (
                      <RiQrCodeLine className="size-5" />
                    ) : method.iconName === "global" ? (
                      <RiGlobalLine className="size-5" />
                    ) : (
                      <RiHandCoinLine className="size-5" />
                    )}
                  </div>
                  {method.enabled ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      Available
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Deferred
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-foreground block">
                    {method.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-2">
                    {method.description}
                  </span>
                </div>

                {isPickup && (
                  <span className="text-[10px] font-medium text-primary">
                    ✓ Supported at all Veyra Valet Bays
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Security Assurance */}
        <Alert className="border-border bg-muted/30">
          <RiShieldCheckLine className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-xs font-bold text-foreground">
            Bank-Grade Payment Security
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Veyra never stores full credit/debit card numbers, CVVs, or wallet credentials on our servers. All digital transactions are tokenized via hosted checkout gateways complying with PCI-DSS standards.
          </AlertDescription>
        </Alert>
      </section>

      {/* Transaction & Payment History */}
      <section className="space-y-4" aria-labelledby="history-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiHistoryLine className="size-4 text-primary" />
            <h2 id="history-heading" className="font-heading text-base font-bold text-foreground">
              Transaction History ({payments.length})
            </h2>
          </div>
          <Link href="/account/reservations">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
              <RiCarLine className="size-3.5" />
              <span>View Bookings</span>
            </Button>
          </Link>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/40 p-8 text-center space-y-3">
            <RiBankCardLine className="size-8 mx-auto text-muted-foreground" />
            <h3 className="font-heading text-sm font-semibold">No Payment Records Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Transactions and receipts will appear here automatically when you complete rental reservations.
            </p>
            <Link href="/booking">
              <Button size="sm" className="mt-1 text-xs">Book a Vehicle</Button>
            </Link>
          </div>
        ) : (
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
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {p.reservationReference}
                      </span>
                      <StatusBadge
                        status={statusCfg.badge}
                        label={statusCfg.label}
                        size="sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Method: {formatMethodLabel(p.method)}
                      {p.providerTxnRef ? ` · Ref: ${p.providerTxnRef}` : ""}
                      {p.failureReason ? ` · Note: ${p.failureReason}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="font-heading text-base font-bold text-foreground block">
                        ₱{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {dateDisplay}
                      </span>
                    </div>

                    <Link href={`/account/reservations`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        Itinerary
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
