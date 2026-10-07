import * as React from "react"
import Link from "next/link"
import { CustomerReservation } from "@/features/account/types"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  RiCalendarLine,
  RiMapPinLine,
  RiArrowRightLine,
  RiSteeringLine,
  RiGasStationLine,
  RiUser3Line,
} from "@remixicon/react"
import { VehicleImage } from "@/components/ui/vehicle-image"

export interface ReservationCardProps {
  reservation: CustomerReservation
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  const { vehicle, pricing } = reservation

  const statusTypeMap: Record<string, StatusType> = {
    upcoming: "info",
    active: "success",
    return_inspection: "pending",
    completed: "neutral",
    cancelled: "error",
    no_show: "error",
    disputed: "warning",
  }

  const badgeStatus = statusTypeMap[reservation.status] || "info"

  return (
    <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
      {/* Left: Vehicle Info & Itinerary */}
      <div className="space-y-3.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded">
            {reservation.id}
          </span>
          <span className="text-xs text-muted-foreground">
            Booked on {reservation.createdAt}
          </span>
          <StatusBadge
            status={badgeStatus}
            label={reservation.statusLabel}
            size="sm"
          />
          <StatusBadge
            status={
              reservation.paymentStatus === "captured"
                ? "success"
                : reservation.paymentStatus === "pending"
                ? "warning"
                : reservation.paymentStatus === "failed"
                ? "error"
                : "neutral"
            }
            label={
              reservation.paymentStatus === "captured"
                ? "Paid"
                : reservation.paymentStatus === "pending"
                ? "Pending Payment"
                : reservation.paymentStatus === "failed"
                ? "Payment Failed"
                : "Authorized"
            }
            size="sm"
          />
        </div>

        <div className="flex items-start gap-4">
          <div className="relative size-20 sm:size-24 shrink-0 rounded-xl overflow-hidden border bg-muted/30">
            <VehicleImage
              src={vehicle.primaryImage || vehicle.images?.[0] || null}
              alt={`${vehicle.make} ${vehicle.model}`}
              aspectRatio="none"
              category={vehicle.category}
              containerClassName="size-20 sm:size-24"
              showFallbackBadge={false}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-wider">
              <span>{vehicle.category}</span>
              <span>•</span>
              <span>{vehicle.year} Model</span>
            </div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground truncate">
              {vehicle.make} {vehicle.model}
            </h3>

            {/* Specs */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1">
                <RiSteeringLine className="size-3.5 text-foreground" />
                <span>{vehicle.transmission}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <RiGasStationLine className="size-3.5 text-foreground" />
                <span>{vehicle.fuelType}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <RiUser3Line className="size-3.5 text-foreground" />
                <span>{vehicle.seats} Seats</span>
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Hubs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 text-muted-foreground">
          <div className="flex items-start gap-1.5">
            <RiCalendarLine className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-foreground block">
                Pickup: {reservation.pickupDate} ({reservation.pickupTime})
              </span>
              <span className="text-[11px] truncate block flex items-center gap-1">
                <RiMapPinLine className="size-3 shrink-0" />
                <span className="truncate">
                  {reservation.pickupBarangay ? `Brgy. ${reservation.pickupBarangay}, Butuan City` : reservation.pickupLocationName}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-start gap-1.5">
            <RiCalendarLine className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-foreground block">
                Return: {reservation.returnDate} ({reservation.returnTime})
              </span>
              <span className="text-[11px] truncate block flex items-center gap-1">
                <RiMapPinLine className="size-3 shrink-0" />
                <span className="truncate">
                  {reservation.returnBarangay ? `Brgy. ${reservation.returnBarangay}, Butuan City` : reservation.returnLocationName}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Pricing & CTA */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 shrink-0 gap-4">
        <div className="text-left md:text-right">
          <span className="text-xs text-muted-foreground block">Total Rental ({reservation.rentalDays} Days)</span>
          <span className="font-heading text-xl sm:text-2xl font-bold text-foreground">
            {pricing.currency}{pricing.totalRentalPrice.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground block">
            Deposit: {pricing.currency}{pricing.refundableSecurityDeposit.toLocaleString()} (Refundable Hold)
          </span>
        </div>

        <Link href={`/account/reservations/${reservation.id}`} className="shrink-0">
          <Button size="sm" className="gap-1.5">
            <span>View Details</span>
            <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
