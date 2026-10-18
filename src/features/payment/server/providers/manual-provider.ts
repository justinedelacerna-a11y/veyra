import "server-only"
import { createServiceClient } from "@/lib/supabase/server"
import type {
  PaymentProvider,
  CreatePaymentParams,
  PaymentSessionResult,
  PaymentStatusResult,
} from "../../types"

/**
 * Manual / Pay-at-Pickup Payment Provider
 *
 * Implements counter settlement for Veyra rental reservations.
 * Does not contact external gateways; records pending settlement in public.payments
 * to be collected upon vehicle handover at the valet bay or branch.
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual"

  async createPayment(params: CreatePaymentParams): Promise<PaymentSessionResult> {
    const { reservationId, clerkUserId } = params
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
        error: "unauthorized",
        message: "Customer account could not be resolved.",
      }
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", dbUser.id)
      .single()

    if (!customer) {
      return {
        success: false,
        reference: "",
        totalAmountCentavos: 0,
        currency: "PHP",
        status: "failed",
        error: "customer_not_found",
        message: "Customer profile not found.",
      }
    }

    // 2. Fetch reservation
    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .select("id, reference, customer_id, total_amount, currency, status")
      .eq("id", reservationId)
      .single()

    if (resErr || !reservation) {
      return {
        success: false,
        reference: "",
        totalAmountCentavos: 0,
        currency: "PHP",
        status: "failed",
        error: "reservation_not_found",
        message: "Reservation record could not be found.",
      }
    }

    if (reservation.customer_id !== customer.id) {
      return {
        success: false,
        reference: reservation.reference,
        totalAmountCentavos: Number(reservation.total_amount),
        currency: reservation.currency || "PHP",
        status: "failed",
        error: "unauthorized",
        message: "You are not authorized to modify this reservation.",
      }
    }

    const amountCentavos = Number(reservation.total_amount)
    const currency = reservation.currency || "PHP"
    const idempotencyKey = `pay_manual_${reservation.id}`

    // 3. Upsert payment record with pending status
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("reservation_id", reservation.id)
      .eq("method", "counter")
      .maybeSingle()

    if (!existingPayment) {
      await supabase.from("payments").insert({
        reservation_id: reservation.id,
        customer_id: reservation.customer_id,
        type: "rental",
        amount: amountCentavos,
        currency,
        status: "pending",
        method: "counter",
        provider: "manual",
        provider_payment_id: `manual_${reservation.reference}`,
        idempotency_key: idempotencyKey,
      })
    }

    // 4. Update reservation payment method
    await supabase
      .from("reservations")
      .update({
        payment_method: "counter",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id)

    return {
      success: true,
      reference: reservation.reference,
      totalAmountCentavos: amountCentavos,
      currency,
      status: "pending",
      message: "Pay-at-pickup recorded. Settlement will occur upon vehicle handover.",
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    const supabase = createServiceClient()
    const { data: payment } = await supabase
      .from("payments")
      .select("status, amount, currency, provider_txn_ref, updated_at, failure_reason")
      .eq("provider_payment_id", providerPaymentId)
      .maybeSingle()

    if (!payment) {
      return {
        status: "unpaid",
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
    }
  }

  async cancelPayment(providerPaymentId: string): Promise<{ success: boolean; message?: string }> {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from("payments")
      .update({
        status: "failed",
        failure_reason: "Cancelled by customer or operator",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_payment_id", providerPaymentId)

    if (error) {
      return { success: false, message: error.message }
    }
    return { success: true }
  }
}
