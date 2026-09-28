"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  RiBankCardLine,
  RiWallet3Line,
  RiHandCoinLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiLockLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export function PaymentStep() {
  const router = useRouter()
  const {
    draft,
    updateDraft,
    pricing,
    completeBooking,
  } = useBooking()

  const [paymentChoice, setPaymentChoice] = React.useState<
    "card" | "e-wallet" | "counter"
  >(draft.paymentMethod || "card")

  const [agreedTerms, setAgreedTerms] = React.useState(draft.agreedToTerms)
  const [agreedCancel, setAgreedCancel] = React.useState(
    draft.agreedToCancellation
  )
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null)

  const handleComplete = () => {
    setErrorNotice(null)

    if (!agreedTerms || !agreedCancel) {
      setErrorNotice(
        "Please acknowledge the rental terms and security deposit conditions before proceeding."
      )
      return
    }

    updateDraft({
      paymentMethod: paymentChoice,
      agreedToTerms: agreedTerms,
      agreedToCancellation: agreedCancel,
    })

    const ref = completeBooking()
    router.push(`/booking/confirmation?ref=${ref}`)
  }

  return (
    <div className="space-y-6">
      {/* Step Title & Context */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Step 05 of 06
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Payment Method & Agreement
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Select your preferred payment method and review rental terms. In prototype mode, no actual charges or card transactions occur.
        </p>
      </div>

      {/* Prototype Environment Notice */}
      <Alert className="border-primary/30 bg-primary/5">
        <RiInformationLine className="size-4 text-primary" />
        <AlertTitle className="text-xs font-bold text-foreground">
          Frontend Prototype Mode
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Payment processing gateway integration is scheduled for backend milestones. Selecting a method here simulates reservation confirmation without billing your account.
        </AlertDescription>
      </Alert>

      {/* Payment Options Selection */}
      <div className="space-y-4 rounded-2xl border bg-card/60 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-sm font-bold text-foreground">
            Select Payment Method
          </span>
          <span className="text-xs font-mono font-bold text-primary">
            Total Due: {pricing.currency}
            {pricing.totalRentalPrice.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card Option */}
          <div
            onClick={() => setPaymentChoice("card")}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition-all",
              paymentChoice === "card"
                ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div className="flex items-center justify-between">
              <RiBankCardLine className="size-5 text-primary" />
              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  paymentChoice === "card"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {paymentChoice === "card" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">
                Credit / Debit Card
              </span>
              <span className="text-[11px] text-muted-foreground">
                Visa, Mastercard, JCB
              </span>
            </div>
          </div>

          {/* E-Wallet Option */}
          <div
            onClick={() => setPaymentChoice("e-wallet")}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition-all",
              paymentChoice === "e-wallet"
                ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div className="flex items-center justify-between">
              <RiWallet3Line className="size-5 text-primary" />
              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  paymentChoice === "e-wallet"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {paymentChoice === "e-wallet" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">
                Digital Wallet
              </span>
              <span className="text-[11px] text-muted-foreground">
                GCash, Maya, QR Ph
              </span>
            </div>
          </div>

          {/* Pay at Handover */}
          <div
            onClick={() => setPaymentChoice("counter")}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition-all",
              paymentChoice === "counter"
                ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div className="flex items-center justify-between">
              <RiHandCoinLine className="size-5 text-primary" />
              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  paymentChoice === "counter"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {paymentChoice === "counter" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">
                Pay at Handover
              </span>
              <span className="text-[11px] text-muted-foreground">
                Valet Bay POS Terminal
              </span>
            </div>
          </div>
        </div>

        {/* Card Simulator Details (Decorative Prototype) */}
        {paymentChoice === "card" && (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">
                Prototype Card Simulator
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <RiLockLine className="size-3" />
                <span>Encrypted Simulation</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <span className="text-[10px] text-muted-foreground block uppercase">
                  Cardholder Name
                </span>
                <div className="h-9 rounded-lg border border-input bg-card px-3 flex items-center text-xs font-mono text-muted-foreground">
                  {draft.driver.firstName
                    ? `${draft.driver.firstName} ${draft.driver.lastName}`
                    : "MARIA SANTOS"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground block uppercase">
                  Card Number
                </span>
                <div className="h-9 rounded-lg border border-input bg-card px-3 flex items-center text-xs font-mono text-muted-foreground">
                  •••• •••• •••• 4242
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terms & Consent Acknowledgements */}
      <div className="space-y-3 rounded-2xl border bg-card/60 p-5 shadow-xs">
        <span className="text-sm font-bold text-foreground block">
          Policies & Agreements
        </span>

        <label className="flex items-start gap-3 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
          <Checkbox
            checked={agreedTerms}
            onCheckedChange={(checked) => setAgreedTerms(!!checked)}
            className="mt-0.5"
          />
          <span>
            I acknowledge that I have reviewed the Veyra Rental Terms and Privacy Guidelines, and confirm that the primary driver meets the minimum age requirement of 21 years old.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
          <Checkbox
            checked={agreedCancel}
            onCheckedChange={(checked) => setAgreedCancel(!!checked)}
            className="mt-0.5"
          />
          <span>
            I understand that a refundable security deposit of ₱
            {pricing.refundableSecurityDeposit.toLocaleString()} will be pre-authorized upon key handover and released after vehicle inspection.
          </span>
        </label>

        {errorNotice && (
          <p className="text-xs text-destructive font-medium pt-1">
            {errorNotice}
          </p>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Link href="/booking/review">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <RiArrowLeftLine className="size-4" data-icon="inline-start" />
            <span>Back to Review</span>
          </Button>
        </Link>

        <Button
          size="lg"
          onClick={handleComplete}
          className="gap-2 font-semibold shadow-md"
        >
          <RiShieldCheckLine className="size-4" data-icon="inline-start" />
          <span>Complete Booking (Demo Mode)</span>
          <RiArrowRightLine className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
