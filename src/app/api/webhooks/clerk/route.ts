import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { verifyWebhook } from "@clerk/nextjs/webhooks"
import type { WebhookEvent } from "@clerk/nextjs/webhooks"
import { createServiceClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/types/database"

type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"]

/**
 * Generates a unique customer membership number.
 * Conforms to Veyra specification format: VYR-CUS-XXXXX.
 */
function generateMembershipNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `VYR-CUS-${timestamp}-${randomSuffix}`
}

/**
 * Helper to safely extract primary email and verification state from a Clerk user payload.
 */
function extractUserEmail(userData: {
  email_addresses?: Array<{
    id?: string
    email_address?: string
    verification?: { status?: string | null } | null
  }>
  primary_email_address_id?: string | null
}): { email: string; emailVerified: boolean } {
  const emailAddresses = userData.email_addresses || []
  const primaryId = userData.primary_email_address_id
  const primaryObj = emailAddresses.find((e) => e.id === primaryId) || emailAddresses[0]

  const email = primaryObj?.email_address?.trim().toLowerCase() || ""
  const emailVerified = primaryObj?.verification?.status === "verified"

  return { email, emailVerified }
}

/**
 * Helper to safely extract primary phone number and verification state.
 */
function extractUserPhone(userData: {
  phone_numbers?: Array<{
    id?: string
    phone_number?: string
    verification?: { status?: string | null } | null
  }>
  primary_phone_number_id?: string | null
}): { phone: string | null; phoneVerified: boolean } {
  const phoneNumbers = userData.phone_numbers || []
  const primaryId = userData.primary_phone_number_id
  const primaryObj = phoneNumbers.find((p) => p.id === primaryId) || phoneNumbers[0]

  const phone = primaryObj?.phone_number?.trim() || null
  const phoneVerified = primaryObj?.verification?.status === "verified"

  return { phone, phoneVerified }
}

/**
 * POST /api/webhooks/clerk
 *
 * Handles incoming Clerk user lifecycle webhooks (user.created, user.updated, user.deleted).
 *
 * Security:
 * - Svix signature verification via Clerk's recommended `verifyWebhook()`.
 * - Requires CLERK_WEBHOOK_SIGNING_SECRET.
 * - Uses server-only Supabase service-role client (bypasses RLS for trusted webhook writes).
 * - Secrets and keys are never logged or exposed.
 *
 * Reliability & Idempotency:
 * - Deduplicates incoming requests via `public.webhook_events` table (provider, provider_event_id).
 * - Persists event state ('received' -> 'processing' -> 'processed' / 'failed' / 'ignored').
 * - Handles out-of-order events gracefully.
 * - Preserves soft-delete semantics for user.deleted per Veyra architecture specification.
 */
export async function POST(req: NextRequest) {
  // Step 1: Verify webhook signature
  let evt: WebhookEvent
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET

  try {
    if (signingSecret) {
      evt = await verifyWebhook(req, { signingSecret })
    } else {
      evt = await verifyWebhook(req)
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown verification error"
    console.error("[Clerk Webhook] Signature verification failed:", errorMsg)
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    )
  }

  // Step 2: Determine provider event ID for idempotency deduplication
  const svixId =
    req.headers.get("svix-id") ||
    (evt as unknown as { id?: string }).id ||
    `${evt.type}_${(evt.data as { id?: string })?.id || Date.now()}`

  const supabase = createServiceClient()

  // Step 3: Check for existing event in webhook_events (Deduplication)
  try {
    const { data: existingEvent, error: dedupError } = await supabase
      .from("webhook_events")
      .select("id, status")
      .eq("provider", "clerk")
      .eq("provider_event_id", svixId)
      .maybeSingle()

    if (!dedupError && existingEvent) {
      if (existingEvent.status === "processed" || existingEvent.status === "processing") {
        return NextResponse.json(
          { received: true, deduplicated: true, status: existingEvent.status },
          { status: 200 }
        )
      }
    }
  } catch (dedupCheckErr) {
    console.warn("[Clerk Webhook] Deduplication check encountered error, continuing:", dedupCheckErr)
  }

  // Step 4: Persist event in webhook_events
  let webhookRecordId: string | null = null
  try {
    const { data: savedEvent, error: persistError } = await supabase
      .from("webhook_events")
      .upsert(
        {
          provider: "clerk",
          provider_event_id: svixId,
          event_type: evt.type,
          payload: evt as unknown as Json,
          status: "processing",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider,provider_event_id" }
      )
      .select("id")
      .single()

    if (persistError) {
      console.error("[Clerk Webhook] Failed to persist event to webhook_events:", persistError.message)
      // Return 500 if initial persistence fails so Svix will retry delivery
      return NextResponse.json(
        { error: "Failed to persist event" },
        { status: 500 }
      )
    }

    webhookRecordId = savedEvent?.id || null
  } catch (persistErr) {
    console.error("[Clerk Webhook] Error saving to webhook_events:", persistErr)
    return NextResponse.json(
      { error: "Database error persisting event" },
      { status: 500 }
    )
  }

  // Step 5: Process event payload according to event_type
  try {
    switch (evt.type) {
      case "user.created": {
        const userData = evt.data
        const clerkId = userData.id
        const { email, emailVerified } = extractUserEmail(userData)
        const { phone, phoneVerified } = extractUserPhone(userData)

        const rawUserType =
          (userData.public_metadata?.user_type as string) ||
          (userData.public_metadata?.role as string) ||
          "customer"
        const userType = rawUserType === "staff" ? "staff" : "customer"

        const firstName =
          userData.first_name?.trim() ||
          (email ? email.split("@")[0] : "Customer")
        const lastName = userData.last_name?.trim() || ""

        // Idempotent upsert into public.users
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, clerk_id, email, user_type")
          .or(`clerk_id.eq.${clerkId},email.eq.${email}`)
          .maybeSingle()

        let userId: string

        if (existingUser) {
          userId = existingUser.id
          const { error: updateError } = await supabase
            .from("users")
            .update({
              clerk_id: clerkId,
              email: email || existingUser.email,
              email_verified: emailVerified,
              status: "active",
              deleted_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (updateError) throw updateError
        } else {
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              clerk_id: clerkId,
              email,
              email_verified: emailVerified,
              user_type: userType,
              status: "active",
            })
            .select("id")
            .single()

          if (insertError) throw insertError
          userId = newUser.id
        }

        // If customer, ensure public.customers profile exists
        if (userType === "customer") {
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle()

          if (!existingCustomer) {
            const membershipNumber = generateMembershipNumber()
            const { error: customerError } = await supabase
              .from("customers")
              .insert({
                user_id: userId,
                first_name: firstName,
                last_name: lastName,
                phone: phone || null,
                phone_verified: phoneVerified,
                membership_number: membershipNumber,
                membership_tier: "standard",
                verification_status: "unverified",
              })

            if (customerError) throw customerError
          }
        }
        break
      }

      case "user.updated": {
        const userData = evt.data
        const clerkId = userData.id
        const { email, emailVerified } = extractUserEmail(userData)
        const { phone, phoneVerified } = extractUserPhone(userData)

        const firstName = userData.first_name?.trim()
        const lastName = userData.last_name?.trim()

        const { data: existingUser } = await supabase
          .from("users")
          .select("id, email, user_type")
          .eq("clerk_id", clerkId)
          .maybeSingle()

        if (existingUser) {
          // Update core user record
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({
              email: email || existingUser.email,
              email_verified: emailVerified,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingUser.id)

          if (userUpdateError) throw userUpdateError

          // If customer, update customer profile details
          if (existingUser.user_type === "customer") {
            const customerUpdates: CustomerUpdate = {
              updated_at: new Date().toISOString(),
            }
            if (firstName !== undefined && firstName !== "") customerUpdates.first_name = firstName
            if (lastName !== undefined) customerUpdates.last_name = lastName
            if (phone !== null) {
              customerUpdates.phone = phone
              customerUpdates.phone_verified = phoneVerified
            }

            const { error: customerUpdateError } = await supabase
              .from("customers")
              .update(customerUpdates)
              .eq("user_id", existingUser.id)

            if (customerUpdateError) {
              console.warn(
                "[Clerk Webhook] Warning updating customer row:",
                customerUpdateError.message
              )
            }
          }
        } else {
          // Fallback: If user was not found on update (e.g. out of order delivery), trigger creation
          const rawUserType =
            (userData.public_metadata?.user_type as string) ||
            (userData.public_metadata?.role as string) ||
            "customer"
          const userType = rawUserType === "staff" ? "staff" : "customer"

          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              clerk_id: clerkId,
              email,
              email_verified: emailVerified,
              user_type: userType,
              status: "active",
            })
            .select("id")
            .single()

          if (insertError) throw insertError

          if (userType === "customer") {
            const membershipNumber = generateMembershipNumber()
            const { error: custError } = await supabase
              .from("customers")
              .insert({
                user_id: newUser.id,
                first_name: firstName || (email ? email.split("@")[0] : "Customer"),
                last_name: lastName || "",
                phone: phone,
                phone_verified: phoneVerified,
                membership_number: membershipNumber,
                membership_tier: "standard",
                verification_status: "unverified",
              })

            if (custError) throw custError
          }
        }
        break
      }

      case "user.deleted": {
        const deletedData = evt.data
        const clerkId = deletedData.id

        if (!clerkId) {
          console.warn("[Clerk Webhook] user.deleted event received without ID")
          break
        }

        const now = new Date().toISOString()

        // Soft-delete user per Veyra architecture specification.
        // We do NOT delete the customers or reservations records to preserve historical integrity.
        const { error: deleteError } = await supabase
          .from("users")
          .update({
            status: "deleted",
            deleted_at: now,
            updated_at: now,
          })
          .eq("clerk_id", clerkId)

        if (deleteError) throw deleteError
        break
      }

      default: {
        // Any other lifecycle event we aren't handling is acknowledged as ignored
        if (webhookRecordId) {
          await supabase
            .from("webhook_events")
            .update({
              status: "ignored",
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", webhookRecordId)
        }

        return NextResponse.json(
          { received: true, status: "ignored", event: (evt as { type?: string }).type },
          { status: 200 }
        )
      }
    }

    // Step 6: Mark webhook_events record as 'processed'
    if (webhookRecordId) {
      await supabase
        .from("webhook_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", webhookRecordId)
    }

    return NextResponse.json(
      { received: true, status: "processed", event: evt.type },
      { status: 200 }
    )
  } catch (processingErr) {
    const errorMsg =
      processingErr instanceof Error ? processingErr.message : "Internal processing error"
    console.error(`[Clerk Webhook] Error processing event:`, errorMsg)

    // Update webhook_events to 'failed' with failure reason
    if (webhookRecordId) {
      await supabase
        .from("webhook_events")
        .update({
          status: "failed",
          failure_reason: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", webhookRecordId)
    }

    // Per Veyra webhook architecture: once an event is safely persisted,
    // return 200 so retry storms do not occur, while background worker/cron can retry failed events.
    return NextResponse.json(
      { received: true, status: "failed", error: errorMsg },
      { status: 200 }
    )
  }
}
