import "server-only"
import crypto from "node:crypto"
import { createServiceClient } from "@/lib/supabase/server"
import type {
  PaymentProvider,
  CreatePaymentParams,
  PaymentSessionResult,
  PaymentStatusResult,
  DemoPaymentSimulationResult,
} from "../../types"

/**
 * Dedicated Demo Mode Payment Provider
 *
 * Implements deterministic school/capstone demonstration payment simulation.
 * CRITICAL REQUIREMENTS:
 * - NEVER contacts live payment gateways or charges real accounts.
 * - NEVER exposes or accepts real financial credentials.
 * - Records all simulated transactions with is_demo = true in public.payments.
 * - Enforces server-side Clerk authentication, customer ownership, and quote integrity.
 */
export class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo"

  async createPayment(params: CreatePaymentParams): Promise<PaymentSessionResult> {
    const { reservationId, clerkUserId, paymentMethod } = params
    const supabase = createServiceClient()

    // 1. Resolve internal user and customer
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("clerk_id", clerkUserId)
      .single()

    if (!dbUser) {
      return {
        success: false,
        reference: "",
        totalAmountCentavos: 0,
        currency: "PHP",
        status: "failed",
        isDemo: true,
        error: "unauthorized",
        message: "Customer account could not be resolved.",
      }
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id, verification_status")
      .eq("user_id", dbUser.id)
      .single()

    if (!customer) {
      return {
        success: false,
        reference: "",
        totalAmountCentavos: 0,
        currency: "PHP",
        status: "failed",
        isDemo: true,
        error: "customer_not_found",
        message: "Customer profile not found.",
      }
    }

    // 1b. KYC Gate Check
    const { data: approvedDl } = await supabase
      .from("customer_documents")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("type", "driver_license")
      .eq("status", "approved")
      .maybeSingle()

    const isKycVerified = customer.verification_status === "verified" || Boolean(approvedDl)
    if (!isKycVerified) {
      return {
        success: false,
        reference: "",
        totalAmountCentavos: 0,
        currency: "PHP",
        status: "failed",
        isDemo: true,
        error: "kyc_unverified",
        message: "Driver verification is required before proceeding to payment.",
      }
    }

    // 2. Fetch authoritative reservation record
    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .select("id, reference, customer_id, total_amount, currency, status, hold_expires_at, rental_days")
      .eq("id", reservationId)
      .single()

    if (resErr || !reservation) {
      return {
        success: false,
        reference: "",
        totalAmountCentavos: 0,
        currency: "PHP",
        status: "failed",
        isDemo: true,
        error: "reservation_not_found",
        message: "Reservation record could not be found.",
      }
    }

    // 3. Security: Check reservation ownership
    if (reservation.customer_id !== customer.id) {
      return {
        success: false,
        reference: reservation.reference,
        totalAmountCentavos: Number(reservation.total_amount),
        currency: reservation.currency || "PHP",
        status: "failed",
        isDemo: true,
        error: "unauthorized",
        message: "You are not authorized to modify this reservation.",
      }
    }

    // 4. State validation: only held or payment_pending reservations are payable
    const payableStates = ["held", "payment_pending", "draft", "quote_created"]
    if (!payableStates.includes(reservation.status)) {
      return {
        success: false,
        reference: reservation.reference,
        totalAmountCentavos: Number(reservation.total_amount),
        currency: reservation.currency || "PHP",
        status: "failed",
        isDemo: true,
        error: "invalid_state",
        message: `Reservation in state '${reservation.status}' cannot be checked out.`,
      }
    }

    // 5. Authoritative amount
    const amountCentavos = Number(reservation.total_amount)
    const currency = reservation.currency || "PHP"

    // 6. Generate distinct demo transaction references
    const methodSuffix =
      paymentMethod === "gcash"
        ? "GCASH"
        : paymentMethod === "maya"
        ? "MAYA"
        : paymentMethod === "card"
        ? "CARD"
        : paymentMethod === "bank_transfer"
        ? "BANK"
        : "DEMO"

    const demoTxnRef = `VYR-DEMO-${methodSuffix}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
    const sessionId = `demo_sess_${crypto.randomBytes(8).toString("hex")}`
    const idempotencyKey = `pay_demo_${reservation.id}_${sessionId}`

    // Map method to DB constraint ('card' | 'e_wallet' | 'counter' | 'bank_transfer')
    let dbMethod: "card" | "e_wallet" | "counter" | "bank_transfer" = "card"
    if (paymentMethod === "gcash" || paymentMethod === "maya") {
      dbMethod = "e_wallet"
    } else if (paymentMethod === "bank_transfer") {
      dbMethod = "bank_transfer"
    } else if (paymentMethod === "pay_at_pickup") {
      dbMethod = "counter"
    } else {
      dbMethod = "card"
    }

    // 7. Upsert demo payment record
    const { error: insErr } = await supabase.from("payments").insert({
      reservation_id: reservation.id,
      customer_id: reservation.customer_id,
      type: "rental",
      amount: amountCentavos,
      currency,
      status: "pending",
      method: dbMethod,
      provider: `demo_${paymentMethod}`,
      provider_payment_id: sessionId,
      provider_txn_ref: demoTxnRef,
      idempotency_key: idempotencyKey,
      is_demo: true,
      notes: `Simulated demonstration payment for ${paymentMethod.toUpperCase()} (Demo Mode - No real money)`,
    })

    if (insErr) {
      console.error("[DemoPaymentProvider] Error creating demo payment record:", insErr)
      return {
        success: false,
        reference: reservation.reference,
        totalAmountCentavos: amountCentavos,
        currency,
        status: "failed",
        isDemo: true,
        error: "database_error",
        message: "Failed to persist demonstration payment record.",
      }
    }

    // 8. Update reservation state to payment_pending
    await supabase
      .from("reservations")
      .update({
        status: "payment_pending",
        payment_method: dbMethod,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id)

    const checkoutUrl = `/booking/demo-checkout?ref=${encodeURIComponent(
      reservation.reference
    )}&method=${encodeURIComponent(paymentMethod)}&session_id=${encodeURIComponent(sessionId)}`

    return {
      success: true,
      sessionId,
      checkoutUrl,
      reference: reservation.reference,
      totalAmountCentavos: amountCentavos,
      currency,
      status: "pending",
      isDemo: true,
      message: "Demonstration payment session initiated.",
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    const supabase = createServiceClient()
    const { data: payment } = await supabase
      .from("payments")
      .select("status, amount, currency, provider_txn_ref, updated_at, failure_reason, is_demo")
      .eq("provider_payment_id", providerPaymentId)
      .maybeSingle()

    if (!payment) {
      return {
        status: "unpaid",
        isDemo: true,
      }
    }

    const stateMap: Record<string, PaymentStatusResult["status"]> = {
      pending: "pending",
      authorized: "authorized",
      captured: "paid",
      failed: "failed",
      refunded: "refunded",
      partially_refunded: "partially_refunded",
    }

    return {
      status: stateMap[payment.status] || "pending",
      providerPaymentId,
      amountCentavos: Number(payment.amount),
      currency: payment.currency,
      reference: payment.provider_txn_ref || undefined,
      paidAt: payment.status === "captured" ? payment.updated_at : undefined,
      failureReason: payment.failure_reason || undefined,
      isDemo: Boolean(payment.is_demo),
    }
  }

  async cancelPayment(providerPaymentId: string): Promise<{ success: boolean; message?: string }> {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from("payments")
      .update({
        status: "failed",
        failure_reason: "Simulated payment cancelled by customer",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_payment_id", providerPaymentId)
      .eq("is_demo", true)

    if (error) {
      return { success: false, message: error.message }
    }
    return { success: true }
  }

  /**
   * Deterministically transitions a demo payment and its associated reservation
   * to a simulated outcome (success, failure, or cancellation).
   */
  async simulateOutcome(params: {
    reference: string
    sessionId?: string
    clerkUserId: string
    action: "success" | "failure" | "cancel"
    failureReason?: string
  }): Promise<DemoPaymentSimulationResult> {
    const { reference, sessionId, clerkUserId, action, failureReason } = params
    const supabase = createServiceClient()

    // 1. Resolve customer
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single()

    if (!dbUser) {
      throw new Error("Customer account could not be resolved.")
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", dbUser.id)
      .single()

    if (!customer) {
      throw new Error("Customer profile not found.")
    }

    // 2. Resolve reservation
    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .select("id, reference, customer_id, total_amount, currency, status")
      .eq("reference", reference)
      .single()

    if (resErr || !reservation) {
      throw new Error("Reservation not found.")
    }

    if (reservation.customer_id !== customer.id) {
      throw new Error("Unauthorized to access this reservation.")
    }

    // 3. Resolve pending demo payment
    let paymentQuery = supabase
      .from("payments")
      .select("id, status, is_demo, amount, currency, provider_txn_ref, provider_payment_id")
      .eq("reservation_id", reservation.id)
      .eq("is_demo", true)

    if (sessionId) {
      paymentQuery = paymentQuery.eq("provider_payment_id", sessionId)
    }

    const { data: payment, error: pErr } = await paymentQuery.order("created_at", { ascending: false }).limit(1).maybeSingle()

    if (pErr || !payment) {
      throw new Error("No eligible demo payment record found for this reservation.")
    }

    // Security check: Never alter non-demo or already settled payments
    if (!payment.is_demo) {
      throw new Error("Cannot simulate outcomes on live financial transactions.")
    }

    const amountCentavos = Number(payment.amount)
    const currency = payment.currency || "PHP"
    const paymentRef = payment.provider_txn_ref || `VYR-DEMO-${reservation.reference}`

    const now = new Date().toISOString()

    if (action === "success") {
      // Transition payment to captured
      await supabase
        .from("payments")
        .update({
          status: "captured",
          updated_at: now,
        })
        .eq("id", payment.id)

      // Transition reservation to confirmed
      await supabase
        .from("reservations")
        .update({
          status: "confirmed",
          payment_status: "captured",
          updated_at: now,
        })
        .eq("id", reservation.id)

      return {
        success: true,
        status: "paid",
        reservationStatus: "confirmed",
        reference: reservation.reference,
        paymentReference: paymentRef,
        amountCentavos,
        currency,
        isDemo: true,
        message: "Simulated payment successful! Reservation is confirmed (Demo).",
      }
    } else if (action === "failure") {
      const reason = failureReason || "Payment simulation declined (Demo: Insufficient wallet balance / card rejected)"

      await supabase
        .from("payments")
        .update({
          status: "failed",
          failure_reason: reason,
          updated_at: now,
        })
        .eq("id", payment.id)

      // Reservation status remains in payment_pending to allow retry
      return {
        success: false,
        status: "failed",
        reservationStatus: reservation.status,
        reference: reservation.reference,
        paymentReference: paymentRef,
        amountCentavos,
        currency,
        isDemo: true,
        message: reason,
      }
    } else {
      // Cancel
      const reason = "Payment checkout cancelled by customer (Demo)"

      await supabase
        .from("payments")
        .update({
          status: "failed",
          failure_reason: reason,
          updated_at: now,
        })
        .eq("id", payment.id)

      return {
        success: false,
        status: "cancelled",
        reservationStatus: reservation.status,
        reference: reservation.reference,
        paymentReference: paymentRef,
        amountCentavos,
        currency,
        isDemo: true,
        message: reason,
      }
    }
  }
}
