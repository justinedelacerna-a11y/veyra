"use client"

import * as React from "react"
import Link from "next/link"
import { CustomerReservation } from "@/features/account/types"
import { ReservationTimeline } from "./reservation-timeline"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  RiCalendarLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiSteeringLine,
  RiGasStationLine,
  RiUser3Line,
  RiPrinterLine,
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiInformationLine,
  RiTimeLine,
  RiPhoneLine,
  RiAlertLine,
} from "@remixicon/react"

export interface ReservationDetailViewProps {
  reservation: CustomerReservation
}

export function ReservationDetailView({ reservation }: ReservationDetailViewProps) {
  const { vehicle, pricing } = reservation

  const statusTypeMap: Record<string, StatusType> = {
    upcoming: "info",
    active: "success",
    completed: "neutral",
    cancelled: "error",
  }
  const badgeStatus = statusTypeMap[reservation.status] || "info"

  const canCancel = reservation.status === "upcoming"

  return (
    <div className="space-y-8">
      {/* Back Link & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
        <div className="space-y-2">
          <Link
            href="/account/reservations"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RiArrowLeftLine className="size-3.5" />
            <span>Back to My Reservations</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Reservation {reservation.id}
            </h1>
            <StatusBadge status={badgeStatus} label={reservation.statusLabel} />
          </div>
          <p className="text-xs text-muted-foreground">
            Booked on {reservation.createdAt} · {reservation.rentalDays} days total
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <RiPrinterLine className="size-4" data-icon="inline-start" />
            <span>Print Voucher</span>
          </Button>
          {canCancel && (
            <Dialog>
              <DialogTrigger
                render={<Button variant="destructive" size="sm" />}
              >
                Cancel Reservation
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel This Reservation?</DialogTitle>
                  <DialogDescription>
                    You are requesting cancellation for reservation{" "}
                    <strong>{reservation.id}</strong> ({vehicle.make} {vehicle.model}).
                    Please review the cancellation policy before confirming.
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <RiAlertLine className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Cancellation Policy</p>
                    <p className="leading-relaxed">{reservation.cancellationPolicy}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Actual cancellation processing and any applicable refund will be governed by your rental agreement terms. This prototype UI does not process real cancellations.
                </p>

                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Keep Reservation
                  </DialogClose>
                  <DialogClose render={<Button variant="destructive" />}>
                    Confirm Cancellation Request
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Vehicle Summary */}
      <section aria-labelledby="vehicle-section-heading" className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
        <h2 id="vehicle-section-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          <RiSteeringLine className="size-4 text-primary" />
          Reserved Vehicle
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
              {vehicle.category} · {vehicle.year}
            </div>
            <div className="font-heading text-2xl font-bold text-foreground">
              {vehicle.make} {vehicle.model}
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-500/20">
            <RiShieldCheckLine className="size-3.5" />
            <span>Multi-Point Inspection Certified</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 bg-muted px-3 py-1 rounded-md text-muted-foreground font-medium">
            <RiSteeringLine className="size-3.5 text-foreground" />
            <span>{vehicle.transmission}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-muted px-3 py-1 rounded-md text-muted-foreground font-medium">
            <RiGasStationLine className="size-3.5 text-foreground" />
            <span>{vehicle.fuelType}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-muted px-3 py-1 rounded-md text-muted-foreground font-medium">
            <RiUser3Line className="size-3.5 text-foreground" />
            <span>{vehicle.seats} Seats</span>
          </span>
        </div>

        <Link href={`/vehicles/${vehicle.id}`} className="text-xs font-medium text-primary hover:underline">
          View full vehicle details →
        </Link>
      </section>

      {/* Rental Period & Locations */}
      <section aria-labelledby="rental-period-heading" className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
        <h2 id="rental-period-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          <RiCalendarLine className="size-4 text-primary" />
          Rental Period
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2 p-4 rounded-lg border bg-background/50">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pickup Handover
            </div>
            <div className="font-semibold text-lg text-foreground">
              {reservation.pickupDate}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <RiTimeLine className="size-3.5 text-primary" />
              <span>{reservation.pickupTime}</span>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1 border-t">
              <RiMapPinLine className="size-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{reservation.pickupLocationName}</div>
                <div>{reservation.pickupAddress}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-4 rounded-lg border bg-background/50">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Return & Inspection
            </div>
            <div className="font-semibold text-lg text-foreground">
              {reservation.returnDate}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <RiTimeLine className="size-3.5 text-primary" />
              <span>{reservation.returnTime}</span>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1 border-t">
              <RiMapPinLine className="size-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{reservation.returnLocationName}</div>
                <div>{reservation.returnAddress}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price Breakdown */}
      <section aria-labelledby="pricing-section-heading" className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
        <h2 id="pricing-section-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          Price Breakdown
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {pricing.currency}{pricing.dailyRate.toLocaleString()} × {pricing.rentalDays} days
            </span>
            <span className="font-medium text-foreground">
              {pricing.currency}{pricing.baseRental.toLocaleString()}
            </span>
          </div>

          {reservation.selectedExtras.length > 0 && (
            <>
              <div className="pt-2 pb-1 border-t text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Add-Ons & Extras
              </div>
              {reservation.selectedExtras.map((extra) => (
                <div key={extra.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{extra.name} ({pricing.rentalDays}d)</span>
                  <span className="font-medium">
                    {pricing.currency}{(extra.dailyRate * pricing.rentalDays).toLocaleString()}
                  </span>
                </div>
              ))}
            </>
          )}

          <div className="flex items-center justify-between pt-3 border-t font-semibold text-base">
            <span>Total Rental Price</span>
            <span className="font-heading text-xl">
              {pricing.currency}{pricing.totalRentalPrice.toLocaleString()}
            </span>
          </div>

          <div className="mt-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex items-start gap-2">
            <RiInformationLine className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Refundable Security Hold: </span>
              {pricing.currency}{pricing.refundableSecurityDeposit.toLocaleString()} — Pre-authorized as a hold on your credit card at physical vehicle handover. Released upon clean return inspection completion.
            </div>
          </div>
        </div>
      </section>

      {/* Driver Summary */}
      <section aria-labelledby="driver-section-heading" className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
        <h2 id="driver-section-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          <RiUser3Line className="size-4 text-primary" />
          Primary Driver
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Full Name</div>
            <div className="font-medium">{reservation.driver.fullName}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Contact Email</div>
            <div className="font-medium">{reservation.driver.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Phone Number</div>
            <div className="font-medium">{reservation.driver.phone}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Driver&apos;s License</div>
            <div className="font-medium font-mono">{reservation.driver.licenseNumberMasked}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{reservation.driver.licenseCountry}</div>
          </div>
        </div>
      </section>

      {/* Handover Checklist */}
      {reservation.handoverChecklist.length > 0 && (
        <section aria-labelledby="checklist-heading" className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
          <h2 id="checklist-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <RiCheckboxCircleLine className="size-4 text-primary" />
            Handover Preparation Checklist
          </h2>
          <ul className="space-y-2.5" role="list">
            {reservation.handoverChecklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <RiCheckboxCircleLine className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reservation Timeline */}
      <section aria-labelledby="timeline-heading" className="rounded-xl border bg-card p-5 sm:p-6">
        <ReservationTimeline timeline={reservation.timeline} />
      </section>

      {/* Cancellation Policy */}
      <section aria-labelledby="policy-heading" className="rounded-xl border bg-card p-5 sm:p-6 space-y-3">
        <h2 id="policy-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          <RiShieldCheckLine className="size-4 text-primary" />
          Cancellation & Modification Policy
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {reservation.cancellationPolicy}
        </p>
      </section>

      {/* Support */}
      <section className="rounded-xl border border-dashed bg-muted/30 p-5 sm:p-6 text-center space-y-3">
        <div className="space-y-1">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Need Assistance?
          </h3>
          <p className="text-xs text-muted-foreground">
            Our concierge team is available 24/7 for active rentals and within operating hours for all other inquiries.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <RiPhoneLine className="size-4" data-icon="inline-start" />
            <span>Contact Concierge</span>
          </Button>
        </div>
      </section>
    </div>
  )
}
