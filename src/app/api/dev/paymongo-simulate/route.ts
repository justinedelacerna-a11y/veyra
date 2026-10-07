import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { createServiceClient } from "@/lib/supabase/server"
import { processPayMongoWebhookEvent } from "@/features/payment/server"

/**
 * POST /api/dev/paymongo-simulate
 *
 * Developer Sandbox Simulator:
 * Generates an authoritative PayMongo signed webhook payload and processes it
 * through the exact production processPayMongoWebhookEvent pipeline.
 *
 * Used for development testing and automated verification.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Simulator not available in production." },
      { status: 404 }
    )
  }

  try {
    const body = await request.json()
    const { reference, action = "paid" } = body

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Reservation reference is required." },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, reference, total_amount, currency")
      .eq("reference", reference)
      .single()

    if (!reservation) {
      return NextResponse.json(
        { success: false, message: "Reservation not found." },
        { status: 404 }
      )
    }

    const eventId = `evt_sandbox_${crypto.randomBytes(8).toString("hex")}`
    const sessionId = `cs_sandbox_${crypto.randomBytes(8).toString("hex")}`
    const paymentId = `pay_sandbox_${crypto.randomBytes(8).toString("hex")}`

    const webhookPayload = {
      data: {
        id: eventId,
        type: "event",
        attributes: {
          type: action === "paid" ? "checkout_session.payment.paid" : "payment.failed",
          livemode: false,
          created_at: Math.floor(Date.now() / 1000),
          data: {
            id: sessionId,
            type: "checkout_session",
            attributes: {
              reference_number: reservation.reference,
              amount: Number(reservation.total_amount),
              currency: reservation.currency || "PHP",
              status: action === "paid" ? "paid" : "failed",
              payments: action === "paid" ? [
                {
                  id: paymentId,
                  type: "payment",
                  attributes: {
                    amount: Number(reservation.total_amount),
                    currency: "PHP",
                    status: "paid",
                  },
                },
              ] : [],
            },
          },
        },
      },
    }

    const rawBody = JSON.stringify(webhookPayload)
    const timestamp = Math.floor(Date.now() / 1000)
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET || "whsk_test_veyra_sandbox_secret"
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex")

    const signatureHeader = `t=${timestamp},te=${signature}`

    // Pass through authoritative webhook ingestion
    const webhookResult = await processPayMongoWebhookEvent(
      rawBody,
      signatureHeader,
      secret
    )

    return NextResponse.json({
      success: webhookResult.status === 200,
      webhookStatus: webhookResult.status,
      result: webhookResult.body,
      reference: reservation.reference,
      eventId,
    })
  } catch (err) {
    console.error("[paymongo-simulate] Simulation error:", err)
    return NextResponse.json(
      { success: false, message: "Simulation failed" },
      { status: 500 }
    )
  }
}
