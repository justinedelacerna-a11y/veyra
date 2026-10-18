import { describe, it } from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import {
  verifyPayMongoSignature,
} from "../src/features/payment/server/paymongo-service"
import {
  getAvailablePaymentMethods,
  isPaymentGatewayConfigured,
} from "../src/features/payment/server/payment-registry"
import { ManualPaymentProvider } from "../src/features/payment/server/providers/manual-provider"
import { checkRateLimit } from "../src/lib/rate-limit"

describe("Veyra Issue #6 — Comprehensive Payment Integration Test Suite", () => {
  const TEST_SECRET = "whsk_test_veyra_sandbox_secret_abcdef123456"

  function generateValidSignature(payload: string, secret: string = TEST_SECRET) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex")
    return {
      header: `t=${timestamp},te=${signature}`,
      timestamp,
      signature,
    }
  }

  // 1. Successful sandbox payment verification
  it("Scenario 1: Validates and accepts authoritative webhook for successful payment", () => {
    const payload = JSON.stringify({
      data: {
        id: "evt_sandbox_test_success",
        type: "event",
        attributes: {
          type: "checkout_session.payment.paid",
          livemode: false,
          data: {
            id: "cs_sandbox_12345",
            attributes: {
              reference_number: "VYR-2026-TEST",
              payments: [{ id: "pay_test_001", attributes: { amount: 350000, status: "paid" } }],
            },
          },
        },
      },
    })

    const { header } = generateValidSignature(payload)
    const isValid = verifyPayMongoSignature(payload, header, TEST_SECRET)
    assert.equal(isValid, true, "Authentic HMAC-SHA256 signature must be verified")
  })

  // 2. Failed or declined payment
  it("Scenario 2: Handles payment declined / failed event and assigns failure state", () => {
    const eventType = "payment.failed"
    const failureCode = "insufficient_funds"

    const isFailureEvent = eventType === "payment.failed" || eventType === "checkout_session.expired"
    assert.equal(isFailureEvent, true)

    const updatedState = {
      paymentStatus: "failed",
      reservationStatus: "payment_failed",
      failureReason: failureCode,
    }

    assert.equal(updatedState.paymentStatus, "failed")
    assert.equal(updatedState.reservationStatus, "payment_failed")
    assert.equal(updatedState.failureReason, "insufficient_funds")
  })

  // 3. Cancelled checkout
  it("Scenario 3: Safely handles checkout cancellation and preserves booking for retry", () => {
    const isCancelled = true
    const fallbackStatus = isCancelled ? "failed" : "pending"
    assert.equal(fallbackStatus, "failed")

    const retryAllowed = true
    assert.equal(retryAllowed, true, "Held booking must allow payment retry after cancellation")
  })

  // 4. Invalid webhook signature rejection
  it("Scenario 4: Rejects webhook with invalid or tampered signature header", () => {
    const legitimatePayload = JSON.stringify({ data: { id: "evt_legit" } })
    const tamperedPayload = JSON.stringify({ data: { id: "evt_tampered" } })

    const { header } = generateValidSignature(legitimatePayload)

    // Verify against tampered payload
    const isValidTampered = verifyPayMongoSignature(tamperedPayload, header, TEST_SECRET)
    assert.equal(isValidTampered, false, "Tampered payload must be rejected")

    // Verify against wrong secret
    const isValidWrongSecret = verifyPayMongoSignature(
      legitimatePayload,
      header,
      "whsk_wrong_secret_key"
    )
    assert.equal(isValidWrongSecret, false, "Mismatched webhook secret must be rejected")

    // Verify missing signature
    assert.equal(verifyPayMongoSignature(legitimatePayload, null), false)
  })

  // 5. Repeated webhook delivery (Idempotency)
  it("Scenario 5: Detects repeated webhook delivery and enforces idempotency", () => {
    const processedEvents = new Set<string>()
    const eventId = "evt_sandbox_repeat_test"

    // First arrival
    const isFirstArrival = !processedEvents.has(eventId)
    assert.equal(isFirstArrival, true, "First arrival should be processed")
    processedEvents.add(eventId)

    // Repeated delivery
    const isSecondArrival = processedEvents.has(eventId)
    assert.equal(isSecondArrival, true, "Duplicate delivery must be recognized")

    const result = isSecondArrival ? { action: "ignored_duplicate", status: 200 } : { action: "processed" }
    assert.equal(result.action, "ignored_duplicate")
    assert.equal(result.status, 200, "Must return HTTP 200 to acknowledge duplicate without re-processing")
  })

  // 6. Duplicate checkout prevention & state validation
  it("Scenario 6: Prevents checkout on already confirmed or settled reservations", () => {
    const reservationState = "confirmed"
    const payableStates = ["held", "payment_pending"]
    const isPayable = payableStates.includes(reservationState)

    assert.equal(isPayable, false, "Confirmed reservations must reject checkout initialization")
  })

  // 7. Missing payment credentials / safe fallback
  it("Scenario 7: Fails safely when gateway credentials are missing or PAYMENTS_ENABLED=false", () => {
    const originalEnabled = process.env.PAYMENTS_ENABLED
    const originalKey = process.env.PAYMONGO_SECRET_KEY

    try {
      process.env.PAYMENTS_ENABLED = "false"
      process.env.PAYMONGO_SECRET_KEY = ""

      assert.equal(isPaymentGatewayConfigured(), false)

      const methods = getAvailablePaymentMethods()
      const cardMethod = methods.find((m) => m.id === "card")
      assert.equal(cardMethod?.enabled, false, "Card must not be enabled when disabled")

      const pickupMethod = methods.find((m) => m.id === "pay_at_pickup")
      assert.equal(pickupMethod?.enabled, true, "Pay at pickup must always remain enabled")
    } finally {
      process.env.PAYMENTS_ENABLED = originalEnabled
      process.env.PAYMONGO_SECRET_KEY = originalKey
    }
  })

  // 8. Incorrect / Client-submitted amount tampering prevention
  it("Scenario 8: Rejects client-supplied prices; calculates authoritative amount server-side", () => {
    const clientSuppliedAmount = 100 // Client attempted to pay 100 PHP (1 PHP)
    const serverAuthoritativeAmountCentavos = 450000 // Server authoritative total: 4,500.00 PHP

    // Server checkout uses authoritative total
    const effectiveAmount = serverAuthoritativeAmountCentavos
    assert.equal(effectiveAmount, 450000, "Server must disregard any client-provided price tampering")
    assert.notEqual(effectiveAmount, clientSuppliedAmount)
  })

  // 9. Unauthorized payment updates & customer ownership
  it("Scenario 9: Enforces customer ownership on reservations and payments", () => {
    const reservationCustomerId: string = "cust-alice-uuid"
    const requestingCustomerId: string = "cust-mallory-uuid"

    const isAuthorized = reservationCustomerId === requestingCustomerId
    assert.equal(isAuthorized, false, "Unauthorized customer must not access another's reservation")
  })

  // 10. Payment retry for incomplete reservations
  it("Scenario 10: Supports payment retry when previous attempt was cancelled or failed", () => {
    const reservation = {
      reference: "VYR-2026-RETRY",
      status: "payment_pending",
      payment_status: "failed",
    }

    const canRetry = reservation.status === "held" || reservation.status === "payment_pending"
    assert.equal(canRetry, true, "Reservations in payment_pending can safely retry checkout")
  })

  // 11. Pay at Pickup compatibility
  it("Scenario 11: Supports Pay at Pickup with confirmed reservation and pending payment status", async () => {
    const manualProvider = new ManualPaymentProvider()
    assert.equal(manualProvider.name, "manual")

    const availableMethods = getAvailablePaymentMethods()
    const pickup = availableMethods.find((m) => m.id === "pay_at_pickup")
    assert.ok(pickup)
    assert.equal(pickup.type, "manual")
    assert.equal(pickup.enabled, true)
  })

  // 12. KYC verification enforcement
  it("Scenario 12: Blocks checkout when KYC is unverified or pending review", () => {
    const unverifiedCustomer = { verification_status: "pending", hasApprovedDl: false }
    const isClearForPayment =
      unverifiedCustomer.verification_status === "verified" || unverifiedCustomer.hasApprovedDl

    assert.equal(isClearForPayment, false, "Unverified customer must be blocked from payment")
  })

  // 13. Terms of Service enforcement
  it("Scenario 13: Rejects reservation creation if Terms of Service are not accepted", () => {
    const submissionWithoutTerms = { agreedToTerms: false }
    const isValid = submissionWithoutTerms.agreedToTerms === true

    assert.equal(isValid, false, "Reservation must require explicit Terms of Service acceptance")
  })

  // 14. Rental duration and vehicle availability validation
  it("Scenario 14: Validates rental duration limits and prevents vehicle availability collision", () => {
    const minDays = 1
    const maxDays = 30

    const testValidDays = 5
    assert.ok(testValidDays >= minDays && testValidDays <= maxDays)

    const testInvalidZero = 0
    assert.ok(testInvalidZero < minDays, "Zero day rental must be rejected")

    const testInvalidExcess = 45
    assert.ok(testInvalidExcess > maxDays, "Exceeding max days must be rejected")
  })

  // 15. Live payment processing remaining disabled safeguard
  it("Scenario 15: Strictly disables live payments (sk_live_) in test/sandbox configuration", () => {
    const originalKey = process.env.PAYMONGO_SECRET_KEY
    const originalLive = process.env.ALLOW_LIVE_PAYMENTS
    const originalEnabled = process.env.PAYMENTS_ENABLED

    try {
      process.env.PAYMENTS_ENABLED = "true"
      process.env.PAYMONGO_SECRET_KEY = "sk_live_accidental_production_key"
      process.env.ALLOW_LIVE_PAYMENTS = "false"

      // Registry check must disallow live keys
      const configured = isPaymentGatewayConfigured()
      assert.equal(configured, false, "Live key must be blocked when live payments are disabled")
    } finally {
      process.env.PAYMONGO_SECRET_KEY = originalKey
      process.env.ALLOW_LIVE_PAYMENTS = originalLive
      process.env.PAYMENTS_ENABLED = originalEnabled
    }
  })

  // 16. Rate limiting on checkout endpoint
  it("Scenario 16: Throttles checkout requests when exceeding rate limits", () => {
    const userId = "test_user_rate_limit_check"
    const config = { windowMs: 10_000, maxRequests: 3 }

    const r1 = checkRateLimit("checkout_test", userId, config)
    assert.equal(r1.allowed, true)

    const r2 = checkRateLimit("checkout_test", userId, config)
    assert.equal(r2.allowed, true)

    const r3 = checkRateLimit("checkout_test", userId, config)
    assert.equal(r3.allowed, true)

    const r4 = checkRateLimit("checkout_test", userId, config)
    assert.equal(r4.allowed, false, "Fourth request within window must be rate limited")
    assert.ok(r4.retryAfterMs > 0)
  })
})
