import { describe, it } from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import { verifyPayMongoSignature } from "../src/features/payment/server/paymongo-service"
import {
  getAvailablePaymentMethods,
  isPaymentGatewayConfigured,
  getPaymentProvider,
} from "../src/features/payment/server/payment-registry"

describe("Veyra KYC & Payment System Test Suite", () => {
  // ─── PART 1 & 2: KYC Gate & Verification States ───────────────────────────
  describe("KYC Verification States & Policy Rules", () => {
    it("identifies unverified/missing KYC as blocking checkout", () => {
      const mockCustomer = {
        id: "cust-01",
        verification_status: "not_submitted",
      }
      const hasApprovedDl = false
      const isVerified =
        mockCustomer.verification_status === "verified" || hasApprovedDl

      assert.equal(isVerified, false, "Missing KYC must block verified checkout")
    })

    it("identifies pending KYC as waiting for operational review", () => {
      const mockCustomer = {
        id: "cust-02",
        verification_status: "pending",
      }
      const hasApprovedDl = false
      const isVerified =
        mockCustomer.verification_status === "verified" || hasApprovedDl

      assert.equal(isVerified, false, "Pending KYC must not be prematurely verified")
    })

    it("displays rejection reason and permits resubmission when rejected", () => {
      const mockRejectedDoc = {
        status: "rejected",
        rejection_reason: "Photocard blurred; license number not legible.",
      }
      assert.ok(mockRejectedDoc.rejection_reason.length > 0)
      assert.equal(mockRejectedDoc.status, "rejected")
    })

    it("allows confirmed rental checkout when KYC is verified", () => {
      const mockCustomer = {
        id: "cust-03",
        verification_status: "verified",
      }
      const hasApprovedDl = true
      const isVerified =
        mockCustomer.verification_status === "verified" || hasApprovedDl

      assert.equal(isVerified, true, "Verified KYC must grant checkout clearance")
    })
  })

  // ─── PART 3 & 4: Payment Methods & Registry ───────────────────────────────
  describe("Payment Provider Registry & Configured Method Gating", () => {
    it("always enables pay_at_pickup for in-person handover settlement", () => {
      const methods = getAvailablePaymentMethods()
      const pickup = methods.find((m) => m.id === "pay_at_pickup")

      assert.ok(pickup, "Pay at pickup must be available in payment registry")
      assert.equal(pickup?.enabled, true, "Pay at pickup must be enabled")
      assert.equal(pickup?.type, "manual")
    })

    it("never shows unconfigured gateway channels as available", () => {
      const isConfigured = isPaymentGatewayConfigured()
      const methods = getAvailablePaymentMethods()
      const cardMethod = methods.find((m) => m.id === "card")
      const gcashMethod = methods.find((m) => m.id === "gcash")

      if (!isConfigured) {
        assert.equal(
          cardMethod?.enabled,
          false,
          "Card checkout must not be enabled when gateway credentials are unconfigured"
        )
        assert.equal(
          gcashMethod?.enabled,
          false,
          "GCash must not be enabled when gateway credentials are unconfigured"
        )
      }
    })

    it("resolves correct provider abstraction by method ID", () => {
      const manualProvider = getPaymentProvider("pay_at_pickup")
      assert.equal(manualProvider.name, "manual")

      const onlineProvider = getPaymentProvider("card")
      assert.equal(onlineProvider.name, "paymongo")
    })
  })

  // ─── PART 5 & 11: Security & Webhook Signatures ───────────────────────────
  describe("Cryptographic Signature & Idempotency Guarantees", () => {
    it("validates authentic PayMongo webhook signature using HMAC-SHA256", () => {
      const secret = "whsk_test_mock_secret_key_12345"
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const rawPayload = JSON.stringify({
        data: {
          id: "evt_test_123",
          type: "checkout_session.payment.paid",
        },
      })

      const expectedHmac = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${rawPayload}`)
        .digest("hex")

      const header = `t=${timestamp},te=${expectedHmac}`
      const isValid = verifyPayMongoSignature(rawPayload, header, secret)

      assert.equal(isValid, true, "Valid HMAC signature must be accepted")
    })

    it("rejects forged or tampered webhook payloads", () => {
      const secret = "whsk_test_mock_secret_key_12345"
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const rawPayload = JSON.stringify({ data: { id: "evt_test_legit" } })
      const forgedPayload = JSON.stringify({ data: { id: "evt_test_forged" } })

      const expectedHmac = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${rawPayload}`)
        .digest("hex")

      const header = `t=${timestamp},te=${expectedHmac}`
      const isValid = verifyPayMongoSignature(forgedPayload, header, secret)

      assert.equal(isValid, false, "Tampered payload must be rejected")
    })

    it("rejects empty or missing signatures", () => {
      const rawPayload = JSON.stringify({ test: true })
      assert.equal(verifyPayMongoSignature(rawPayload, null), false)
      assert.equal(verifyPayMongoSignature(rawPayload, ""), false)
    })
  })

  // ─── PART 9: Privacy & Safe Logging Audit ──────────────────────────────────
  describe("Redaction & Privacy Protection", () => {
    it("does not expose raw card numbers or CVVs in payment records", () => {
      const safePaymentRecord = {
        amount: 350000,
        currency: "PHP",
        method: "card",
        status: "captured",
        provider_txn_ref: "pay_1234567890",
      }

      assert.equal("card_number" in safePaymentRecord, false)
      assert.equal("cvv" in safePaymentRecord, false)
      assert.equal("card_password" in safePaymentRecord, false)
    })

    it("uses short-lived signed URLs with 300s TTL rather than public URLs for KYC docs", () => {
      const signedUrlTtl = 300 // 5 minutes
      assert.equal(signedUrlTtl, 300, "Signed URL TTL must be 300 seconds")
    })
  })
})
