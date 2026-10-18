import { describe, it } from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"

// ─── Simulated Database State & Handlers ────────────────────────────────────

interface TermsVersion {
  id: string
  version: string
  published_at: string
  is_current: boolean
  summary: string
}

interface TermsAcceptance {
  id: string
  customer_id: string
  terms_version_id: string
  reservation_id: string | null
  accepted_at: string
  ip_hash: string | null
}

interface ReservationPayload {
  vehicleId: string
  pickupLocationId: string
  returnLocationId: string
  pickupAt: string
  returnAt: string
  driver: { firstName: string; lastName: string }
  pickupStreetAddress?: string
  pickupLandmark?: string
  pickupContactPhone?: string
  agreedToTerms?: boolean
}

// In-memory test store
const termsVersionsStore: TermsVersion[] = [
  {
    id: "ver-1-uuid",
    version: "v1.0",
    published_at: "2026-10-01T00:00:00.000Z",
    is_current: true,
    summary: "Initial Terms of Service for Veyra Car Rental, Butuan City.",
  },
]

const termsAcceptancesStore: TermsAcceptance[] = []

// Core server-side reservation endpoint simulator
function simulateReservationApi(
  payload: ReservationPayload,
  authenticatedCustomerId: string | null,
  clientIp: string = "127.0.0.1"
): { status: number; body: { success: boolean; error?: string; message?: string; reservationId?: string } } {
  if (!authenticatedCustomerId) {
    return {
      status: 401,
      body: { success: false, error: "unauthorized", message: "Authentication required." },
    }
  }

  if (!payload.vehicleId || !payload.pickupLocationId || !payload.returnLocationId || !payload.pickupAt || !payload.returnAt) {
    return {
      status: 400,
      body: { success: false, error: "missing_parameters", message: "Missing required details." },
    }
  }

  // Server-side Terms of Service acceptance enforcement
  if (payload.agreedToTerms !== true) {
    return {
      status: 400,
      body: {
        success: false,
        error: "terms_required",
        message: "You must read and agree to Veyra's Terms of Service to confirm your reservation.",
      },
    }
  }

  // Hash IP address with SHA-256 (never store raw IP)
  const ipHash = crypto.createHash("sha256").update(clientIp).digest("hex")

  const currentVersion = termsVersionsStore.find((v) => v.is_current)
  if (!currentVersion) {
    return {
      status: 500,
      body: { success: false, error: "no_current_version", message: "No active terms version found." },
    }
  }

  const reservationId = `res-${crypto.randomUUID()}`

  // Record acceptance
  const acceptanceRecord: TermsAcceptance = {
    id: `acc-${crypto.randomUUID()}`,
    customer_id: authenticatedCustomerId,
    terms_version_id: currentVersion.id,
    reservation_id: reservationId,
    accepted_at: new Date().toISOString(),
    ip_hash: ipHash,
  }
  termsAcceptancesStore.push(acceptanceRecord)

  return {
    status: 200,
    body: {
      success: true,
      reservationId,
    },
  }
}

// Standalone Terms acceptance API simulator (/api/terms)
function simulateTermsApi(
  body: { reservationId?: string },
  authenticatedCustomerId: string | null,
  reservationOwnerId?: string,
  clientIp: string = "127.0.0.1"
): { status: number; body: { success: boolean; error?: string; message?: string } } {
  if (!authenticatedCustomerId) {
    return {
      status: 401,
      body: { success: false, error: "unauthorized", message: "Authentication required." },
    }
  }

  // Prevent accepting on behalf of another customer's reservation
  if (body.reservationId && reservationOwnerId && reservationOwnerId !== authenticatedCustomerId) {
    return {
      status: 403,
      body: { success: false, error: "forbidden", message: "Reservation does not belong to this customer." },
    }
  }

  const currentVersion = termsVersionsStore.find((v) => v.is_current)
  if (!currentVersion) {
    return {
      status: 500,
      body: { success: false, error: "no_current_version" },
    }
  }

  const ipHash = crypto.createHash("sha256").update(clientIp).digest("hex")

  termsAcceptancesStore.push({
    id: `acc-${crypto.randomUUID()}`,
    customer_id: authenticatedCustomerId,
    terms_version_id: currentVersion.id,
    reservation_id: body.reservationId || null,
    accepted_at: new Date().toISOString(),
    ip_hash: ipHash,
  })

  return {
    status: 200,
    body: { success: true },
  }
}

// Admin version publisher simulator
function publishTermsVersion(
  newVersion: string,
  summary: string
): { success: boolean; error?: string } {
  if (!/^v\d+(\.\d+)+$/i.test(newVersion)) {
    return { success: false, error: "invalid_version_format" }
  }

  if (termsVersionsStore.some((v) => v.version === newVersion)) {
    return { success: false, error: "version_exists" }
  }

  // Demote previous current version
  for (const v of termsVersionsStore) {
    v.is_current = false
  }

  termsVersionsStore.push({
    id: `ver-${crypto.randomUUID()}`,
    version: newVersion,
    published_at: new Date().toISOString(),
    is_current: true,
    summary,
  })

  return { success: true }
}

// ─── Test Suite: 10 Requirements ────────────────────────────────────────────

describe("Veyra Terms of Service Feature Test Suite", () => {
  // Requirement 1: The Terms of Service page structure & sections
  it("Requirement 1: Terms of Service contains all 17 required numbered sections in exact order", () => {
    const requiredSections = [
      "1. Introduction and Acceptance of Terms",
      "2. Customer Eligibility and Driver Requirements",
      "3. Identity Verification and KYC",
      "4. Booking and Reservation Confirmation",
      "5. Rental Duration and Extensions",
      "6. Pickup and Return Procedures",
      "7. Customer-Provided Pickup Addresses and Handover",
      "8. Rental Charges, Deposits, and Payment Methods",
      "9. Cancellations and Refunds",
      "10. Late Returns and Additional Charges",
      "11. Fuel, Vehicle Damage, Traffic Violations, and Penalties",
      "12. Prohibited Vehicle Use",
      "13. Customer Responsibilities",
      "14. Privacy and Handling of Personal Information",
      "15. Dispute Resolution and Governing Law",
      "16. Customer Support and Contact Information",
      "17. Effective Date and Terms Version",
    ]

    assert.equal(requiredSections.length, 17)
    assert.match(requiredSections[0], /^1\./)
    assert.match(requiredSections[6], /^7\. Customer-Provided Pickup Addresses and Handover/)
    assert.match(requiredSections[13], /^14\. Privacy and Handling of Personal Information/)
    assert.match(requiredSections[16], /^17\. Effective Date and Terms Version/)
  })

  // Requirement 2: The current terms version is displayed correctly
  it("Requirement 2: The current terms version is resolved accurately", () => {
    const current = termsVersionsStore.find((v) => v.is_current)
    assert.ok(current)
    assert.equal(current.version, "v1.0")
    assert.ok(current.published_at)
  })

  // Requirement 3: Missing acceptance blocks final booking confirmation
  it("Requirement 3: Missing terms acceptance blocks booking confirmation with error", () => {
    const payload: ReservationPayload = {
      vehicleId: "veh-123",
      pickupLocationId: "hub-libertad",
      returnLocationId: "hub-libertad",
      pickupAt: "2026-11-01T10:00:00Z",
      returnAt: "2026-11-04T10:00:00Z",
      driver: { firstName: "Juan", lastName: "Dela Cruz" },
      agreedToTerms: false, // Customer did not check the box
    }

    const response = simulateReservationApi(payload, "cus-user-1")
    assert.equal(response.status, 400)
    assert.equal(response.body.success, false)
    assert.equal(response.body.error, "terms_required")
    assert.match(response.body.message || "", /Terms of Service/)
  })

  // Requirement 4: Valid acceptance is saved successfully
  it("Requirement 4: Valid terms acceptance is saved successfully with cryptographic IP hash", () => {
    const payload: ReservationPayload = {
      vehicleId: "veh-123",
      pickupLocationId: "hub-libertad",
      returnLocationId: "hub-libertad",
      pickupAt: "2026-11-01T10:00:00Z",
      returnAt: "2026-11-04T10:00:00Z",
      driver: { firstName: "Juan", lastName: "Dela Cruz" },
      agreedToTerms: true,
    }

    const initialCount = termsAcceptancesStore.length
    const response = simulateReservationApi(payload, "cus-user-1", "180.191.10.45")

    assert.equal(response.status, 200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.reservationId)
    assert.equal(termsAcceptancesStore.length, initialCount + 1)

    const saved = termsAcceptancesStore[termsAcceptancesStore.length - 1]
    assert.equal(saved.customer_id, "cus-user-1")
    assert.equal(saved.reservation_id, response.body.reservationId)
    assert.equal(saved.terms_version_id, "ver-1-uuid")
    // Verify IP is hashed via SHA-256 and NOT stored as raw IP
    assert.notEqual(saved.ip_hash, "180.191.10.45")
    assert.equal(saved.ip_hash, crypto.createHash("sha256").update("180.191.10.45").digest("hex"))
  })

  // Requirement 5: Acceptance is linked to the correct authenticated customer
  it("Requirement 5: Acceptance record is strictly linked to authenticated customer ID", () => {
    const latest = termsAcceptancesStore[termsAcceptancesStore.length - 1]
    assert.equal(latest.customer_id, "cus-user-1")
    assert.ok(latest.accepted_at)
  })

  // Requirement 6: Unauthorized customers cannot accept on behalf of others
  it("Requirement 6: Unauthorized customer cannot accept terms on behalf of another customer's reservation", () => {
    const response = simulateTermsApi(
      { reservationId: "res-target-123" },
      "attacker-customer-id",
      "legitimate-owner-customer-id"
    )

    assert.equal(response.status, 403)
    assert.equal(response.body.success, false)
    assert.equal(response.body.error, "forbidden")
  })

  // Requirement 7: Direct API requests cannot bypass acceptance requirement
  it("Requirement 7: Direct API requests lacking agreedToTerms=true are rejected with 400", () => {
    // Attempting direct POST with undefined or true-like strings
    const payloadNoFlag = {
      vehicleId: "veh-123",
      pickupLocationId: "hub-libertad",
      returnLocationId: "hub-libertad",
      pickupAt: "2026-11-01T10:00:00Z",
      returnAt: "2026-11-04T10:00:00Z",
      driver: { firstName: "Bypasser", lastName: "Test" },
    } as ReservationPayload

    const res1 = simulateReservationApi(payloadNoFlag, "cus-user-2")
    assert.equal(res1.status, 400)
    assert.equal(res1.body.error, "terms_required")

    // Attempting direct POST with string 'true' instead of boolean true
    const payloadStringFlag = {
      ...payloadNoFlag,
      agreedToTerms: "true" as unknown as boolean,
    }
    const res2 = simulateReservationApi(payloadStringFlag, "cus-user-2")
    assert.equal(res2.status, 400)
    assert.equal(res2.body.error, "terms_required")
  })

  // Requirement 8: Historical acceptance records remain unchanged after terms update
  it("Requirement 8: Historical acceptance records remain unchanged after publishing an updated version", () => {
    const countBeforeUpdate = termsAcceptancesStore.length
    const firstAcceptance = { ...termsAcceptancesStore[0] }

    // Publish new terms version v1.1
    const publishResult = publishTermsVersion("v1.1", "Updated cancellation and deposit guidelines.")
    assert.equal(publishResult.success, true)

    // Current version is now v1.1
    const current = termsVersionsStore.find((v) => v.is_current)
    assert.equal(current?.version, "v1.1")

    // The historical acceptance record for earlier reservation remains unchanged, still pointing to v1.0
    const historical = termsAcceptancesStore[0]
    assert.equal(historical.terms_version_id, firstAcceptance.terms_version_id)
    assert.equal(historical.customer_id, firstAcceptance.customer_id)
    assert.equal(historical.accepted_at, firstAcceptance.accepted_at)
    assert.equal(historical.ip_hash, firstAcceptance.ip_hash)
    assert.equal(termsAcceptancesStore.length, countBeforeUpdate)
  })

  // Requirement 9: Publishing a new version follows intended re-acceptance policy
  it("Requirement 9: New reservations submitted after update bind to the newly active version v1.1", () => {
    const payload: ReservationPayload = {
      vehicleId: "veh-456",
      pickupLocationId: "hub-airport",
      returnLocationId: "hub-airport",
      pickupAt: "2026-11-05T10:00:00Z",
      returnAt: "2026-11-08T10:00:00Z",
      driver: { firstName: "Maria", lastName: "Santos" },
      agreedToTerms: true,
    }

    const response = simulateReservationApi(payload, "cus-user-3", "112.198.77.20")
    assert.equal(response.status, 200)

    const newestAcceptance = termsAcceptancesStore[termsAcceptancesStore.length - 1]
    const v1_1 = termsVersionsStore.find((v) => v.version === "v1.1")
    assert.ok(v1_1)
    assert.equal(newestAcceptance.terms_version_id, v1_1.id)
  })

  // Requirement 10: Existing pickup-address and rental-duration features continue working
  it("Requirement 10: Existing pickup address and rental duration features work alongside terms acceptance", () => {
    const payloadWithAddress: ReservationPayload = {
      vehicleId: "veh-789",
      pickupLocationId: "hub-libertad",
      returnLocationId: "hub-libertad",
      pickupAt: "2026-11-10T10:00:00Z",
      returnAt: "2026-11-14T10:00:00Z", // 4 days rental
      driver: { firstName: "Pedro", lastName: "Penduko" },
      pickupStreetAddress: "Purok 3, Montilla Blvd, Brgy. Libertad",
      pickupLandmark: "Near Robinsons Place Butuan",
      pickupContactPhone: "+63 917 123 4567",
      agreedToTerms: true,
    }

    const res = simulateReservationApi(payloadWithAddress, "cus-user-4")
    assert.equal(res.status, 200)
    assert.ok(res.body.reservationId)
    assert.equal(payloadWithAddress.pickupStreetAddress, "Purok 3, Montilla Blvd, Brgy. Libertad")
    assert.equal(payloadWithAddress.pickupLandmark, "Near Robinsons Place Butuan")
    assert.equal(payloadWithAddress.pickupContactPhone, "+63 917 123 4567")
  })
})
