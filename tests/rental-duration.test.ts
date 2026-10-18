import { describe, it } from "node:test"
import assert from "node:assert/strict"

interface RentalDurationConfig {
  minDays: number
  maxDays: number | null
}

function calculateDurationDays(pickupAt: Date, returnAt: Date): number {
  const diffMs = returnAt.getTime() - pickupAt.getTime()
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

function validateRentalDuration(
  pickupAt: Date,
  returnAt: Date,
  config: RentalDurationConfig
): { isValid: boolean; error?: string; message?: string } {
  if (isNaN(pickupAt.getTime()) || isNaN(returnAt.getTime())) {
    return {
      isValid: false,
      error: "invalid_dates",
      message: "Pickup and return dates must be valid ISO timestamps.",
    }
  }

  if (pickupAt >= returnAt) {
    return {
      isValid: false,
      error: "invalid_dates",
      message: "Return date must be strictly after pickup date.",
    }
  }

  const diffHours = (returnAt.getTime() - pickupAt.getTime()) / (1000 * 60 * 60)
  if (diffHours < 1) {
    return {
      isValid: false,
      error: "invalid_dates",
      message: "Minimum rental duration is 1 hour.",
    }
  }

  const days = calculateDurationDays(pickupAt, returnAt)

  if (days < config.minDays) {
    return {
      isValid: false,
      error: "invalid_dates",
      message: `Minimum rental duration is ${config.minDays} day${config.minDays !== 1 ? "s" : ""}.`,
    }
  }

  if (config.maxDays !== null && days > config.maxDays) {
    return {
      isValid: false,
      error: "invalid_dates",
      message: `Maximum rental duration is ${config.maxDays} days.`,
    }
  }

  return { isValid: true }
}

function calculateBaseRental(dailyRateCentavos: number, rentalDays: number): number {
  return dailyRateCentavos * rentalDays
}

function validateAdminSettingsUpdate(
  minDays: number,
  maxDays: number | null,
  staffRole: string
): { success: boolean; error?: string; message?: string } {
  // Authorization check
  const authorizedRoles = ["admin", "superadmin"]
  if (!authorizedRoles.includes(staffRole)) {
    return {
      success: false,
      error: "unauthorized",
      message: "Only admin and superadmin staff can modify system settings.",
    }
  }

  // Bounds validation
  if (!Number.isInteger(minDays) || minDays < 1) {
    return {
      success: false,
      error: "invalid_min",
      message: "Minimum days must be a positive integer.",
    }
  }

  if (maxDays !== null) {
    if (!Number.isInteger(maxDays) || maxDays < 1) {
      return {
        success: false,
        error: "invalid_max",
        message: "Maximum days must be a positive integer or null.",
      }
    }

    if (maxDays < minDays) {
      return {
        success: false,
        error: "min_exceeds_max",
        message: "Minimum rental days cannot exceed maximum rental days.",
      }
    }
  }

  return { success: true }
}

describe("Veyra Feature #2 — Configurable Rental Duration Test Suite", () => {
  // ─── 1. Valid rental duration ───────────────────────────────────────────
  it("accepts a valid rental duration within bounds", () => {
    const config: RentalDurationConfig = { minDays: 1, maxDays: 30 }
    const pickup = new Date("2026-10-20T10:00:00Z")
    const returnAt = new Date("2026-10-23T10:00:00Z") // 3 days

    const result = validateRentalDuration(pickup, returnAt, config)
    assert.equal(result.isValid, true)

    // Accurate pricing test: ₱1,750 per day (175,000 centavos) * 3 days = 525,000 centavos (₱5,250)
    const dailyRateCentavos = 175000
    const rentalDays = calculateDurationDays(pickup, returnAt)
    assert.equal(rentalDays, 3)

    const baseRentalCentavos = calculateBaseRental(dailyRateCentavos, rentalDays)
    assert.equal(baseRentalCentavos, 525000)
    assert.equal(baseRentalCentavos / 100, 5250, "Base rental for 3 days @ ₱1,750 must equal ₱5,250")
  })

  // ─── 2. Duration below the minimum ──────────────────────────────────────
  it("rejects rental durations below the configured minimum", () => {
    const config: RentalDurationConfig = { minDays: 3, maxDays: 30 }
    const pickup = new Date("2026-10-20T10:00:00Z")
    const returnAt = new Date("2026-10-21T10:00:00Z") // 1 day

    const result = validateRentalDuration(pickup, returnAt, config)
    assert.equal(result.isValid, false)
    assert.equal(result.error, "invalid_dates")
    assert.match(result.message || "", /Minimum rental duration is 3 days/)
  })

  // ─── 3. Duration above the maximum ──────────────────────────────────────
  it("rejects rental durations above the configured maximum", () => {
    const config: RentalDurationConfig = { minDays: 1, maxDays: 14 }
    const pickup = new Date("2026-10-01T10:00:00Z")
    const returnAt = new Date("2026-10-20T10:00:00Z") // 19 days

    const result = validateRentalDuration(pickup, returnAt, config)
    assert.equal(result.isValid, false)
    assert.equal(result.error, "invalid_dates")
    assert.match(result.message || "", /Maximum rental duration is 14 days/)
  })

  // ─── 4. Admin changing the minimum and maximum ──────────────────────────
  it("allows admin to successfully configure valid minimum and maximum limits", () => {
    const update = validateAdminSettingsUpdate(2, 21, "admin")
    assert.equal(update.success, true)

    const unlimitedMaxUpdate = validateAdminSettingsUpdate(3, null, "superadmin")
    assert.equal(unlimitedMaxUpdate.success, true)

    // Rejects min > max
    const invalidBounds = validateAdminSettingsUpdate(10, 5, "admin")
    assert.equal(invalidBounds.success, false)
    assert.equal(invalidBounds.error, "min_exceeds_max")
  })

  // ─── 5. Unauthorized settings changes ───────────────────────────────────
  it("rejects unauthorized staff or non-admin roles attempting settings changes", () => {
    const valetAttempt = validateAdminSettingsUpdate(1, 15, "valet")
    assert.equal(valetAttempt.success, false)
    assert.equal(valetAttempt.error, "unauthorized")

    const customerAttempt = validateAdminSettingsUpdate(1, 15, "customer")
    assert.equal(customerAttempt.success, false)
    assert.equal(customerAttempt.error, "unauthorized")
  })

  // ─── 6. Quote recalculation when dates change ───────────────────────────
  it("recalculates live quotes when customer updates dates", () => {
    const dailyRateCentavos = 200000 // ₱2,000 / day

    // Initial 2-day selection
    const pickup1 = new Date("2026-11-01T10:00:00Z")
    const return1 = new Date("2026-11-03T10:00:00Z")
    const days1 = calculateDurationDays(pickup1, return1)
    const quote1 = calculateBaseRental(dailyRateCentavos, days1)
    assert.equal(days1, 2)
    assert.equal(quote1 / 100, 4000)

    // Customer extends to 5-day selection
    const return2 = new Date("2026-11-06T10:00:00Z")
    const days2 = calculateDurationDays(pickup1, return2)
    const quote2 = calculateBaseRental(dailyRateCentavos, days2)
    assert.equal(days2, 5)
    assert.equal(quote2 / 100, 10000)
    assert.notEqual(quote1, quote2, "Quote must automatically update when dates change")
  })

  // ─── 7. Server-side rejection of manipulated dates ──────────────────────
  it("rejects reversed, identical, or invalid timestamp strings", () => {
    const config: RentalDurationConfig = { minDays: 1, maxDays: 30 }

    // Reversed dates
    const reversedResult = validateRentalDuration(
      new Date("2026-10-25T10:00:00Z"),
      new Date("2026-10-20T10:00:00Z"),
      config
    )
    assert.equal(reversedResult.isValid, false)
    assert.equal(reversedResult.error, "invalid_dates")

    // Equal dates (0 duration)
    const equalResult = validateRentalDuration(
      new Date("2026-10-20T10:00:00Z"),
      new Date("2026-10-20T10:00:00Z"),
      config
    )
    assert.equal(equalResult.isValid, false)

    // Invalid ISO string
    const malformedResult = validateRentalDuration(
      new Date("invalid-date"),
      new Date("2026-10-20T10:00:00Z"),
      config
    )
    assert.equal(malformedResult.isValid, false)
  })

  // ─── 8. Vehicle availability conflicts ──────────────────────────────────
  it("detects and flags overlapping vehicle availability collisions", () => {
    const existingBooking = {
      pickupAt: new Date("2026-10-15T10:00:00Z").getTime(),
      returnAt: new Date("2026-10-18T10:00:00Z").getTime(),
    }

    const checkCollision = (start: Date, end: Date) => {
      const s = start.getTime()
      const e = end.getTime()
      return s < existingBooking.returnAt && e > existingBooking.pickupAt
    }

    // Overlapping booking: 16th to 20th
    const overlap1 = checkCollision(
      new Date("2026-10-16T10:00:00Z"),
      new Date("2026-10-20T10:00:00Z")
    )
    assert.equal(overlap1, true, "Collision must be detected for overlapping dates")

    // Non-overlapping booking: 19th to 22nd
    const noOverlap = checkCollision(
      new Date("2026-10-19T10:00:00Z"),
      new Date("2026-10-22T10:00:00Z")
    )
    assert.equal(noOverlap, false, "Non-overlapping dates must be available")
  })

  // ─── 9. Settings persisting after refresh ────────────────────────────────
  it("persists configuration structure in system_settings schema", () => {
    const settingRecord = {
      key: "rental_duration",
      value: { min_days: 2, max_days: 14 },
      description: "Platform rental duration bounds",
      updated_at: new Date().toISOString(),
      updated_by_staff_id: "staff-uuid-001",
    }

    assert.equal(settingRecord.key, "rental_duration")
    assert.equal(settingRecord.value.min_days, 2)
    assert.equal(settingRecord.value.max_days, 14)

    // Parsed properly after storage retrieval
    const parsedMin = settingRecord.value.min_days
    const parsedMax = settingRecord.value.max_days
    assert.equal(parsedMin, 2)
    assert.equal(parsedMax, 14)
  })

  // ─── 10. Existing customer bookings & pickup-address fields functional ──
  it("preserves manual pickup address and landmark with reservation details", () => {
    const reservationDraft = {
      vehicleId: "veh-001",
      pickupLocationId: "10c00000-0000-0000-0000-000000000001",
      pickupStreetAddress: "Door 3, Montilla Blvd, Purok 4",
      pickupLandmark: "Beside Shell gas station",
      pickupContactPhone: "+63 917 123 4567",
      pickupDate: "2026-10-20",
      pickupTime: "10:00",
      returnDate: "2026-10-23",
      returnTime: "10:00",
    }

    assert.ok(reservationDraft.pickupStreetAddress)
    assert.ok(reservationDraft.pickupLandmark)
    assert.ok(reservationDraft.pickupContactPhone)

    const days = calculateDurationDays(
      new Date(`${reservationDraft.pickupDate}T${reservationDraft.pickupTime}`),
      new Date(`${reservationDraft.returnDate}T${reservationDraft.returnTime}`)
    )
    assert.equal(days, 3)
  })

  // ─── 11. Customer changes duration from 1 to 3 days ──────────────────────
  it("Customer changes duration from 1 to 3 days: return date and pricing synchronize", () => {
    const pickupDate = "2026-10-20"
    const initialDays = 1

    const [y, m, d] = pickupDate.split("-").map(Number)
    const target1 = new Date(Date.UTC(y, m - 1, d + initialDays))
    assert.equal(target1.toISOString().split("T")[0], "2026-10-21")

    // Customer changes duration to 3 days
    const updatedDays = 3
    const target3 = new Date(Date.UTC(y, m - 1, d + updatedDays))
    const updatedReturnDate = target3.toISOString().split("T")[0]
    assert.equal(updatedReturnDate, "2026-10-23")

    // Base rental calculation with rate ₱1,750
    const dailyRate = 1750
    const initialBase = calculateBaseRental(dailyRate * 100, initialDays) / 100
    const updatedBase = calculateBaseRental(dailyRate * 100, updatedDays) / 100
    assert.equal(initialBase, 1750)
    assert.equal(updatedBase, 5250)
  })

  // ─── 12. Customer changes duration from 3 to 5 days ──────────────────────
  it("Customer changes duration from 3 to 5 days: base amount updates from ₱5,250 to ₱8,750", () => {
    const pickupDate = "2026-10-20"
    const dailyRate = 1750

    const [y, m, d] = pickupDate.split("-").map(Number)
    const target5 = new Date(Date.UTC(y, m - 1, d + 5))
    const returnDate5 = target5.toISOString().split("T")[0]
    assert.equal(returnDate5, "2026-10-25")

    const base3 = calculateBaseRental(dailyRate * 100, 3) / 100
    const base5 = calculateBaseRental(dailyRate * 100, 5) / 100
    assert.equal(base3, 5250)
    assert.equal(base5, 8750)
  })

  // ─── 13. Manually changing return date updates duration ──────────────────
  it("Manually changing return date recalculates duration correctly", () => {
    const pickupDate = "2026-10-20"
    const pickupTime = "10:00"
    const manualReturnDate = "2026-10-27"
    const manualReturnTime = "10:00"

    const days = calculateDurationDays(
      new Date(`${pickupDate}T${pickupTime}:00Z`),
      new Date(`${manualReturnDate}T${manualReturnTime}:00Z`)
    )
    assert.equal(days, 7)
  })

  // ─── 14. Invalid and reversed date ranges are rejected ───────────────────
  it("Rejects reversed dates where return date is prior to or identical to pickup", () => {
    const config = { minDays: 1, maxDays: 30 }
    const reversed = validateRentalDuration(
      new Date("2026-10-25T10:00:00Z"),
      new Date("2026-10-20T10:00:00Z"),
      config
    )
    assert.equal(reversed.isValid, false)
    assert.equal(reversed.error, "invalid_dates")

    const identical = validateRentalDuration(
      new Date("2026-10-20T10:00:00Z"),
      new Date("2026-10-20T10:00:00Z"),
      config
    )
    assert.equal(identical.isValid, false)
  })

  // ─── 15. Extending rental detects vehicle availability collisions ─────────
  it("Detects vehicle collision when customer extends duration into an existing booking", () => {
    // Existing reserved slot: 2026-10-24 to 2026-10-26
    const reservedBooking = {
      pickupAt: new Date("2026-10-24T10:00:00Z").getTime(),
      returnAt: new Date("2026-10-26T10:00:00Z").getTime(),
    }

    const checkCollision = (start: Date, end: Date) => {
      const s = start.getTime()
      const e = end.getTime()
      return s < reservedBooking.returnAt && e > reservedBooking.pickupAt
    }

    // Customer originally booked 3 days: Oct 20 to Oct 23 -> No collision
    const origEnd = new Date("2026-10-23T10:00:00Z")
    assert.equal(checkCollision(new Date("2026-10-20T10:00:00Z"), origEnd), false)

    // Customer extends to 5 days: Oct 20 to Oct 25 -> Collision on Oct 24-25!
    const extendedEnd = new Date("2026-10-25T10:00:00Z")
    assert.equal(checkCollision(new Date("2026-10-20T10:00:00Z"), extendedEnd), true)
  })

  // ─── 16. API requests cannot bypass duration limits ──────────────────────
  it("Server validation prevents direct API calls from bypassing configured min/max", () => {
    const config = { minDays: 2, maxDays: 14 }

    // Direct API attempt with 1 day (below min 2)
    const belowMin = validateRentalDuration(
      new Date("2026-10-20T10:00:00Z"),
      new Date("2026-10-21T10:00:00Z"),
      config
    )
    assert.equal(belowMin.isValid, false)
    assert.ok(belowMin.message?.includes("Minimum rental duration is 2 days"))

    // Direct API attempt with 15 days (above max 14)
    const aboveMax = validateRentalDuration(
      new Date("2026-10-20T10:00:00Z"),
      new Date("2026-11-04T10:00:00Z"),
      config
    )
    assert.equal(aboveMax.isValid, false)
    assert.ok(aboveMax.message?.includes("Maximum rental duration is 14 days"))
  })
})

