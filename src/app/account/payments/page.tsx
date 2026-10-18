import * as React from "react"
import { Metadata } from "next"
import Link from "next/link"
import { getCustomerPayments } from "@/features/account/server"
import { getAvailablePaymentMethods, isPaymentGatewayConfigured } from "@/features/payment/server"
import { CustomerPaymentsList } from "./payments-list"
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

export default async function CustomerPaymentsPage() {
  const [payments, methods] = await Promise.all([
    getCustomerPayments(),
    Promise.resolve(getAvailablePaymentMethods({ demo: true })),
  ])

  const gatewayOnline = isPaymentGatewayConfigured()

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
            Capstone Demonstration Architecture
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            All digital payment channels operate in simulation mode. No live credit cards, bank credentials, or mobile wallets are charged real money. Transactions are stored with demo markers and auditable simulation records.
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

        <CustomerPaymentsList payments={payments} />
      </section>
    </div>
  )
}

