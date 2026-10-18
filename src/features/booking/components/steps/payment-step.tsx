"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { KycBookingGate } from "../kyc-booking-gate"
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
  RiQrCodeLine,
  RiGlobalLine,
  RiCarLine,
  RiMapPinLine,
  RiCalendarLine,
  RiAlertLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"
import type { PaymentMethodConfig, PaymentMethodId } from "@/features/payment/types"

export function PaymentStep() {
  const router = useRouter()
  const {
    draft,
    updateDraft,
    pricing,
    vehicle,
    pickupLocationName,
    returnLocationName,
    rentalDays,
    completeBooking,
    quoteError,
  } = useBooking()

  // KYC Verification state
  const [isKycVerified, setIsKycVerified] = React.useState<boolean>(false)

  // Payment methods loaded from server configuration
  const [methods, setMethods] = React.useState<PaymentMethodConfig[]>([
    {
      id: "pay_at_pickup",
      label: "Pay at Pickup",
      description: "Pay upon key handover at the vehicle branch or valet bay via cash or POS terminal.",
      type: "manual",
      enabled: true,
      badge: "Zero Fee",
      iconName: "hand-coin",
    },
  ])
  const [gatewayOnline, setGatewayOnline] = React.useState(false)

  const [paymentChoice, setPaymentChoice] = React.useState<PaymentMethodId>(
    (draft.paymentMethod as PaymentMethodId) || "pay_at_pickup"
  )

  const [agreedTerms, setAgreedTerms] = React.useState(draft.agreedToTerms)
  const [agreedCancel, setAgreedCancel] = React.useState(draft.agreedToCancellation)
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Fetch available methods from server registry
  React.useEffect(() => {
    let active = true
    fetch("/api/payment-methods")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { success: boolean; gatewayOnline: boolean; methods: PaymentMethodConfig[] } | null) => {
        if (!active || !data || !data.methods) return
        setMethods(data.methods)
        setGatewayOnline(Boolean(data.gatewayOnline))

        // Ensure current choice is still valid
        const availableIds = data.methods.filter((m) => m.enabled).map((m) => m.id)
        if (!availableIds.includes(paymentChoice)) {
          setPaymentChoice(availableIds[0] || "pay_at_pickup")
        }
      })
      .catch((err) => {
        console.warn("[payment-step] Could not load payment methods:", err)
      })

    return () => {
      active = false
    }
  }, [paymentChoice])

  const selectedMethod = methods.find((m) => m.id === paymentChoice) || methods[0]

  const handleComplete = async () => {
    setErrorNotice(null)

    if (!isKycVerified) {
      setErrorNotice(
        "Identity verification is required before confirming a rental. Please complete verification above."
      )
      return
    }

    if (quoteError) {
      setErrorNotice(quoteError)
      return
    }

    if (!agreedTerms) {
      setErrorNotice(
        "You must read and agree to Veyra's Terms of Service before finalizing your booking."
      )
      return
    }

    if (!agreedCancel) {
      setErrorNotice(
        "Please acknowledge the refundable security deposit conditions before proceeding."
      )
      return
    }

    setIsSubmitting(true)
    try {
      updateDraft({
        paymentMethod: paymentChoice,
        agreedToTerms: agreedTerms,
        agreedToCancellation: agreedCancel,
      })

      const ref = await completeBooking({
        paymentMethod: paymentChoice,
        agreedToTerms: agreedTerms,
        agreedToCancellation: agreedCancel,
      })
      if (ref) {
        router.push(`/booking/confirmation?ref=${ref}`)
      }
    } catch (err) {
      setErrorNotice(
        err instanceof Error ? err.message : "Failed to record reservation. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date display
  const formatDateDisplay = (dateStr: string, timeStr: string) => {
    try {
      const d = new Date(`${dateStr}T${timeStr}`)
      return (
        d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) + ` · ${timeStr}`
      )
    } catch {
      return `${dateStr} ${timeStr}`
    }
  }

  const renderMethodIcon = (iconName: PaymentMethodConfig["iconName"]) => {
    switch (iconName) {
      case "bank-card":
        return <RiBankCardLine className="size-5 text-primary" />
      case "wallet":
        return <RiWallet3Line className="size-5 text-primary" />
      case "qr-code":
        return <RiQrCodeLine className="size-5 text-primary" />
      case "global":
        return <RiGlobalLine className="size-5 text-primary" />
      case "hand-coin":
      default:
        return <RiHandCoinLine className="size-5 text-primary" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Title & Context */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Step 05 of 06
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Verification & Payment Settlement
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Confirm your identity clearance, review your itinerary, and select your preferred settlement method.
        </p>
      </div>

      {/* PART 1 & 2: KYC Booking Gate Component */}
      <KycBookingGate
        onStatusChange={(verified) => setIsKycVerified(verified)}
        returnUrl="/booking/payment"
      />

      {/* Rental Overview Card */}
      <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Rental Overview
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {rentalDays} {rentalDays === 1 ? "Day" : "Days"} Rental
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Vehicle */}
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiCarLine className="size-4" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Vehicle</span>
              <span className="font-semibold text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </span>
            </div>
          </div>

          {/* Pickup Barangay / Hub */}
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiMapPinLine className="size-4" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Pickup Barangay / Hub</span>
              <span className="font-semibold text-foreground truncate block">
                {pickupLocationName}
              </span>
            </div>
          </div>

          {/* Return Barangay / Hub */}
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiMapPinLine className="size-4" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Return Barangay / Hub</span>
              <span className="font-semibold text-foreground truncate block">
                {returnLocationName}
              </span>
            </div>
          </div>

          {/* Schedule */}
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiCalendarLine className="size-4" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Dates</span>
              <span className="font-semibold text-foreground block">
                {formatDateDisplay(draft.pickupDate, draft.pickupTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Selection */}
      <div className="space-y-4 rounded-2xl border bg-card/60 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h2 className="text-sm font-bold text-foreground">Select Payment Method</h2>
            <p className="text-xs text-muted-foreground">
              {gatewayOnline
                ? "Choose an instant digital checkout channel or settle in-person upon pickup."
                : "Deferred settlement is enabled. Pay at vehicle handover with zero processing fees."}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            Total Due: {pricing.currency}
            {pricing.totalRentalPrice.toLocaleString()}
          </span>
        </div>

        {/* Available Configured Payment Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {methods
            .filter((m) => m.enabled)
            .map((method) => {
              const isSelected = paymentChoice === method.id
              const isDemo = method.type === "demo" || method.isDemo
              return (
                <div
                  key={method.id}
                  onClick={() => setPaymentChoice(method.id)}
                  className={cn(
                    "flex flex-col justify-between gap-3 rounded-xl border p-4 cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderMethodIcon(method.iconName)}
                      {method.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            isDemo
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "size-4 rounded-full border flex items-center justify-center",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                      )}
                    >
                      {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {method.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-2">
                      {method.description}
                    </span>
                  </div>
                </div>
              )
            })}
        </div>

        {selectedMethod?.type === "demo" && (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
            <RiShieldCheckLine className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs font-bold">
              DEMO MODE — NO REAL MONEY INVOLVED
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-700/90 dark:text-amber-300/80">
              You selected {selectedMethod.label}. This transaction will run in simulation mode for capstone evaluation. You will be able to simulate success, failure, and cancellation without real money or financial credentials.
            </AlertDescription>
          </Alert>
        )}

        {!gatewayOnline && selectedMethod?.type === "manual" && (
          <Alert className="border-border bg-muted/30">
            <RiInformationLine className="size-4 text-muted-foreground" />
            <AlertTitle className="text-xs font-bold text-foreground">
              Pay at Pickup Settlement
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Your reservation will be confirmed immediately with payment status set to pending. Settle in person via cash or card POS terminal upon vehicle handover at the valet bay or branch.
            </AlertDescription>
          </Alert>
        )}
      </div>


      {/* Terms & Policies Checkboxes */}
      <div className="space-y-3 rounded-2xl border bg-card/60 p-5 shadow-xs">
        <span className="text-sm font-bold text-foreground block">
          Rental Policies & Authorizations
        </span>

        <label className="flex items-start gap-3 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
          <Checkbox
            checked={agreedTerms}
            onCheckedChange={(checked) => setAgreedTerms(!!checked)}
            className="mt-0.5"
            id="terms-acceptance-checkbox"
          />
          <span className="leading-relaxed">
            I have read and agree to Veyra&apos;s{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Service
            </Link>
            .
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
            {pricing.refundableSecurityDeposit.toLocaleString()} will be pre-authorized upon vehicle key handover and released following post-rental inspection.
          </span>
        </label>

        {errorNotice && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <RiAlertLine className="size-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>

      {/* PART 6: Clear Final Pre-Confirmation Summary */}
      <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Final Rental Summary
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border bg-background/50 p-3.5 space-y-1">
            <span className="text-muted-foreground block text-[11px]">Rental Total</span>
            <span className="font-heading text-lg font-bold text-primary">
              ₱{pricing.totalRentalPrice.toLocaleString()}
            </span>
          </div>

          <div className="rounded-xl border bg-background/50 p-3.5 space-y-1">
            <span className="text-muted-foreground block text-[11px]">Payment Method</span>
            <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              {renderMethodIcon(selectedMethod?.iconName || "hand-coin")}
              <span>{selectedMethod?.label || "Pay at Pickup"}</span>
            </span>
          </div>

          <div className="rounded-xl border bg-background/50 p-3.5 space-y-1">
            <span className="text-muted-foreground block text-[11px]">Verification Clearance</span>
            <span
              className={cn(
                "font-semibold text-sm flex items-center gap-1.5",
                isKycVerified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              )}
            >
              <RiShieldCheckLine className="size-4 shrink-0" />
              <span>{isKycVerified ? "KYC Verified ✅" : "Verification Required"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Link href="/booking/review">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <RiArrowLeftLine className="size-4" data-icon="inline-start" />
            <span>Back to Review</span>
          </Button>
        </Link>

        {isKycVerified ? (
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={isSubmitting || Boolean(quoteError)}
            className="gap-2 font-semibold shadow-md"
          >
            <RiShieldCheckLine className="size-4" data-icon="inline-start" />
            <span>
              {isSubmitting
                ? "Processing..."
                : selectedMethod?.type === "manual"
                ? `Confirm Reservation • Pay at Handover (₱${pricing.totalRentalPrice.toLocaleString()})`
                : `Proceed to ${selectedMethod?.label || "Demo"} Simulator (₱${pricing.totalRentalPrice.toLocaleString()})`}
            </span>
            <RiArrowRightLine className="size-4" data-icon="inline-end" />
          </Button>
        ) : (
          <Button
            size="lg"
            disabled
            variant="outline"
            className="gap-2 font-semibold opacity-70 cursor-not-allowed"
          >
            <RiAlertLine className="size-4 text-amber-500" data-icon="inline-start" />
            <span>Complete Identity Clearance Above to Continue</span>
          </Button>
        )}
      </div>
    </div>
  )
}
