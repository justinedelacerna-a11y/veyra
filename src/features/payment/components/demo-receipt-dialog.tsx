"use client"

import * as React from "react"
import {
  RiCloseLine,
  RiPrinterLine,
  RiCheckLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import type { CustomerPaymentRecord } from "@/features/account/server/customer-repository"

interface DemoReceiptDialogProps {
  payment: CustomerPaymentRecord
  onClose: () => void
}

export function DemoReceiptDialog({ payment, onClose }: DemoReceiptDialogProps) {
  const handlePrint = () => {
    window.print()
  }

  const formatMethod = (method: string) => {
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

  const formattedDate = new Date(payment.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close dialog"
        >
          <RiCloseLine className="size-5" />
        </button>

        {/* Demo Watermark Banner */}
        <div className="rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-500/10 p-3 text-center text-amber-800 dark:text-amber-300 space-y-0.5">
          <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase block">
            DEMO — NO REAL MONEY INVOLVED
          </span>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 block">
            Academic / Capstone Project Simulation Only • Not Proof of Financial Settlement
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-1 border-b pb-4">
          <span className="font-heading text-xl sm:text-2xl font-black tracking-tight text-foreground">
            VEYRA CAR RENTAL
          </span>
          <p className="text-xs text-muted-foreground">
            Butuan City, Agusan del Norte, Philippines
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mt-2">
            <RiCheckLine className="size-3.5" />
            <span>Simulated Receipt</span>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Receipt Number:</span>
            <span className="font-mono font-bold text-foreground">
              {payment.providerTxnRef || `RCP-${payment.id.slice(0, 8).toUpperCase()}`}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Reservation Reference:</span>
            <span className="font-mono font-bold text-primary">
              {payment.reservationReference}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Transaction Date:</span>
            <span className="font-medium text-foreground">{formattedDate}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Payment Method:</span>
            <span className="font-semibold text-foreground">
              {formatMethod(payment.method)}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Transaction Status:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {payment.status === "captured" ? "Paid (Demo)" : payment.status.toUpperCase()}
            </span>
          </div>

          {payment.vehicleName && (
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Vehicle:</span>
              <span className="font-semibold text-foreground">{payment.vehicleName}</span>
            </div>
          )}

          {payment.rentalDays && (
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Rental Duration:</span>
              <span className="font-medium text-foreground">
                {payment.rentalDays} {payment.rentalDays === 1 ? "Day" : "Days"}
              </span>
            </div>
          )}
        </div>

        {/* Amount Box */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Total Amount (PHP)
            </span>
            <span className="text-[10px] text-muted-foreground">Zero tax / Simulated tariff</span>
          </div>
          <span className="font-heading text-2xl font-black text-primary">
            ₱{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs"
          >
            <RiPrinterLine className="size-4" />
            <span>Print Receipt</span>
          </Button>

          <Button
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold px-5"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
