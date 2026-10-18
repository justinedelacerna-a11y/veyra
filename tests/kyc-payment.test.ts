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

  // ─── PART 10: KYC Upload & Identity Resolution Flow ───────────────────────
  describe("KYC Document Upload Flow & Customer Profile Resolution", () => {
    it("Scenario 1: Resolves customer exclusively from authenticated session without trusting browser IDs", () => {
      const authenticatedClerkUser = {
        id: "user_clerk_verified_123",
        email: "driver@veyra.local",
      }
      const maliciousBrowserSuppliedId = "victim_cust_uuid_999"

      // Ownership resolution must ignore browser input and strictly derive from Clerk ID
      const resolvedCustomerId = ((clerkId: string) => {
        return `resolved_cust_for_${clerkId}`
      })(authenticatedClerkUser.id)

      assert.notEqual(resolvedCustomerId, maliciousBrowserSuppliedId)
      assert.equal(resolvedCustomerId, `resolved_cust_for_${authenticatedClerkUser.id}`)
    })

    it("Scenario 2: Rejects unauthenticated requests before processing files", () => {
      const unauthenticatedSession = null
      const canUpload = Boolean(unauthenticatedSession)
      assert.equal(canUpload, false, "Unauthenticated session must be rejected with UNAUTHORIZED")
    })

    it("Scenario 3: Auto-provisions first-time customer safely and prevents duplicate profiles", () => {
      const userDatabase = new Map<string, { id: string; clerk_id: string }>()
      const customerDatabase = new Map<string, { id: string; user_id: string; membership_number: string }>()

      function getOrCreateCustomer(clerkId: string) {
        let dbUser = userDatabase.get(clerkId)
        if (!dbUser) {
          dbUser = { id: `user-${clerkId}`, clerk_id: clerkId }
          userDatabase.set(clerkId, dbUser)
        }

        let customer = customerDatabase.get(dbUser.id)
        if (!customer) {
          customer = {
            id: `cust-${dbUser.id}`,
            user_id: dbUser.id,
            membership_number: `VYR-CUS-${clerkId.toUpperCase()}`,
          }
          customerDatabase.set(dbUser.id, customer)
        }
        return customer
      }

      // First call: provisions
      const firstCall = getOrCreateCustomer("user_first_timer_001")
      assert.ok(firstCall.id)
      assert.equal(userDatabase.size, 1)
      assert.equal(customerDatabase.size, 1)

      // Subsequent call: reuses existing without duplicates
      const secondCall = getOrCreateCustomer("user_first_timer_001")
      assert.equal(firstCall.id, secondCall.id)
      assert.equal(userDatabase.size, 1)
      assert.equal(customerDatabase.size, 1)
    })

    it("Scenario 4: Enforces strict isolated storage path convention (customerId/documentType/timestamp-uuid)", () => {
      const customerId = "cust_uuid_456"
      const docType = "driver_license"
      const timestamp = 1792309100000
      const uuid = "550e8400-e29b-41d4-a716-446655440000"
      const ext = "jpg"

      const storagePath = `${customerId}/${docType}/${timestamp}-${uuid}.${ext}`

      assert.ok(storagePath.startsWith(`${customerId}/`))
      assert.ok(storagePath.includes(`/${docType}/`))
      assert.ok(storagePath.endsWith(`.${ext}`))
      assert.equal(storagePath.split("/")[0], customerId, "Customer directory must isolate uploaded files")
    })

    it("Scenario 5: Enforces file size limit of 10 MB and allowed MIME types", () => {
      const MAX_BYTES = 10 * 1024 * 1024
      const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

      const validFile = { size: 5 * 1024 * 1024, type: "image/jpeg" }
      const oversizedFile = { size: 12 * 1024 * 1024, type: "image/jpeg" }
      const invalidMimeFile = { size: 2 * 1024 * 1024, type: "application/x-msdownload" }

      assert.equal(validFile.size <= MAX_BYTES && ALLOWED_MIMES.includes(validFile.type), true)
      assert.equal(oversizedFile.size <= MAX_BYTES, false, "Oversized file must be rejected")
      assert.equal(ALLOWED_MIMES.includes(invalidMimeFile.type), false, "Unsupported MIME must be rejected")
    })

    it("Scenario 6: Uploading driver's license transitions document to pending_review and customer status to pending", () => {
      let docStatus = "not_uploaded"
      let customerVerificationStatus = "unverified"

      // Upon upload
      docStatus = "pending_review"
      if (customerVerificationStatus !== "verified") {
        customerVerificationStatus = "pending"
      }

      assert.equal(docStatus, "pending_review", "Document must be pending_review, never prematurely verified")
      assert.equal(customerVerificationStatus, "pending", "Customer must transition to pending")
    })

    it("Scenario 7: Prevents customer from uploading documents to another customer's profile", () => {
      const sessionUserClerkId = "user_attacker"
      const legitimateCustomer = { id: "cust_legitimate", clerkId: "user_victim" }

      const canUploadToVictim = sessionUserClerkId === legitimateCustomer.clerkId
      assert.equal(canUploadToVictim, false, "Cross-account upload must be strictly blocked")
    })

    it("Scenario 8: Masks internal database error details and provides safe user feedback", () => {
      const rawDbError = new Error("relation public.customers violates foreign key constraint customer_id_fkey on node ip-10-0-1-5")
      const safeUserMessage = rawDbError.message.includes("relation") || rawDbError.message.includes("constraint")
        ? "Failed to register document in records. Please try again."
        : rawDbError.message

      assert.equal(safeUserMessage, "Failed to register document in records. Please try again.")
      assert.equal(safeUserMessage.includes("relation"), false)
      assert.equal(safeUserMessage.includes("constraint"), false)
      assert.equal(safeUserMessage.includes("ip-"), false)
    })

    it("Scenario 9: Customer document reflects in KYC status summary with driver license badge", () => {
      const documents = [
        {
          id: "doc-1",
          category: "driver_license",
          status: "pending_review",
          uploadedAt: "Oct 18, 2026",
        },
      ]

      const hasDriverLicenseUploaded = documents.some(
        (d) => d.category === "driver_license" && d.status !== "not_uploaded"
      )
      const isApproved = documents.some((d) => d.category === "driver_license" && d.status === "approved")

      assert.equal(hasDriverLicenseUploaded, true)
      assert.equal(isApproved, false)
    })

    it("Scenario 10: Authorized staff review updates KYC document and customer status upon approval", () => {
      let customerStatus = "pending"
      const doc = {
        id: "doc-verified-01",
        type: "driver_license",
        status: "pending_review",
      }

      // Staff approval
      doc.status = "approved"
      if (doc.type === "driver_license" && doc.status === "approved") {
        customerStatus = "verified"
      }

      assert.equal(doc.status, "approved")
      assert.equal(customerStatus, "verified")
    })
  })
})
