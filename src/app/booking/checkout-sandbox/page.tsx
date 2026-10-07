"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  RiBankCardLine,
  RiWallet3Line,
  RiShieldCheckLine,
  RiInformationLine,
  RiCloseCircleLine,
  RiCheckLine,
  RiLoader4Line,
} from "@remixicon/react"

export default function CheckoutSandboxPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get("ref") || "VYR-UNKNOWN"
  const sessionId = searchParams.get("session_id") || "cs_sandbox"

  const [isProcessing, setIsProcessing] = React.useState(false)
  const [selectedMethod, setSelectedMethod] = React.useState<"card" | "gcash" | "maya">("card")
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)

  const handleSimulatePayment = async (action: "paid" | "failed") => {
    setIsProcessing(true)
    setStatusMessage(action === "paid" ? "Submitting authorized payment..." : "Declining payment...")

    try {
      const res = await fetch("/api/dev/paymongo-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, action }),
      })

      const data = await res.json()
      if (data.success && action === "paid") {
        setStatusMessage("Payment verified by PayMongo webhook! Redirecting to confirmation...")
        setTimeout(() => {
          router.push(`/booking/confirmation?ref=${reference}&session_id=${sessionId}`)
        }, 1200)
      } else if (action === "failed") {
        setStatusMessage("Payment marked failed. Returning to booking...")
        setTimeout(() => {
          router.push(`/booking/payment?ref=${reference}&cancelled=true`)
        }, 1200)
      } else {
        setStatusMessage(data.message || "Simulation error")
        setIsProcessing(false)
      }
    } catch (err) {
      console.error("Simulation error:", err)
      setStatusMessage("Failed to simulate webhook event.")
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <RiShieldCheckLine className="size-3.5" />
          <span>PayMongo Sandbox Environment</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          PayMongo Secure Checkout
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Complete payment verification for booking reference <span className="font-mono font-bold text-foreground">{reference}</span>.
        </p>
      </div>

      <Alert className="border-primary/30 bg-primary/5">
        <RiInformationLine className="size-4 text-primary" />
        <AlertTitle className="text-xs font-bold text-foreground">
          Test Mode / Sandbox Simulator
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          This simulated PayMongo gateway verifies full end-to-end webhook cryptographic signature verification and server-side reservation state transitions without charging real money.
        </AlertDescription>
      </Alert>

      {/* Payment Selection Box */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Booking Reference</span>
          <span className="font-mono text-sm font-bold text-primary">{reference}</span>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-bold text-foreground block">Select Sandbox Payment Rail</span>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedMethod === "card"
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <RiBankCardLine className="size-5 mx-auto mb-1 text-primary" />
              <span className="text-xs font-semibold block">Credit Card</span>
              <span className="text-[10px] text-muted-foreground">Visa / MC</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("gcash")}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedMethod === "gcash"
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <RiWallet3Line className="size-5 mx-auto mb-1 text-blue-500" />
              <span className="text-xs font-semibold block">GCash</span>
              <span className="text-[10px] text-muted-foreground">E-Wallet</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("maya")}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedMethod === "maya"
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <RiWallet3Line className="size-5 mx-auto mb-1 text-emerald-500" />
              <span className="text-xs font-semibold block">Maya</span>
              <span className="text-[10px] text-muted-foreground">E-Wallet</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-muted/60 text-xs font-medium text-center text-foreground flex items-center justify-center gap-2">
            {isProcessing && <RiLoader4Line className="size-4 animate-spin text-primary" />}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <Button
            size="lg"
            className="w-full gap-2 font-semibold shadow-md"
            disabled={isProcessing}
            onClick={() => handleSimulatePayment("paid")}
          >
            <RiCheckLine className="size-4" />
            <span>Simulate Successful Payment</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-destructive hover:bg-destructive/10"
            disabled={isProcessing}
            onClick={() => handleSimulatePayment("failed")}
          >
            <RiCloseCircleLine className="size-4" />
            <span>Simulate Payment Failure / Cancel</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
