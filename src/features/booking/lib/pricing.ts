import { Vehicle } from "@/types"
import { BookingPricingSummary, ExtraOption } from "../types"
import { MOCK_BOOKING_EXTRAS } from "../data/extras"

/**
 * Frontend Mock Pricing Calculation Abstraction
 * NOTE: This is a client-side calculation boundary for prototype/demo mode.
 * In production, this will be replaced with an authoritative server-side quote engine.
 */
export function calculateBookingPricing(
  vehicle: Vehicle,
  rentalDays: number,
  selectedExtraIds: string[],
  availableExtras: ExtraOption[] = MOCK_BOOKING_EXTRAS
): BookingPricingSummary {
  const safeDays = Math.max(1, rentalDays)
  const baseRental = vehicle.dailyRate * safeDays

  // Calculate extras total: each selected extra's daily rate × rental duration
  const extrasSubtotal = selectedExtraIds.reduce((sum, extraId) => {
    const extra = availableExtras.find((e) => e.id === extraId)
    if (!extra) return sum
    return sum + extra.dailyRate * safeDays
  }, 0)

  // In Veyra's upfront transparent pricing, these are zero or included
  const airportConcessionFee = 0
  const mandatoryLiabilityCoverage = 0
  const localTaxes = 0
  const discount = 0

  const subtotal = baseRental + extrasSubtotal
  const totalRentalPrice = subtotal - discount

  // Refundable security deposit is strictly separated from the rental price total!
  // Held as card authorization upon physical vehicle handover.
  const refundableSecurityDeposit = vehicle.securityDeposit || 10000

  return {
    dailyRate: vehicle.dailyRate,
    rentalDays: safeDays,
    baseRental,
    extrasSubtotal,
    airportConcessionFee,
    mandatoryLiabilityCoverage,
    localTaxes,
    subtotal,
    discount,
    totalRentalPrice,
    refundableSecurityDeposit,
    currency: vehicle.currency || "₱",
  }
}
