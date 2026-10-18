"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  RiShieldCheckLine,
  RiAlertLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiLoader4Line,
  RiBankCardLine,
  RiQrCodeLine,
  RiGlobalLine,
  RiCarLine,
  RiMapPinLine,
  RiCalendarLine,
  RiInformationLine,
  RiLockLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"
import type { PaymentMethodId } from "@/features/payment/types"

export interface DemoPaymentData {
  reference: string
  sessionId: string
  paymentMethod: PaymentMethodId
  amountCentavos: number
  currency: string
  rentalDays: number
  pickupAt: string
  returnAt: string
  pickupLocation: string
  returnLocation: string
  pickupBarangay?: string | null
  vehicle: {
    make: string
    model: string
    year: number
    transmission: string
    fuelType: string
    seats: number
    category?: string
  }
  customerName: string
  customerEmail: string
  demoTxnRef: string
}

interface DemoPaymentInterfaceProps {
  initialData: DemoPaymentData
}

export function DemoPaymentInterface({ initialData }: DemoPaymentInterfaceProps) {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethodId>(
    initialData.paymentMethod || "gcash"
  )
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [outcomeState, setOutcomeState] = React.useState<"idle" | "success" | "failed" | "cancelled">("idle")
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [failureReason, setFailureReason] = React.useState<string>(
    "Insufficient wallet balance in simulated account."
  )
  const [selectedBank, setSelectedBank] = React.useState<string>("bpi")

  const amountPhp = (initialData.amountCentavos / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return isoString
    }
  }

  // Handle Action (Success, Failure, Cancel)
  const handleSimulate = async (action: "success" | "failure" | "cancel") => {
    if (isProcessing) return
    setIsProcessing(true)

    if (action === "success") {
      setStatusMessage("Authorizing simulated settlement...")
    } else if (action === "failure") {
      setStatusMessage("Processing simulated payment rejection...")
    } else {
      setStatusMessage("Cancelling checkout session...")
    }

    try {
      const res = await fetch("/api/payments/demo/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: initialData.reference,
          sessionId: initialData.sessionId,
          action,
          failureReason: action === "failure" ? failureReason : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setOutcomeState("failed")
        setStatusMessage(data.message || "Simulation request was rejected.")
        setIsProcessing(false)
        return
      }

      if (action === "success") {
        setOutcomeState("success")
        setStatusMessage("Payment authorized successfully in Demo Mode! Redirecting to confirmation...")
        setTimeout(() => {
          router.push(`/booking/confirmation?ref=${encodeURIComponent(initialData.reference)}&demo=paid`)
        }, 1500)
      } else if (action === "failure") {
        setOutcomeState("failed")
        setStatusMessage(data.simulation?.message || "Simulation declined: Insufficient funds or card rejected.")
        setIsProcessing(false)
      } else {
        setOutcomeState("cancelled")
        setStatusMessage("Payment cancelled. Returning to booking review...")
        setTimeout(() => {
          router.push(`/booking/payment?ref=${encodeURIComponent(initialData.reference)}&cancelled=true`)
        }, 1200)
      }
    } catch (err) {
      console.error("[DemoPaymentInterface] Simulation error:", err)
      setOutcomeState("failed")
      setStatusMessage("Failed to communicate with simulation server.")
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Prominent Demo Mode Top Banner */}
      <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 text-amber-800 dark:text-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <RiShieldCheckLine className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-sm sm:text-base tracking-wide uppercase">
                DEMO MODE — NO REAL MONEY INVOLVED
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold">
                Simulation Only
              </span>
            </div>
            <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
              This checkout simulator is designed for classroom and capstone project demonstration. No real bank accounts, GCash numbers, MPINs, or cards are required or charged.
            </p>
          </div>
        </div>
        <Link href={`/booking/payment?ref=${encodeURIComponent(initialData.reference)}&cancelled=true`}>
          <Button variant="outline" size="sm" className="h-8 text-xs border-amber-500/40 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 shrink-0">
            Exit Demo
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Itinerary & Quotation Summary */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Reservation Overview
              </span>
              <span className="font-mono text-xs font-bold text-primary">
                {initialData.reference}
              </span>
            </div>

            {/* Vehicle preview */}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <RiCarLine className="size-6" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-foreground block truncate">
                  {initialData.vehicle.year} {initialData.vehicle.make} {initialData.vehicle.model}
                </span>
                <span className="text-xs text-muted-foreground block">
                  {initialData.vehicle.transmission} · {initialData.vehicle.fuelType} · {initialData.vehicle.seats} Seats
                </span>
              </div>
            </div>

            {/* Itinerary Details */}
            <div className="space-y-3 pt-2 text-xs border-t">
              <div className="flex items-start gap-2.5">
                <RiMapPinLine className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Pickup Location</span>
                  <span className="font-semibold text-foreground">
                    {initialData.pickupBarangay
                      ? `Barangay ${initialData.pickupBarangay}, Butuan City`
                      : initialData.pickupLocation}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <RiCalendarLine className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Rental Dates</span>
                  <span className="font-semibold text-foreground">
                    {formatDate(initialData.pickupAt)} → {formatDate(initialData.returnAt)}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Duration: {initialData.rentalDays} {initialData.rentalDays === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <RiLockLine className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Renter Identity</span>
                  <span className="font-semibold text-foreground">
                    {initialData.customerName}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    {initialData.customerEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Authoritative Server Total */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-1">
              <span className="text-xs text-muted-foreground font-medium block">Authoritative Total Due</span>
              <div className="flex items-baseline justify-between">
                <span className="font-heading text-2xl font-extrabold text-primary">
                  ₱{amountPhp}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground uppercase">
                  {initialData.currency} Centavo Accurate
                </span>
              </div>
            </div>

            {/* Demo Reference Badge */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Demo Transaction Ref:</span>
              <span className="font-mono font-semibold text-foreground">
                {initialData.demoTxnRef}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Method Simulator */}
        <div className="lg:col-span-7 space-y-5">
          {/* Rail Selector Tabs */}
          <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Select Demo Payment Rail
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch between simulation modes to demonstrate various Philippine payment workflows.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* GCash */}
              <button
                type="button"
                onClick={() => setSelectedMethod("gcash")}
                disabled={isProcessing}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5",
                  selectedMethod === "gcash"
                    ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30"
                    : "border-border hover:border-blue-500/40 text-foreground"
                )}
              >
                <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  G
                </div>
                <span className="text-xs font-bold">GCash</span>
                <span className="text-[10px] text-muted-foreground">E-Wallet</span>
              </button>

              {/* Maya */}
              <button
                type="button"
                onClick={() => setSelectedMethod("maya")}
                disabled={isProcessing}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5",
                  selectedMethod === "maya"
                    ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30"
                    : "border-border hover:border-emerald-500/40 text-foreground"
                )}
              >
                <div className="size-7 rounded-lg bg-black text-[#05D372] flex items-center justify-center font-bold text-xs border border-emerald-500/40">
                  M
                </div>
                <span className="text-xs font-bold">Maya</span>
                <span className="text-[10px] text-muted-foreground">E-Wallet / QR</span>
              </button>

              {/* Card */}
              <button
                type="button"
                onClick={() => setSelectedMethod("card")}
                disabled={isProcessing}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5",
                  selectedMethod === "card"
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/30"
                    : "border-border hover:border-indigo-500/40 text-foreground"
                )}
              >
                <div className="size-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <RiBankCardLine className="size-4" />
                </div>
                <span className="text-xs font-bold">Card</span>
                <span className="text-[10px] text-muted-foreground">Visa / MC</span>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => setSelectedMethod("bank_transfer")}
                disabled={isProcessing}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5",
                  selectedMethod === "bank_transfer"
                    ? "border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/30"
                    : "border-border hover:border-amber-500/40 text-foreground"
                )}
              >
                <div className="size-7 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <RiGlobalLine className="size-4" />
                </div>
                <span className="text-xs font-bold">Bank</span>
                <span className="text-[10px] text-muted-foreground">InstaPay</span>
              </button>
            </div>
          </div>

          {/* Interactive Method Specific Preview */}
          <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-5">
            {/* GCash Simulator Box */}
            {selectedMethod === "gcash" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-600 text-white p-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-white text-blue-600 font-extrabold flex items-center justify-center text-sm shadow-xs">
                      G
                    </div>
                    <div>
                      <span className="font-heading font-bold text-sm block">GCash Payment Simulator</span>
                      <span className="text-[11px] text-blue-100 block">Bangko Sentral ng Pilipinas Regulated (Demo)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-blue-100 block uppercase">Amount Due</span>
                    <span className="font-mono font-bold text-base text-white">₱{amountPhp}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Simulated Merchant:</span>
                    <span className="font-semibold text-foreground">Veyra Car Rental Butuan City</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Simulated Mobile Account:</span>
                    <span className="font-mono font-semibold text-foreground">+63 917 ••• •042</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Demo Wallet Balance:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">₱25,000.00 (Demo Funds)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t pt-2">
                    <span className="text-muted-foreground">Transaction Reference:</span>
                    <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {initialData.demoTxnRef}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
                  <RiInformationLine className="size-3.5 text-blue-500 shrink-0" />
                  <span>No login credentials, PINs, or OTPs required. Simulation operates via server state machine.</span>
                </div>
              </div>
            )}

            {/* Maya Simulator Box */}
            {selectedMethod === "maya" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-black text-white p-4 flex items-center justify-between shadow-xs border border-emerald-500/30">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-black text-[#05D372] border border-[#05D372] font-black flex items-center justify-center text-sm">
                      M
                    </div>
                    <div>
                      <span className="font-heading font-bold text-sm block text-white">Maya Checkout Simulator</span>
                      <span className="text-[11px] text-[#05D372] block">QR Ph & Maya Wallet Enabled (Demo)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 block uppercase">Amount Due</span>
                    <span className="font-mono font-bold text-base text-[#05D372]">₱{amountPhp}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Simulated QR Code box */}
                  <div className="rounded-xl border p-4 bg-muted/20 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="size-24 rounded-lg border-2 border-dashed border-emerald-500/60 bg-emerald-500/5 flex flex-col items-center justify-center p-2">
                      <RiQrCodeLine className="size-16 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground">Scan QR Ph (Simulated)</span>
                    <span className="text-[10px] text-muted-foreground">Universal Philippine QR code standard</span>
                  </div>

                  {/* Wallet simulation details */}
                  <div className="rounded-xl border p-4 bg-muted/20 space-y-2.5 text-xs">
                    <span className="font-bold text-foreground block">Maya Wallet Session</span>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-mono font-semibold">+63 928 ••• •812</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available Demo:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">₱18,500.00</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="font-mono text-[11px] text-foreground">{initialData.demoTxnRef}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credit / Debit Card Simulator Box */}
            {selectedMethod === "card" && (
              <div className="space-y-4">
                {/* Visual Card Mockup */}
                <div className="rounded-2xl p-5 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md relative overflow-hidden border border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                      Veyra Test Debit Card
                    </span>
                    <div className="flex items-center gap-1 font-bold text-xs italic tracking-widest text-slate-200">
                      VISA / MC
                    </div>
                  </div>

                  {/* Card Chip Mockup */}
                  <div className="size-8 rounded-md bg-amber-400/80 border border-amber-300 flex items-center justify-center shadow-xs">
                    <div className="w-5 h-4 border border-amber-600/40 rounded-xs" />
                  </div>

                  {/* Masked Card Number */}
                  <div className="font-mono text-lg sm:text-xl tracking-widest font-bold text-slate-100">
                    •••• •••• •••• 4242
                  </div>

                  {/* Cardholder & Expiry */}
                  <div className="flex items-end justify-between text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Cardholder</span>
                      <span className="font-semibold text-slate-100 tracking-wider">
                        {initialData.customerName || "DEMO CARDHOLDER"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Expires</span>
                      <span className="font-mono font-semibold text-slate-100">12 / 28</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Card Network:</span>
                    <span className="font-semibold text-foreground">Visa 3-D Secure 2.0 (Simulated)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cardholder Authentication:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Simulated Biometric / Frictionless</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-muted-foreground">Charge Reference:</span>
                    <span className="font-mono text-xs">{initialData.demoTxnRef}</span>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
                  <RiInformationLine className="size-3.5 text-indigo-500 shrink-0" />
                  <span>Sample card fields are illustrative. Real card numbers and CVVs are strictly prohibited.</span>
                </div>
              </div>
            )}

            {/* Bank Transfer Simulator Box */}
            {selectedMethod === "bank_transfer" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between shadow-xs border border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-amber-500 text-slate-900 font-bold flex items-center justify-center">
                      <RiGlobalLine className="size-5" />
                    </div>
                    <div>
                      <span className="font-heading font-bold text-sm block text-white">Online Bank Transfer (Demo)</span>
                      <span className="text-[11px] text-amber-300 block">InstaPay Real-Time Settlement Clearing</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block uppercase">Amount Due</span>
                    <span className="font-mono font-bold text-base text-amber-400">₱{amountPhp}</span>
                  </div>
                </div>

                {/* Bank Selector */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground block">Select Simulated Bank</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBank("bpi")}
                      className={cn(
                        "p-2.5 rounded-lg border text-xs font-semibold transition-all",
                        selectedBank === "bpi"
                          ? "border-red-600 bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500"
                          : "border-border hover:bg-muted/30"
                      )}
                    >
                      BPI Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBank("bdo")}
                      className={cn(
                        "p-2.5 rounded-lg border text-xs font-semibold transition-all",
                        selectedBank === "bdo"
                          ? "border-blue-700 bg-blue-600/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-600"
                          : "border-border hover:bg-muted/30"
                      )}
                    >
                      BDO Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBank("unionbank")}
                      className={cn(
                        "p-2.5 rounded-lg border text-xs font-semibold transition-all",
                        selectedBank === "unionbank"
                          ? "border-orange-600 bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500"
                          : "border-border hover:bg-muted/30"
                      )}
                    >
                      UnionBank Demo
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beneficiary Name:</span>
                    <span className="font-semibold text-foreground">Veyra Car Rental Butuan Hub (Escrow)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Demo Account Number:</span>
                    <span className="font-mono font-semibold text-foreground">0084-••••-9281 (Test Only)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clearing Rail:</span>
                    <span className="font-semibold text-foreground">InstaPay 24/7 (Simulated Instant)</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Transfer Reference:</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{initialData.demoTxnRef}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Failure Reason Selector for Demonstration Testing */}
            <div className="border-t pt-4 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Demonstration Failure Scenario (For &apos;Simulate Failure&apos; action)
              </span>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                disabled={isProcessing}
                className="w-full text-xs rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Insufficient wallet balance in simulated account.">
                  Insufficient wallet balance (₱25,000.00 ceiling exceeded)
                </option>
                <option value="Card declined: Simulated issuer security block or high-risk alert.">
                  Card declined by issuer security rule
                </option>
                <option value="Bank transfer timed out: InstaPay clearing node unresponsive.">
                  Bank network clearing timeout
                </option>
                <option value="User rejected biometric prompt on mobile authentication screen.">
                  Customer cancelled authentication prompt
                </option>
              </select>
            </div>

            {/* Status Alert Message */}
            {statusMessage && (
              <div
                className={cn(
                  "p-3.5 rounded-xl text-xs font-medium flex items-center gap-2",
                  outcomeState === "success"
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                    : outcomeState === "failed"
                    ? "bg-destructive/10 text-destructive border border-destructive/30"
                    : "bg-muted text-foreground border"
                )}
              >
                {isProcessing && <RiLoader4Line className="size-4 animate-spin text-primary shrink-0" />}
                {outcomeState === "success" && <RiCheckLine className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                {outcomeState === "failed" && <RiAlertLine className="size-4 text-destructive shrink-0" />}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Simulation Action Controls */}
            <div className="space-y-2.5 pt-2">
              <Button
                size="lg"
                className="w-full gap-2 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isProcessing}
                onClick={() => handleSimulate("success")}
              >
                {isProcessing ? (
                  <RiLoader4Line className="size-4 animate-spin" />
                ) : (
                  <RiCheckLine className="size-4" />
                )}
                <span>Simulate Successful Payment (₱{amountPhp})</span>
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full gap-1.5 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                  disabled={isProcessing}
                  onClick={() => handleSimulate("failure")}
                >
                  <RiAlertLine className="size-4 text-amber-600" />
                  <span>Simulate Failed Payment</span>
                </Button>

                <Button
                  variant="ghost"
                  size="default"
                  className="w-full gap-1.5 text-destructive hover:bg-destructive/10"
                  disabled={isProcessing}
                  onClick={() => handleSimulate("cancel")}
                >
                  <RiCloseCircleLine className="size-4" />
                  <span>Cancel Payment</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
