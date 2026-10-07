import { NextRequest, NextResponse } from "next/server"
import { processPayMongoWebhookEvent } from "@/features/payment/server"

/**
 * POST /api/webhooks/paymongo
 *
 * Inbound webhook handler for PayMongo payment gateway events.
 *
 * Security & Integrity:
 * 1. Cryptographically verifies PayMongo HMAC-SHA256 signature.
 * 2. Deduplicates events idempotently using public.webhook_events.
 * 3. Transitions reservation status from payment_pending to confirmed on payment.paid.
 * 4. Updates payment transaction record to captured with provider reference.
 * 5. Does not accept browser-initiated payment confirmation.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("paymongo-signature")

    const result = await processPayMongoWebhookEvent(rawBody, signature)
    return NextResponse.json(result.body, { status: result.status })
  } catch (err) {
    console.error("[api/webhooks/paymongo] Unhandled error:", err)
    return NextResponse.json(
      { received: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
