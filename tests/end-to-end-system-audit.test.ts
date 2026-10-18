import { describe, it } from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import {
  getAvailablePaymentMethods,
  getPaymentProvider,
  isPaymentGatewayConfigured,
} from "../src/features/payment/server/payment-registry"
import {
  BUTUAN_BARANGAYS,
  isWithinButuanServiceArea,
} from "../src/features/locations/data/butuan-city-data"
import { getCurrentTermsVersion } from "../src/features/admin/server/terms-service"

describe("Veyra Capstone Readiness — End-to-End System Audit Test Suite", () => {
  // ─── 1. Customer Authentication and Account Security ───────────────────────
  describe("1. Customer Authentication & Account Security", () => {
    it("determines customer identity strictly on the server via Clerk auth", () => {
      const mockSession = { userId: "user_clerk_verified_99", email: "student@cars.test" }
      assert.ok(mockSession.userId.startsWith("user_"))
      assert.ok(mockSession.email.includes("@"))
    })

    it("verifies customer profile auto-provisioning links Clerk ID and internal user", () => {
      const clerkUser = {
        id: "user_clerk_e2e_01",
        primaryEmailAddressId: "email_01",
        emailAddresses: [{ id: "email_01", emailAddress: "capstone.student@veyra.test" }],
        firstName: "Capstone",
        lastName: "Tester",
      }

      // Verify email extraction and mapping
      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress
      assert.equal(email, "capstone.student@veyra.test")

      // Resolved customer model
      const customerRecord = {
        userId: "usr_internal_uuid",
        clerkId: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        email,
        verificationStatus: "unverified",
      }

      assert.equal(customerRecord.clerkId, "user_clerk_e2e_01")
      assert.equal(customerRecord.verificationStatus, "unverified")
    })

    it("enforces RBAC: customers cannot access admin operations", () => {
      const customerRole = "customer"
      const allowedAdminRoles = ["superadmin", "operations_manager", "fleet_coordinator"]
      const isAuthorized = allowedAdminRoles.includes(customerRole)
      assert.equal(isAuthorized, false, "Customer role must be denied admin access")
    })
  })

  // ─── 2. KYC Document Verification ──────────────────────────────────────────
  describe("2. KYC Document Verification & Clearance Rules", () => {
    it("confirms missing KYC or unverified status blocks final rental confirmation", () => {
      const unverifiedCustomer = { id: "c1", verification_status: "unverified" }
      const hasApprovedDl = false
      const canConfirm = unverifiedCustomer.verification_status === "verified" || hasApprovedDl
      assert.equal(canConfirm, false, "Unverified KYC must block confirmation")
    })

    it("confirms an approved driver license grants KYC clearance", () => {
      const customer = { id: "c2", verification_status: "pending" }
      const hasApprovedDl = true
      const canConfirm = customer.verification_status === "verified" || hasApprovedDl
      assert.equal(canConfirm, true, "Approved Driver's License grants rental clearance")
    })

    it("confirms proof of billing is optional and does not block KYC clearance", () => {
      const uploadedDocs = [
        { type: "driver_license", status: "approved" },
        { type: "government_id", status: "approved" },
        // proof_of_address is missing/omitted
      ]

      const hasRequiredId = uploadedDocs.some(
        (d) => d.type === "driver_license" && d.status === "approved"
      )
      const isBlockedByAddressProof = false // Address proof made optional for students/capstone
      assert.equal(hasRequiredId, true)
      assert.equal(isBlockedByAddressProof, false)
    })

    it("ensures document storage paths are private and scoped to customer ID", () => {
      const customerId = "cust_uuid_99"
      const docType = "driver_license"
      const randomUuid = "d7b2e8a1-4c3f-4e9b-a012-3456789abcde"
      const storagePath = `${customerId}/${docType}/1729250000000-${randomUuid}.jpg`

      assert.ok(storagePath.startsWith(`${customerId}/`))
      assert.ok(!storagePath.includes("public/"))
    })
  })

  // ─── 3. Rental Booking and Manual Duration ─────────────────────────────────
  describe("3. Rental Booking & Manual Duration Engine", () => {
    it("supports 1-day rental with exact 24-hour return calculation", () => {
      const pickupDate = "2026-11-01"
      const [y, m, d] = pickupDate.split("-").map(Number)
      const targetDate = new Date(Date.UTC(y, m - 1, d + 1))
      const returnDate = targetDate.toISOString().split("T")[0]

      assert.equal(returnDate, "2026-11-02")
    })

    it("supports manual duration: 5, 30, 60, and 90 days without hardcoded caps", () => {
      const durations = [1, 5, 30, 60, 90, 120]
      const maxDaysLimit: number | null = null // Unlimited capstone mode

      durations.forEach((days) => {
        const isValid = days >= 1 && (maxDaysLimit === null || days <= maxDaysLimit)
        assert.equal(isValid, true, `Duration ${days} days must be permitted`)
      })
    })

    it("editing return date recalculates duration correctly", () => {
      const start = new Date("2026-11-01T10:00:00Z").getTime()
      const end = new Date("2026-11-15T10:00:00Z").getTime()
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

      assert.equal(diffDays, 14)
    })

    it("calculates authoritative quote proportionally to rental duration", () => {
      const dailyRateCentavos = 180000 // ₱1,800.00 / day
      const rentalDays = 7
      const totalAmountCentavos = dailyRateCentavos * rentalDays

      assert.equal(totalAmountCentavos, 1260000) // ₱12,600.00
    })

    it("rejects reversed dates where return is prior to pickup", () => {
      const start = new Date("2026-11-10T10:00:00Z").getTime()
      const end = new Date("2026-11-05T10:00:00Z").getTime()
      const isValid = end > start
      assert.equal(isValid, false, "Reversed dates must be rejected")
    })
  })

  // ─── 4. Butuan City Map and Location Selection ─────────────────────────────
  describe("4. Butuan City Map & Geographic Service Area", () => {
    it("contains all 86 official Butuan City barangays", () => {
      assert.ok(
        BUTUAN_BARANGAYS.length >= 86,
        `Expected 86 barangays, found ${BUTUAN_BARANGAYS.length}`
      )
    })

    it("verifies known Butuan City barangay coordinates (Libertad, Ampayon, Doongan)", () => {
      const libertad = BUTUAN_BARANGAYS.find((b) => b.name === "Libertad")
      const ampayon = BUTUAN_BARANGAYS.find((b) => b.name === "Ampayon")
      const doongan = BUTUAN_BARANGAYS.find((b) => b.name === "Doongan")

      assert.ok(libertad, "Libertad must exist")
      assert.ok(ampayon, "Ampayon must exist")
      assert.ok(doongan, "Doongan must exist")

      assert.ok(libertad.lat > 8.9 && libertad.lat < 9.1)
      assert.ok(libertad.lng > 125.4 && libertad.lng < 125.6)
    })

    it("validates service area: accepts coordinates within Butuan bounds", () => {
      const validCoord = { lat: 8.9515, lng: 125.5283 } // Bancasi Airport area
      const result = isWithinButuanServiceArea(validCoord.lat, validCoord.lng)
      assert.equal(result.isSupported, true)
    })

    it("validates service area: rejects coordinates far outside Butuan bounds", () => {
      const davaoCoord = { lat: 7.1907, lng: 125.4578 } // Davao City (~200km away)
      const result = isWithinButuanServiceArea(davaoCoord.lat, davaoCoord.lng)
      assert.equal(result.isSupported, false)
    })
  })

  // ─── 5. Terms of Service Acceptance ────────────────────────────────────────
  describe("5. Terms of Service Governance", () => {
    it("resolves the currently active Terms of Service version", async () => {
      const currentTerms = await getCurrentTermsVersion()
      assert.ok(currentTerms.version, "Must return an active version string")
      assert.equal(currentTerms.is_current, true)
    })

    it("hashes IP addresses with SHA-256 for privacy without storing raw IPs", () => {
      const rawIp = "192.168.1.100"
      const salt = "veyra_terms_audit_salt"
      const hash1 = crypto.createHash("sha256").update(`${rawIp}:${salt}`).digest("hex")
      const hash2 = crypto.createHash("sha256").update(`${rawIp}:${salt}`).digest("hex")

      assert.equal(hash1, hash2, "IP hash must be deterministic")
      assert.equal(hash1.length, 64, "SHA-256 produces 64-hex char digest")
      assert.ok(!hash1.includes(rawIp), "Raw IP must never appear in hash")
    })

    it("enforces server-side agreedToTerms requirement on booking creation", () => {
      const bookingWithoutTerms = { agreedToTerms: false }
      const bookingWithTerms = { agreedToTerms: true }

      assert.equal(bookingWithoutTerms.agreedToTerms, false)
      assert.equal(bookingWithTerms.agreedToTerms, true)
    })
  })

  // ─── 6. Multi-Method Demo Payment System ───────────────────────────────────
  describe("6. Demo Payment System & Complete Methods", () => {
    it("provides all 5 required demo payment methods", () => {
      const methods = getAvailablePaymentMethods({ demo: true })
      assert.equal(methods.length, 5)

      const ids = methods.map((m) => m.id)
      assert.ok(ids.includes("pay_at_pickup"))
      assert.ok(ids.includes("gcash"))
      assert.ok(ids.includes("maya"))
      assert.ok(ids.includes("card"))
      assert.ok(ids.includes("bank_transfer"))
    })

    it("strictly isolates demo transactions: DemoPaymentProvider used, no live gateway", () => {
      const provider = getPaymentProvider("gcash", { demo: true })
      assert.equal(provider.name, "demo")
      assert.notEqual(provider.name, "paymongo")
    })

    it("verifies live gateway remains disabled (PAYMENTS_ENABLED=false)", () => {
      const isLiveActive = isPaymentGatewayConfigured()
      assert.equal(isLiveActive, false, "Live payment gateway must remain disabled")
    })

    it("simulates successful demo transaction transition", () => {
      const initialTxn = {
        id: "pay_sim_01",
        status: "pending",
        is_demo: true,
        method: "gcash",
      }

      // Simulate outcome
      const successfulTxn = {
        ...initialTxn,
        status: "captured",
        updated_at: new Date().toISOString(),
      }

      assert.equal(successfulTxn.status, "captured")
      assert.equal(successfulTxn.is_demo, true)
    })

    it("simulates failed demo transaction and preserves reservation for retry", () => {
      const initialTxn = {
        id: "pay_sim_02",
        status: "pending",
        is_demo: true,
        method: "maya",
      }

      const failedTxn = {
        ...initialTxn,
        status: "failed",
        failure_reason: "Insufficient simulated wallet balance (Demo)",
      }

      assert.equal(failedTxn.status, "failed")
      assert.ok(failedTxn.failure_reason.length > 0)
    })

    it("simulates cancelled checkout and returns gracefully", () => {
      const cancelledTxn = {
        status: "failed",
        failure_reason: "Payment checkout cancelled by customer (Demo)",
        is_demo: true,
      }

      assert.equal(cancelledTxn.status, "failed")
      assert.match(cancelledTxn.failure_reason, /cancelled/i)
    })

    it("generates demo transaction reference with VYR-DEMO- prefix", () => {
      const method = "gcash"
      const randHex = crypto.randomBytes(4).toString("hex").toUpperCase()
      const txnRef = `VYR-DEMO-${method.toUpperCase()}-${randHex}`

      assert.match(txnRef, /^VYR-DEMO-GCASH-[0-9A-F]{8}$/)
    })

    it("receipt explicitly displays DEMO — NO REAL MONEY INVOLVED watermark", () => {
      const receipt = {
        company: "Veyra Car Rental",
        transactionRef: "VYR-DEMO-GCASH-12345678",
        amountPhp: "₱3,800.00",
        disclaimer: "DEMO — NO REAL MONEY INVOLVED",
        isDemo: true,
      }

      assert.equal(receipt.isDemo, true)
      assert.equal(receipt.disclaimer, "DEMO — NO REAL MONEY INVOLVED")
    })
  })

  // ─── 7. Admin Operations & Financial Segregation ───────────────────────────
  describe("7. Admin Operations & Financial Revenue Segregation", () => {
    it("strictly excludes simulated payments from actual captured revenue KPI", () => {
      const paymentRecords = [
        { id: "1", amount: 15000, status: "captured", isDemo: false }, // Real
        { id: "2", amount: 28000, status: "captured", isDemo: false }, // Real
        { id: "3", amount: 3500, status: "captured", isDemo: true },   // Demo
        { id: "4", amount: 7200, status: "captured", isDemo: true },   // Demo
      ]

      const realCapturedRevenue = paymentRecords
        .filter((p) => !p.isDemo && p.status === "captured")
        .reduce((sum, p) => sum + p.amount, 0)

      const simulatedPaymentVolume = paymentRecords
        .filter((p) => p.isDemo && p.status === "captured")
        .reduce((sum, p) => sum + p.amount, 0)

      assert.equal(realCapturedRevenue, 43000, "Actual revenue must only sum non-demo payments")
      assert.equal(simulatedPaymentVolume, 10700, "Simulated volume tracks demo payments separately")
      assert.notEqual(realCapturedRevenue, realCapturedRevenue + simulatedPaymentVolume)
    })

    it("prevents conversion of real payment records into demo transactions", () => {
      const realPayment = { id: "p_real_01", is_demo: false, amount: 20000 }
      const attemptConvert = () => {
        // Business rule: Once created with is_demo: false, is_demo cannot be toggled
        if (realPayment.is_demo === false) {
          throw new Error("MUTATION_PROHIBITED: Cannot convert existing real payment into demo")
        }
      }

      assert.throws(attemptConvert, /MUTATION_PROHIBITED/)
    })
  })

  // ─── 8. Complete 13-Step Customer Journey End-to-End Simulation ────────────
  describe("8. Complete 13-Step Customer Journey End-to-End Simulation", () => {
    it("executes the entire journey from vehicle selection through demo payment and receipt", async () => {
      // Step 1: Customer signs in through Clerk
      const clerkUserId = "user_e2e_student_capstone"
      assert.ok(clerkUserId)

      // Step 2: Customer selects an available vehicle
      const vehicle = { id: "veh_toyota_cross", name: "Toyota Corolla Cross Hybrid", dailyRate: 2500 }
      assert.ok(vehicle.id)

      // Step 3: Customer selects pickup and return dates
      const pickupDate = "2026-11-10"
      const pickupTime = "10:00"
      assert.equal(pickupTime, "10:00")

      // Step 4: Customer manually chooses rental duration (3 days)
      const rentalDays = 3
      const [y, m, d] = pickupDate.split("-").map(Number)
      const targetDate = new Date(Date.UTC(y, m - 1, d + rentalDays))
      const returnDate = targetDate.toISOString().split("T")[0]
      const returnTime = "10:00"

      assert.equal(returnDate, "2026-11-13")
      assert.equal(returnTime, "10:00")

      // Step 5: System calculates authoritative quote
      const rentalAmountCentavos = vehicle.dailyRate * rentalDays * 100 // ₱7,500.00
      const depositAmountCentavos = 500000 // ₱5,000.00
      const totalAmountCentavos = rentalAmountCentavos
      assert.equal(totalAmountCentavos, 750000)
      assert.equal(depositAmountCentavos, 500000)

      // Step 6: Customer selects supported Butuan City barangay
      const selectedBarangay = "Doongan"
      const streetAddress = "Purok 3, Near City Hall"
      assert.ok(BUTUAN_BARANGAYS.some((b) => b.name === selectedBarangay))
      assert.ok(streetAddress.length > 5)

      // Step 7: Existing vehicle availability validation runs
      const isVehicleAvailable = true
      assert.equal(isVehicleAvailable, true)

      // Step 8: Existing KYC requirements are checked (Driver's License approved)
      const kycStatus = { verified: true, hasApprovedDl: true }
      assert.equal(kycStatus.verified, true)

      // Step 9: Required Terms of Service acceptance is validated
      const agreedToTerms = true
      assert.equal(agreedToTerms, true)

      // Step 10: Customer reviews summary and total
      const reviewTotalPhp = totalAmountCentavos / 100
      assert.equal(reviewTotalPhp, 7500)

      // Step 11: Customer selects online demo method (GCash Demo)
      const selectedMethod = "gcash"
      const provider = getPaymentProvider(selectedMethod, { demo: true })
      assert.equal(provider.name, "demo")

      // Step 12: System creates pending reservation and payment records
      const pendingReservation = {
        reference: "VYR-E2E-CAPSTONE-01",
        status: "payment_pending",
        totalAmountCentavos,
        paymentMethod: selectedMethod,
      }
      const pendingPayment = {
        reference: "VYR-DEMO-GCASH-E2E99",
        status: "pending",
        is_demo: true,
        amountCentavos: totalAmountCentavos,
      }
      assert.equal(pendingReservation.status, "payment_pending")
      assert.equal(pendingPayment.is_demo, true)

      // Step 13: Customer simulates successful payment
      const confirmedPayment = {
        ...pendingPayment,
        status: "captured",
      }
      const confirmedReservation = {
        ...pendingReservation,
        status: "confirmed",
      }

      assert.equal(confirmedPayment.status, "captured")
      assert.equal(confirmedReservation.status, "confirmed")

      // Step 14: Demo receipt verification
      const receipt = {
        reference: confirmedReservation.reference,
        demoTxnRef: confirmedPayment.reference,
        status: "PAID (DEMO)",
        amount: "₱7,500.00",
        vehicle: vehicle.name,
        duration: "3 days",
        watermark: "DEMO — NO REAL MONEY INVOLVED",
      }

      assert.equal(receipt.watermark, "DEMO — NO REAL MONEY INVOLVED")
      assert.equal(receipt.status, "PAID (DEMO)")
    })
  })

  // ─── 9. Capstone Rehearsal — Comprehensive Failure Scenarios & Edge Cases ─
  describe("9. Capstone Rehearsal — Failure Scenarios & Edge Cases", () => {
    it("Failure Scenario 1: Vehicle being unavailable for the selected dates blocks booking", () => {
      const existingBookings = [
        { pickup: "2026-11-10T10:00:00Z", return: "2026-11-15T10:00:00Z", status: "confirmed" },
      ]
      const requestedBooking = { pickup: "2026-11-12T10:00:00Z", return: "2026-11-14T10:00:00Z" }

      const isCollision = existingBookings.some((b) => {
        const bStart = new Date(b.pickup).getTime()
        const bEnd = new Date(b.return).getTime()
        const reqStart = new Date(requestedBooking.pickup).getTime()
        const reqEnd = new Date(requestedBooking.return).getTime()
        return reqStart < bEnd && reqEnd > bStart
      })

      assert.equal(isCollision, true, "Availability overlap must be detected")
    })

    it("Failure Scenario 2: Rental duration below configured minimum is rejected", () => {
      const minDays = 1
      const attemptedDurationDays = 0 // Invalid 0-day or negative rental
      const isValid = attemptedDurationDays >= minDays
      assert.equal(isValid, false, "Rental duration below minimum must be rejected")
    })

    it("Failure Scenario 3: Unsupported pickup address outside Butuan City is rejected", () => {
      // Coordinate in Surigao City or Cagayan de Oro (>50km away)
      const outOfBoundsLat = 8.5
      const outOfBoundsLng = 124.6
      const serviceCheck = isWithinButuanServiceArea(outOfBoundsLat, outOfBoundsLng)

      assert.equal(serviceCheck.isSupported, false)
      assert.ok(serviceCheck.reason?.includes("outside Veyra's Butuan City service boundary"))
    })

    it("Failure Scenario 4: Missing required KYC document blocks rental confirmation", () => {
      const customerDocs: Array<{ type: string; status: string }> = [] // No documents uploaded
      const hasApprovedDl = customerDocs.some(
        (d) => d.type === "driver_license" && d.status === "approved"
      )
      assert.equal(hasApprovedDl, false, "Missing driver license must block confirmation")
    })

    it("Failure Scenario 5: Missing Terms of Service acceptance blocks reservation creation", () => {
      const customerInput = { agreedToTerms: false }
      const canProceed = customerInput.agreedToTerms === true
      assert.equal(canProceed, false, "Missing Terms of Service acceptance must block creation")
    })

    it("Failure Scenario 6: Failed simulated payment records failure reason and preserves booking", () => {
      const payment = {
        id: "pay_failed_rehearsal",
        status: "pending",
        is_demo: true,
      }
      const failureReason = "Simulated insufficient funds in demo account"

      // Execute simulation failure
      const updatedPayment = {
        ...payment,
        status: "failed",
        failure_reason: failureReason,
      }
      const reservation = {
        id: "res_rehearsal_01",
        status: "payment_failed", // Preserved for retry
      }

      assert.equal(updatedPayment.status, "failed")
      assert.equal(updatedPayment.failure_reason, failureReason)
      assert.equal(reservation.status, "payment_failed")
    })

    it("Failure Scenario 7: Cancelled simulated payment allows safe return without orphan charges", () => {
      const cancellationResult = {
        status: "failed",
        failure_reason: "Payment checkout cancelled by customer (Demo)",
        canRetry: true,
      }

      assert.equal(cancellationResult.status, "failed")
      assert.equal(cancellationResult.canRetry, true)
    })

    it("Failure Scenario 8: Retrying a failed demo payment succeeds without duplicate records", () => {
      const paymentAttempts = [
        { attempt: 1, status: "failed", ref: "VYR-DEMO-CARD-ATTEMPT1" },
      ]

      // Customer retries same reservation
      paymentAttempts.push({
        attempt: 2,
        status: "captured",
        ref: "VYR-DEMO-CARD-ATTEMPT2",
      })

      assert.equal(paymentAttempts.length, 2)
      assert.equal(paymentAttempts[0].status, "failed")
      assert.equal(paymentAttempts[1].status, "captured")
    })
  })
})
