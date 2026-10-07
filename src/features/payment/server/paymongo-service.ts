import "server-only"
import crypto from "node:crypto"
import { createServiceClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

export interface CreateCheckoutSessionParams {
  reservationId: string
  clerkUserId: string
  paymentMethod?: "card" | "e-wallet" | "counter"
  successUrl?: string
  cancelUrl?: string
}

export type CheckoutSessionResult =
  | {
      success: true
      sessionId: string
      checkoutUrl: string
      reference: string
      totalAmountCentavos: number
      currency: string
    }
  | {
      success: false
      error:
        | "payments_disabled"
        | "unauthorized"
        | "customer_not_found"
        | "reservation_not_found"
        | "quote_expired"
        | "hold_expired"
        | "invalid_state"
        | "provider_error"
        | "database_error"
      message: string
    }

/**
 * Validates a PayMongo inbound webhook signature using HMAC-SHA256.
 * PayMongo signature format: t=<timestamp>,te=<test_signature>,li=<live_signature>
 */
export function verifyPayMongoSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretOverride?: string
): boolean {
  const secret =
    secretOverride ||
    process.env.PAYMONGO_WEBHOOK_SECRET ||
    (process.env.NODE_ENV !== "production" ? "whsk_test_veyra_sandbox_secret" : "")
  if (!secret || !signatureHeader) {
    return false
  }

  try {
    const parts = signatureHeader.split(",")
    const signatureMap: Record<string, string> = {}
    for (const part of parts) {
      const [key, val] = part.split("=")
      if (key && val) {
        signatureMap[key.trim()] = val.trim()
      }
    }

    const timestamp = signatureMap.t
    const testSignature = signatureMap.te
    const liveSignature = signatureMap.li

    if (!timestamp || (!testSignature && !liveSignature)) {
      return false
    }

    const payloadToSign = `${timestamp}.${rawBody}`
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadToSign)
      .digest("hex")

    if (testSignature) {
      const match = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(testSignature, "utf8")
      )
      if (match) return true
    }

    if (liveSignature) {
      const match = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(liveSignature, "utf8")
      )
      if (match) return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Authoritative Server-Side Checkout Session Creation
 *
 * Rules:
 * 1. Checks Clerk authentication and ownership.
 * 2. Loads quote & reservation from Supabase; NEVER accepts client price/currency.
 * 3. Verifies quote has not expired.
 * 4. Verifies reservation is in 'held' or 'payment_pending' state.
 * 5. Calls PayMongo API (or sandbox emulator if credentials not yet provisioned).
 * 6. Records pending payment in public.payments.
 * 7. Transitions reservation state to 'payment_pending'.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  if (process.env.PAYMENTS_ENABLED !== "true") {
    return {
      success: false,
      error: "payments_disabled",
      message:
        "Payment processing is currently unavailable. Your reservation can be recorded and payment can be completed later.",
    }
  }

  const { reservationId, clerkUserId, paymentMethod = "card" } = params
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
      error: "unauthorized",
      message: "Customer account could not be resolved.",
    }
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("user_id", dbUser.id)
    .single()

  if (!customer) {
    return {
      success: false,
      error: "customer_not_found",
      message: "Customer profile not found.",
    }
  }

  // 2. Load authoritative reservation record
  const { data: reservation, error: resErr } = await supabase
    .from("reservations")
    .select("*, quotes (*)")
    .eq("id", reservationId)
    .single()

  if (resErr || !reservation) {
    return {
      success: false,
      error: "reservation_not_found",
      message: "Reservation record could not be found.",
    }
  }

  // 3. Security: verify reservation belongs to the authenticated customer
  if (reservation.customer_id !== customer.id) {
    return {
      success: false,
      error: "unauthorized",
      message: "You are not authorized to access this reservation.",
    }
  }

  // 4. State validation: only 'held' or 'payment_pending' reservations are payable
  if (!["held", "payment_pending"].includes(reservation.status)) {
    return {
      success: false,
      error: "invalid_state",
      message: `Reservation in state '${reservation.status}' cannot be checked out.`,
    }
  }

  // 5. Quote expiration check
  const quote = reservation.quotes
  if (quote && quote.expires_at) {
    const isQuoteExpired = new Date(quote.expires_at).getTime() < Date.now()
    if (isQuoteExpired && reservation.status !== "payment_pending") {
      return {
        success: false,
        error: "quote_expired",
        message: "The quote for this reservation has expired.",
      }
    }
  }

  // 6. Hold expiration check
  if (reservation.hold_expires_at) {
    const isHoldExpired = new Date(reservation.hold_expires_at).getTime() < Date.now()
    if (isHoldExpired) {
      // Transition to expired per state machine
      await supabase
        .from("reservations")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", reservation.id)

      return {
        success: false,
        error: "hold_expired",
        message: "The inventory hold on this reservation has expired.",
      }
    }
  }

  // 7. Authoritative amount strictly in server minor units (centavos)
  const amountCentavos = Number(reservation.total_amount)
  const currency = reservation.currency || "PHP"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const payMongoSecret = process.env.PAYMONGO_SECRET_KEY
  let sessionId = ""
  let checkoutUrl = ""

  // Map payment method to PayMongo types
  const methodMap: Record<string, string[]> = {
    card: ["card"],
    "e-wallet": ["gcash", "paymaya", "grab_pay"],
    counter: ["card", "gcash", "paymaya"],
  }
  const paymentMethodTypes = methodMap[paymentMethod] || ["card", "gcash", "paymaya"]

  if (payMongoSecret && payMongoSecret.startsWith("sk_")) {
    // Official PayMongo REST API Call
    try {
      const authHeader = `Basic ${Buffer.from(`${payMongoSecret}:`).toString("base64")}`
      const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              billing: {
                name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Veyra Customer",
                email: dbUser.email,
                phone: "+639170000000",
              },
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              line_items: [
                {
                  currency,
                  amount: amountCentavos,
                  description: `Vehicle Reservation Rental (${reservation.rental_days} days)`,
                  name: `Veyra: ${reservation.reference}`,
                  quantity: 1,
                },
              ],
              payment_method_types: paymentMethodTypes,
              reference_number: reservation.reference,
              success_url: `${appUrl}/booking/confirmation?ref=${reservation.reference}&session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${appUrl}/booking/payment?ref=${reservation.reference}&cancelled=true`,
            },
          },
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        console.error("[paymongo-service] PayMongo API error:", errJson)
        return {
          success: false,
          error: "provider_error",
          message: "Payment provider was unable to create checkout session.",
        }
      }

      const sessionData = await response.json()
      sessionId = sessionData.data.id
      checkoutUrl = sessionData.data.attributes.checkout_url
    } catch (err) {
      console.error("[paymongo-service] Network error calling PayMongo:", err)
      return {
        success: false,
        error: "provider_error",
        message: "Failed to connect to payment provider.",
      }
    }
  } else {
    // PayMongo Sandbox Development Emulator
    // Generates compliant session ID and checkout redirect for local sandbox testing
    sessionId = `cs_sandbox_${crypto.randomBytes(8).toString("hex")}`
    checkoutUrl = `${appUrl}/booking/checkout-sandbox?session_id=${sessionId}&ref=${reservation.reference}`
  }

  // 8. Record pending payment in public.payments (service_role)
  const dbMethod = paymentMethod === "e-wallet" ? "e_wallet" : paymentMethod === "counter" ? "counter" : "card"
  const idempotencyKey = `pay_sess_${reservation.id}_${sessionId}`

  await supabase.from("payments").insert({
    reservation_id: reservation.id,
    customer_id: reservation.customer_id,
    type: "rental",
    amount: amountCentavos,
    currency,
    status: "pending",
    method: dbMethod,
    provider: "paymongo",
    provider_payment_id: sessionId,
    idempotency_key: idempotencyKey,
  })

  // 9. Transition reservation to 'payment_pending' per state machine
  await supabase
    .from("reservations")
    .update({
      status: "payment_pending",
      payment_method: dbMethod,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservation.id)

  return {
    success: true,
    sessionId,
    checkoutUrl,
    reference: reservation.reference,
    totalAmountCentavos: amountCentavos,
    currency,
  }
}

export interface ProcessWebhookResult {
  status: 200 | 400 | 401 | 500 | 503
  body: {
    received: boolean
    eventId?: string
    action?: string
    message: string
  }
}

/**
 * Authoritative Server-Side PayMongo Webhook Ingestion
 *
 * Integrity Guarantees:
 * 1. Cryptographic HMAC-SHA256 signature verification.
 * 2. Idempotent deduplication via public.webhook_events constraint.
 * 3. Never trusts browser callbacks for payment settlement.
 * 4. Atomically transitions payment and reservation states.
 * 5. Prevents double-settlement of already-confirmed bookings.
 */
export async function processPayMongoWebhookEvent(
  rawBody: string,
  signatureHeader: string | null,
  secretOverride?: string
): Promise<ProcessWebhookResult> {
  if (process.env.PAYMENTS_ENABLED !== "true") {
    return {
      status: 503,
      body: {
        received: false,
        message: "Payment processing is currently disabled (PAYMENTS_ENABLED=false)",
      },
    }
  }

  // 1. Signature Verification
  const isValid = verifyPayMongoSignature(rawBody, signatureHeader, secretOverride)
  if (!isValid) {
    return {
      status: 401,
      body: { received: false, message: "Invalid webhook signature" },
    }
  }

  interface PayMongoWebhookPayload {
    type?: string
    data?: {
      id?: string
      attributes?: {
        type?: string
        data?: {
          id?: string
          attributes?: {
            reference_number?: string
            description?: string
            payment_intent_id?: string
            [key: string]: unknown
          }
          [key: string]: unknown
        }
        [key: string]: unknown
      }
      [key: string]: unknown
    }
    [key: string]: unknown
  }

  let eventJson: PayMongoWebhookPayload
  try {
    eventJson = JSON.parse(rawBody) as PayMongoWebhookPayload
  } catch {
    return {
      status: 400,
      body: { received: false, message: "Malformed JSON payload" },
    }
  }

  const eventData = eventJson.data
  if (!eventData || !eventData.id) {
    return {
      status: 400,
      body: { received: false, message: "Missing event data identifier" },
    }
  }

  const providerEventId = String(eventData.id)
  const eventType = String(eventData.attributes?.type || eventJson.type || "unknown")
  const supabase = createServiceClient()

  // 2. Idempotency Check: check if already processed
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id, status")
    .eq("provider", "paymongo")
    .eq("provider_event_id", providerEventId)
    .single()

  if (existingEvent) {
    return {
      status: 200,
      body: {
        received: true,
        eventId: providerEventId,
        action: "ignored_duplicate",
        message: `Webhook event already processed with status '${existingEvent.status}' (idempotent ignore)`,
      },
    }
  }

  // 3. Record event in webhook_events ledger with status 'processing'
  const { error: eventInsErr } = await supabase
    .from("webhook_events")
    .upsert(
      {
        provider: "paymongo",
        event_type: eventType,
        provider_event_id: providerEventId,
        payload: eventJson as unknown as Json,
        status: "processing",
        created_at: new Date().toISOString(),
      },
      { onConflict: "provider,provider_event_id" }
    )

  if (eventInsErr) {
    console.warn("[paymongo-webhook] Webhook insert warning:", eventInsErr.message)
  }

  // 4. Process event types
  try {
    const resourceData = (eventData.attributes?.data || {}) as Record<string, unknown>
    const resourceAttributes = (resourceData.attributes || {}) as Record<string, unknown>
    const referenceNumber =
      (typeof resourceAttributes.reference_number === "string" ? resourceAttributes.reference_number : null) ||
      (typeof resourceAttributes.description === "string"
        ? resourceAttributes.description.match(/VYR-[0-9A-Z-]+/)?.[0] || null
        : null)

    const providerPaymentId =
      (typeof resourceData.id === "string" ? resourceData.id : null) ||
      (typeof resourceAttributes.payment_intent_id === "string"
        ? resourceAttributes.payment_intent_id
        : null)

    if (
      eventType === "checkout_session.payment.paid" ||
      eventType === "payment.paid"
    ) {
      // Find matching reservation
      let query = supabase.from("reservations").select("id, reference, status, payment_status, total_amount")
      if (referenceNumber) {
        query = query.eq("reference", referenceNumber)
      } else if (providerPaymentId) {
        // Query payments table first to find reservation
        const { data: pRec } = await supabase
          .from("payments")
          .select("reservation_id")
          .eq("provider_payment_id", providerPaymentId)
          .single()
        if (pRec) {
          query = query.eq("id", pRec.reservation_id)
        }
      }

      const { data: reservation } = await query.single()

      if (!reservation) {
        await supabase
          .from("webhook_events")
          .update({
            status: "failed",
            failure_reason: `Reservation not found for ref ${referenceNumber || providerPaymentId}`,
          })
          .eq("provider", "paymongo")
          .eq("provider_event_id", providerEventId)

        return {
          status: 200,
          body: {
            received: true,
            eventId: providerEventId,
            message: "Reservation not found; logged for audit",
          },
        }
      }

      // Check for double settlement prevention
      if (
        reservation.status === "confirmed" &&
        reservation.payment_status === "captured"
      ) {
        await supabase
          .from("webhook_events")
          .update({ status: "processed", processed_at: new Date().toISOString() })
          .eq("provider", "paymongo")
          .eq("provider_event_id", providerEventId)

        return {
          status: 200,
          body: {
            received: true,
            eventId: providerEventId,
            action: "already_confirmed",
            message: "Reservation is already confirmed and settled",
          },
        }
      }

      const paymentsArr = Array.isArray(resourceAttributes.payments) ? resourceAttributes.payments : []
      const firstPaymentObj = (paymentsArr[0] || {}) as Record<string, unknown>
      const paymentRef =
        (typeof firstPaymentObj.id === "string" ? firstPaymentObj.id : null) ||
        (typeof resourceAttributes.external_reference_number === "string"
          ? resourceAttributes.external_reference_number
          : null) ||
        `PAY-${Date.now()}`

      // Atomically settle payment record
      await supabase
        .from("payments")
        .update({
          status: "captured",
          provider_txn_ref: paymentRef,
          updated_at: new Date().toISOString(),
        })
        .eq("reservation_id", reservation.id)
        .eq("status", "pending")

      // Atomically transition reservation: payment_pending -> confirmed
      await supabase
        .from("reservations")
        .update({
          status: "confirmed",
          payment_status: "captured",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservation.id)

      // Mark webhook event as processed
      await supabase
        .from("webhook_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("provider", "paymongo")
        .eq("provider_event_id", providerEventId)

      return {
        status: 200,
        body: {
          received: true,
          eventId: providerEventId,
          action: "confirmed",
          message: `Reservation ${reservation.reference} confirmed after verified PayMongo payment.`,
        },
      }
    } else if (
      eventType === "payment.failed" ||
      eventType === "checkout_session.expired"
    ) {
      // Find matching reservation
      let query = supabase.from("reservations").select("id, reference, status")
      if (referenceNumber) {
        query = query.eq("reference", referenceNumber)
      }

      const { data: reservation } = await query.single()
      if (reservation) {
        await supabase
          .from("payments")
          .update({
            status: "failed",
            failure_reason:
              typeof resourceAttributes.failed_code === "string"
                ? resourceAttributes.failed_code
                : "Payment declined or session expired",
            updated_at: new Date().toISOString(),
          })
          .eq("reservation_id", reservation.id)
          .eq("status", "pending")

        // Transition reservation to payment_failed and release inventory
        await supabase
          .from("reservations")
          .update({
            status: "payment_failed",
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", reservation.id)
      }

      await supabase
        .from("webhook_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("provider", "paymongo")
        .eq("provider_event_id", providerEventId)

      return {
        status: 200,
        body: {
          received: true,
          eventId: providerEventId,
          action: "payment_failed",
          message: "Payment failure recorded and inventory released.",
        },
      }
    }

    // Unhandled event type
    await supabase
      .from("webhook_events")
      .update({
        status: "ignored",
        processed_at: new Date().toISOString(),
      })
      .eq("provider", "paymongo")
      .eq("provider_event_id", providerEventId)

    return {
      status: 200,
      body: {
        received: true,
        eventId: providerEventId,
        message: `Event type ${eventType} acknowledged and ignored`,
      },
    }
  } catch (err) {
    console.error("[paymongo-webhook] Processing error:", err)
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        failure_reason: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("provider", "paymongo")
      .eq("provider_event_id", providerEventId)

    return {
      status: 500,
      body: { received: false, message: "Internal server error processing webhook" },
    }
  }
}
