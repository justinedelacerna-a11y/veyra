import "server-only"
import { createServiceClient } from "@/lib/supabase/server"
import { checkVehicleAvailability } from "@/features/vehicles/server"
import type { BookingPricingSummary } from "../types"

export interface QuoteRequestParams {
  vehicleId: string
  pickupAt: string | Date
  returnAt: string | Date
  pickupLocationId: string
  returnLocationId: string
  selectedExtraIds?: string[]
  customerId?: string
  persist?: boolean
}

export interface QuoteExtraItem {
  id: string
  slug: string
  name: string
  category: string
  dailyRateCentavos: number
  dailyRatePesos: number
  totalCentavos: number
  totalPesos: number
}

export interface LiveQuoteResult {
  quoteId?: string
  vehicleId: string
  vehicleName: string
  rentalDays: number
  pickupAt: string
  returnAt: string
  pickupLocationId: string
  returnLocationId: string
  dailyRateCentavos: number
  baseRentalCentavos: number
  extrasSubtotalCentavos: number
  airportConcessionFeeCentavos: number
  mandatoryLiabilityCoverageCentavos: number
  taxAmountCentavos: number
  discountAmountCentavos: number
  subtotalCentavos: number
  totalRentalCentavos: number
  securityDepositCentavos: number
  currency: string
  // Display pricing in Pesos (divided by 100)
  pricing: BookingPricingSummary
  selectedExtras: QuoteExtraItem[]
  expiresAt?: string
}

export type QuoteResponse =
  | { success: true; quote: LiveQuoteResult }
  | {
      success: false
      error:
        | "invalid_dates"
        | "invalid_vehicle_id"
        | "vehicle_not_found"
        | "location_not_found"
        | "unavailable"
        | "database_error"
      message: string
      conflict?: string
    }

/**
 * Authoritative Server-Side Quote Engine
 *
 * Rules:
 * 1. The browser is NEVER trusted for price, rates, discounts, or deposit amounts.
 * 2. All monetary calculations are performed in minor units (centavos) using integer math.
 * 3. Vehicle availability is checked immediately prior to generating the quote.
 * 4. Duration is calculated using ceil(diff / 24 hours), minimum 1 day.
 * 5. Returns a structured, typed quote with clear breakdown:
 *    - Base rental
 *    - Supported fees (airport concession, mandatory liability)
 *    - Active extras
 *    - Taxes (VAT inclusive per Philippine consumer pricing)
 *    - Security deposit (strictly separate from rental total)
 *    - Authoritative total
 */
export async function calculateQuote(
  params: QuoteRequestParams
): Promise<QuoteResponse> {
  const {
    vehicleId,
    pickupLocationId,
    returnLocationId,
    selectedExtraIds = [],
    customerId,
    persist = false,
  } = params

  // 1. Validate dates
  const pickupAt = new Date(params.pickupAt)
  const returnAt = new Date(params.returnAt)

  if (isNaN(pickupAt.getTime()) || isNaN(returnAt.getTime())) {
    return {
      success: false,
      error: "invalid_dates",
      message: "Pickup and return dates must be valid ISO timestamps.",
    }
  }

  if (pickupAt >= returnAt) {
    return {
      success: false,
      error: "invalid_dates",
      message: "Return date must be strictly after pickup date.",
    }
  }

  // Minimum duration: at least 1 hour
  const diffHours =
    (returnAt.getTime() - pickupAt.getTime()) / (1000 * 60 * 60)
  if (diffHours < 1) {
    return {
      success: false,
      error: "invalid_dates",
      message: "Minimum rental duration is 1 hour.",
    }
  }

  const supabase = createServiceClient()

  try {
    // 2. Load vehicle record directly from database
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("id, make, model, year, daily_rate, security_deposit, currency, fleet_status")
      .eq("id", vehicleId)
      .single()

    if (vErr || !vehicle) {
      return {
        success: false,
        error: "vehicle_not_found",
        message: "Requested vehicle was not found in the fleet catalog.",
      }
    }

    if (vehicle.fleet_status !== "available" && vehicle.fleet_status !== "reserved") {
      return {
        success: false,
        error: "unavailable",
        message: "Vehicle is currently not available for booking.",
      }
    }

    // 3. Re-check vehicle availability immediately
    const availability = await checkVehicleAvailability({
      vehicleId,
      pickupAt,
      returnAt,
    })

    if (!availability.available) {
      return {
        success: false,
        error: "unavailable",
        message:
          availability.conflict === "reservation_conflict"
            ? "Vehicle has an existing overlapping reservation."
            : "Vehicle is blocked for scheduled maintenance during this period.",
        conflict: availability.conflict,
      }
    }

    // 4. Validate locations
    const { data: locations, error: locErr } = await supabase
      .from("locations")
      .select("id, name, city, type")
      .in("id", [pickupLocationId, returnLocationId])

    if (locErr || !locations || locations.length === 0) {
      return {
        success: false,
        error: "location_not_found",
        message: "One or more requested locations are invalid.",
      }
    }

    const pickupLoc = locations.find((l) => l.id === pickupLocationId)
    if (!pickupLoc) {
      return {
        success: false,
        error: "location_not_found",
        message: "Pickup station was not found.",
      }
    }

    // 5. Calculate rental duration in days
    const diffMs = returnAt.getTime() - pickupAt.getTime()
    const rentalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    // 6. Monetary calculations in centavos
    const dailyRateCentavos = Number(vehicle.daily_rate)
    const baseRentalCentavos = dailyRateCentavos * rentalDays

    // 7. Resolve and compute extras
    let extrasSubtotalCentavos = 0
    const resolvedExtras: QuoteExtraItem[] = []

    if (selectedExtraIds.length > 0) {
      const { data: dbExtras } = await supabase
        .from("extras")
        .select("id, slug, name, category, daily_rate, currency")
        .eq("is_active", true)

      if (dbExtras && dbExtras.length > 0) {
        for (const extraIdOrSlug of selectedExtraIds) {
          const match = dbExtras.find(
            (e) => e.id === extraIdOrSlug || e.slug === extraIdOrSlug
          )
          if (match) {
            const extraDailyRateCentavos = Number(match.daily_rate)
            const extraTotalCentavos = extraDailyRateCentavos * rentalDays
            extrasSubtotalCentavos += extraTotalCentavos

            resolvedExtras.push({
              id: match.id,
              slug: match.slug,
              name: match.name,
              category: match.category,
              dailyRateCentavos: extraDailyRateCentavos,
              dailyRatePesos: extraDailyRateCentavos / 100,
              totalCentavos: extraTotalCentavos,
              totalPesos: extraTotalCentavos / 100,
            })
          }
        }
      }
    }

    // Supported fees
    const airportConcessionFeeCentavos = 0
    const mandatoryLiabilityCoverageCentavos = 0

    // Taxes: VAT included per Philippine consumer pricing rules
    const taxAmountCentavos = 0
    const discountAmountCentavos = 0

    const subtotalCentavos =
      baseRentalCentavos +
      extrasSubtotalCentavos +
      airportConcessionFeeCentavos +
      mandatoryLiabilityCoverageCentavos

    const totalRentalCentavos =
      subtotalCentavos + taxAmountCentavos - discountAmountCentavos

    const securityDepositCentavos = Number(vehicle.security_deposit || 1000000)
    const currency = vehicle.currency || "PHP"

    // 8. Optionally persist quote to database
    let persistedQuoteId: string | undefined
    let expiresAtIso: string | undefined

    if (persist && customerId) {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30-min TTL
      expiresAtIso = expiresAt.toISOString()

      const { data: quoteRow, error: qErr } = await supabase
        .from("quotes")
        .insert({
          customer_id: customerId,
          vehicle_id: vehicleId,
          pickup_location_id: pickupLocationId,
          return_location_id: returnLocationId,
          pickup_at: pickupAt.toISOString(),
          return_at: returnAt.toISOString(),
          rental_days: rentalDays,
          daily_rate: dailyRateCentavos,
          base_rental: baseRentalCentavos,
          extras_subtotal: extrasSubtotalCentavos,
          discount_amount: discountAmountCentavos,
          tax_amount: taxAmountCentavos,
          subtotal: subtotalCentavos,
          total_rental: totalRentalCentavos,
          security_deposit: securityDepositCentavos,
          currency,
          pricing_version: "v1.0",
          status: "active",
          expires_at: expiresAtIso,
        })
        .select("id")
        .single()

      if (qErr) {
        console.error("[quote-service] Failed to persist quote:", qErr.message)
      } else if (quoteRow) {
        persistedQuoteId = quoteRow.id

        // Insert quote extras line items
        if (resolvedExtras.length > 0) {
          const quoteExtraRows = resolvedExtras.map((item) => ({
            quote_id: persistedQuoteId!,
            extra_id: item.id,
            extra_name: item.name,
            daily_rate: item.dailyRateCentavos,
            total: item.totalCentavos,
          }))

          await supabase.from("quote_extras").insert(quoteExtraRows)
        }
      }
    }

    // 9. Format display pricing in Pesos
    const pricing: BookingPricingSummary = {
      dailyRate: dailyRateCentavos / 100,
      rentalDays,
      baseRental: baseRentalCentavos / 100,
      extrasSubtotal: extrasSubtotalCentavos / 100,
      airportConcessionFee: airportConcessionFeeCentavos / 100,
      mandatoryLiabilityCoverage: mandatoryLiabilityCoverageCentavos / 100,
      localTaxes: taxAmountCentavos / 100,
      subtotal: subtotalCentavos / 100,
      discount: discountAmountCentavos / 100,
      totalRentalPrice: totalRentalCentavos / 100,
      refundableSecurityDeposit: securityDepositCentavos / 100,
      currency: "₱",
    }

    const quoteResult: LiveQuoteResult = {
      quoteId: persistedQuoteId,
      vehicleId,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      rentalDays,
      pickupAt: pickupAt.toISOString(),
      returnAt: returnAt.toISOString(),
      pickupLocationId,
      returnLocationId,
      dailyRateCentavos,
      baseRentalCentavos,
      extrasSubtotalCentavos,
      airportConcessionFeeCentavos,
      mandatoryLiabilityCoverageCentavos,
      taxAmountCentavos,
      discountAmountCentavos,
      subtotalCentavos,
      totalRentalCentavos,
      securityDepositCentavos,
      currency,
      pricing,
      selectedExtras: resolvedExtras,
      expiresAt: expiresAtIso,
    }

    return {
      success: true,
      quote: quoteResult,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[quote-service] unexpected calculation error:", msg)
    return {
      success: false,
      error: "database_error",
      message: "An unexpected error occurred while calculating your quote.",
    }
  }
}
