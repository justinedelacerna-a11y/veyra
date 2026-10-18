"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import {
  RiCheckboxCircleLine,
  RiSteeringLine,
  RiMapPinLine,
  RiCalendarLine,
  RiUserLine,
  RiPrinterLine,
  RiHome5Line,
  RiCarLine,
  RiShieldCheckLine,
  RiRefreshLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

interface AuthoritativeReservation {
  id: string
  reference: string
  status: string
  paymentStatus: string
  paymentMethod: string
  totalAmountCentavos: number
  depositAmountCentavos: number
  currency: string
  rentalDays: number
  pickupAt: string
  returnAt: string
  pickupStreetAddress?: string | null
  pickupLandmark?: string | null
  pickupBarangay?: string | null
  createdAt: string
  vehicle?: {
    id: string
    make: string
    model: string
    year: number
    category: string
  } | null
  pickupLocation?: { id: string; name: string; city: string } | null
  returnLocation?: { id: string; name: string; city: string } | null
  payment?: {
    id: string
    status: string
    amountCentavos: number
    currency: string
    method: string
    provider: string
    providerTxnRef?: string | null
    providerPaymentId?: string | null
    updatedAt: string
    failureReason?: string | null
  } | null
}

export function ConfirmationView() {
  const searchParams = useSearchParams()
  const {
    draft,
    vehicle,
    pickupLocationName,
    returnLocationName,
    rentalDays,
    pricing,
    resetBooking,
  } = useBooking()

  const reference =
    searchParams.get("ref") || draft.bookingReference || "VYR-DEMO-1042"
  const isCancelled = searchParams.get("cancelled") === "true"
  const isFailed = searchParams.get("failed") === "true"
  const sessionId = searchParams.get("session_id")

  // Authoritative server-loaded reservation & payment record
  const [liveData, setLiveData] = React.useState<AuthoritativeReservation | null>(null)

  const fetchAuthoritativeStatus = React.useCallback(() => {
    if (!reference || reference.startsWith("VYR-DEMO")) {
      return
    }

    fetch(`/api/reservations/lookup?ref=${encodeURIComponent(reference)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { success: boolean; reservation?: AuthoritativeReservation } | null) => {
        if (data?.success && data?.reservation) {
          setLiveData(data.reservation)
        }
      })
      .catch((err) => {
        console.warn("[confirmation-view] Could not load authoritative reservation:", err)
      })
  }, [reference])

  React.useEffect(() => {
    let active = true
    if (!reference || reference.startsWith("VYR-DEMO")) {
      return
    }

    fetch(`/api/reservations/lookup?ref=${encodeURIComponent(reference)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { success: boolean; reservation?: AuthoritativeReservation } | null) => {
        if (active && data?.success && data?.reservation) {
          setLiveData(data.reservation)
        }
      })
      .catch((err) => {
        console.warn("[confirmation-view] Could not load authoritative reservation:", err)
      })

    return () => {
      active = false
    }
  }, [reference])

  // Derive authoritative states
  const effectivePaymentStatus =
    liveData?.paymentStatus ||
    liveData?.payment?.status ||
    (isCancelled || isFailed ? "failed" : "pending")

  const effectiveMethod = liveData?.paymentMethod || draft.paymentMethod || "pay_at_pickup"

  const methodLabel =
    effectiveMethod === "pay_at_pickup" || effectiveMethod === "counter"
      ? "Pay at Pickup (In-Person Settlement)"
      : effectiveMethod === "gcash"
      ? "GCash Mobile Wallet"
      : effectiveMethod === "maya"
      ? "Maya Digital Wallet"
      : effectiveMethod === "card"
      ? "Credit / Debit Card"
      : "Pay at Pickup (In-Person Settlement)"

  const isPaid = effectivePaymentStatus === "captured"
  const isPaymentFailed = effectivePaymentStatus === "failed" || isCancelled || isFailed

  const reservationStatusBadge =
    liveData?.status === "confirmed"
      ? { status: "success" as const, label: "Reservation Confirmed" }
      : liveData?.status === "held"
      ? { status: "info" as const, label: "Reservation Held" }
      : liveData?.status === "payment_pending"
      ? { status: "warning" as const, label: "Awaiting Settlement" }
      : isPaid
      ? { status: "success" as const, label: "Reservation Confirmed" }
      : { status: "info" as const, label: "Reservation Active" }

  const paymentStatusBadge = isPaid
    ? { status: "success" as const, label: "Payment: Paid (Online)" }
    : isPaymentFailed
    ? { status: "error" as const, label: "Payment: Action Needed" }
    : { status: "info" as const, label: "Payment: Pending Settlement" }

  const displayRentalDays = liveData?.rentalDays || rentalDays
  const displayTotal = liveData
    ? Math.round(liveData.totalAmountCentavos / 100)
    : pricing.totalRentalPrice
  const displayDeposit = liveData
    ? Math.round(liveData.depositAmountCentavos / 100)
    : pricing.refundableSecurityDeposit

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Cancellation / Failure Warning Notice if customer returned from failed checkout */}
      {isPaymentFailed && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <RiShieldCheckLine className="size-4 shrink-0" />
            <span>Payment Incomplete — Reservation Held Safely</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your transaction was not completed. Do not worry: your booking reference{" "}
            <span className="font-mono font-semibold text-foreground">{reference}</span> is held.
            You can retry online payment or choose to settle in person upon vehicle handover.
          </p>
          <div className="pt-1 flex items-center gap-3">
            <Link href={`/booking/payment?ref=${reference}`}>
              <Button size="sm" variant="default" className="text-xs gap-1.5 shadow-xs">
                <span>Retry Payment Settlement</span>
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAuthoritativeStatus}
              className="text-xs gap-1.5"
            >
              <RiRefreshLine className="size-3.5" />
              <span>Refresh Status</span>
            </Button>
          </div>
        </div>
      )}

      {/* Success Hero Card */}
      <div className="rounded-3xl border bg-card/80 p-6 sm:p-10 text-center shadow-lg backdrop-blur-xs space-y-4">
        <div className="flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <RiCheckboxCircleLine className="size-12" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <StatusBadge
              status={reservationStatusBadge.status}
              label={reservationStatusBadge.label}
              size="sm"
            />
            <StatusBadge
              status={paymentStatusBadge.status}
              label={paymentStatusBadge.label}
              size="sm"
            />
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Reservation Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Your vehicle reservation has been successfully confirmed in Veyra. Review your itinerary and handover instructions below.
          </p>
        </div>

        {/* Reference Code Box */}
        <div className="inline-flex flex-col items-center justify-center rounded-2xl border bg-muted/40 px-6 py-3.5 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Booking Reference
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-primary tracking-widest">
            {reference}
          </span>
        </div>
      </div>

      {/* Confirmation Summary Card */}
      <div className="rounded-2xl border bg-card/60 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <h2 className="text-sm font-bold text-foreground">
            Itinerary & Handover Details
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {displayRentalDays} {displayRentalDays === 1 ? "Day Rental" : "Days Rental"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Vehicle info */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <RiSteeringLine className="size-4 text-primary" />
              <span>Assigned Vehicle</span>
            </div>
            <p className="font-heading text-base font-bold text-foreground">
              {liveData?.vehicle
                ? `${liveData.vehicle.year} ${liveData.vehicle.make} ${liveData.vehicle.model}`
                : `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            </p>
            <p className="text-muted-foreground">
              {(liveData?.vehicle?.category || vehicle.category).toUpperCase()} • {vehicle.fuelType} • {vehicle.transmission}
            </p>
          </div>

          {/* Primary Driver */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <RiUserLine className="size-4 text-primary" />
              <span>Primary Driver</span>
            </div>
            <p className="font-heading text-base font-bold text-foreground">
              {draft.driver.firstName
                ? `${draft.driver.firstName} ${draft.driver.lastName}`
                : "Registered Driver"}
            </p>
            <p className="text-muted-foreground">
              {draft.driver.phone || "Phone on file"} • {draft.driver.email || "Email on file"}
            </p>
          </div>
        </div>

        {/* Handover locations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <RiMapPinLine className="size-4 text-primary" />
              <span>Pickup & Handover Location</span>
            </div>
            <p className="text-foreground font-medium">
              {liveData?.pickupLocation?.name || pickupLocationName}
            </p>
            {liveData?.pickupStreetAddress && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Specific Address: </span>
                {liveData.pickupStreetAddress}
                {liveData.pickupLandmark ? ` (Near: ${liveData.pickupLandmark})` : ""}
              </p>
            )}
            <p className="text-muted-foreground">
              {draft.pickupDate} at {draft.pickupTime}
            </p>
            <span className="text-[11px] text-muted-foreground block pt-1">
              Valet agent stationed at arrival terminal
            </span>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <RiCalendarLine className="size-4 text-primary" />
              <span>Return & Handover Location</span>
            </div>
            <p className="text-foreground font-medium">
              {liveData?.returnLocation?.name || returnLocationName}
            </p>
            <p className="text-muted-foreground">
              {draft.returnDate} at {draft.returnTime}
            </p>
            <span className="text-[11px] text-muted-foreground block pt-1">
              Concierge hotline available for itinerary extensions
            </span>
          </div>
        </div>

        {/* Pricing & Payment Summary */}
        <div className="rounded-xl border bg-muted/40 p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Payment Method:</span>
            <span className="font-semibold text-foreground">
              {methodLabel}
            </span>
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Payment Status:</span>
            <span
              className={cn(
                "font-semibold",
                isPaid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isPaymentFailed
                  ? "text-destructive"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              {isPaid
                ? "Paid & Settled via PayMongo ✅"
                : isPaymentFailed
                ? "Payment Failed / Action Needed"
                : "Pending / Settle at Handover"}
            </span>
          </div>

          {liveData?.payment?.providerTxnRef && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Payment Transaction Reference:</span>
              <span className="font-mono text-[11px] text-foreground font-semibold">
                {liveData.payment.providerTxnRef}
              </span>
            </div>
          )}

          {sessionId && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Checkout Session Ref:</span>
              <span className="font-mono text-[11px] text-foreground">
                {sessionId}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Total Rental Amount:</span>
            <span className="font-heading text-sm font-bold text-foreground">
              ₱{displayTotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Security Deposit:</span>
            <span className="font-mono font-medium text-foreground">
              ₱{displayDeposit.toLocaleString()} (Pre-authorized at Handover)
            </span>
          </div>
        </div>

        {/* Next Steps Card */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Handover Checklist
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <RiShieldCheckLine className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                Present your physical driver license ({draft.driver.licenseNumber || "registered license"}) and valid credit card upon arrival at the airport valet bay.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <RiShieldCheckLine className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                Your vehicle has been pre-inspected, sanitized, and parked in the terminal valet bay for key handover.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="w-full sm:w-auto gap-2 text-xs"
        >
          <RiPrinterLine className="size-4" data-icon="inline-start" />
          <span>Print Summary</span>
        </Button>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link href="/account/reservations" className="w-full sm:w-auto">
            <Button
              variant="default"
              onClick={resetBooking}
              className="w-full sm:w-auto gap-2 text-xs font-semibold shadow-xs"
            >
              <RiCarLine className="size-4" data-icon="inline-start" />
              <span>View in My Reservations</span>
            </Button>
          </Link>

          <Link href="/vehicles" className="w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={resetBooking}
              className="w-full sm:w-auto gap-2 text-xs"
            >
              <span>Browse Fleet</span>
            </Button>
          </Link>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={resetBooking}
              className="w-full sm:w-auto gap-2 text-xs"
            >
              <RiHome5Line className="size-4" data-icon="inline-start" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
