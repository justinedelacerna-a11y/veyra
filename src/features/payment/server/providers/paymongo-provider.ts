import "server-only"
import { createServiceClient } from "@/lib/supabase/server"
import { createCheckoutSession } from "../paymongo-service"
import type {
  PaymentProvider,
  CreatePaymentParams,
  PaymentSessionResult,
  PaymentStatusResult,
} from "../../types"

/**
 * PayMongo Payment Provider Adapter
 *
 * Implements the PaymentProvider abstraction backed by the authoritative
 * PayMongo checkout and e-wallet gateway (Cards, GCash, Maya).
 */
export class PayMongoPaymentProvider implements PaymentProvider {
  readonly name = "paymongo"

  async createPayment(params: CreatePaymentParams): Promise<PaymentSessionResult> {
    const { reservationId, clerkUserId, paymentMethod } = params

    // Map method ID to PayMongo supported types
    const mappedMethod: "card" | "e-wallet" | "counter" =
      paymentMethod === "card"
        ? "card"
        : paymentMethod === "gcash" || paymentMethod === "maya" || paymentMethod === "online"
        ? "e-wallet"
        : "counter"

    const result = await createCheckoutSession({
      reservationId,
      clerkUserId,
      paymentMethod: mappedMethod,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    })

    if (!result.success) {
      return {
        success: false,
        reference: "",
        totalAmountCentavos: 0,
        currency: "PHP",
        status: "failed",
        error: result.error,
        message: result.message,
      }
    }

    return {
      success: true,
      sessionId: result.sessionId,
      checkoutUrl: result.checkoutUrl,
      reference: result.reference,
      totalAmountCentavos: result.totalAmountCentavos,
      currency: result.currency,
      status: "pending",
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
      return { status: "unpaid" }
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
        failure_reason: "Payment cancelled by customer",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_payment_id", providerPaymentId)

    if (error) {
      return { success: false, message: error.message }
    }
    return { success: true }
  }
}
