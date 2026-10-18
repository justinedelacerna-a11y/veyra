import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createServiceClient } from "@/lib/supabase/server"
import { createHash } from "crypto"

/**
 * POST /api/terms
 *
 * Records a customer's acceptance of the current Terms of Service version.
 *
 * Security:
 * - Customer must be authenticated via Clerk.
 * - Customer ID is resolved server-side from the Clerk session.
 * - Terms version is always fetched from the database — never trusted from client.
 * - IP address is hashed (SHA-256) before storage; raw IP is never stored.
 * - reservationId is optional and validated if provided.
 * - Idempotent: repeated acceptance of same version for same reservation is a no-op.
 *
 * GET /api/terms
 *
 * Returns the current Terms of Service version metadata.
 * Public endpoint — no authentication required.
 */

export async function POST(request: NextRequest) {
  try {
    const authState = await auth()
    const clerkUserId = authState.userId

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "unauthorized", message: "Authentication required." },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { reservationId } = body as { reservationId?: string }

    const supabase = createServiceClient()

    // 1. Resolve customer from Clerk session
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "customer_not_found", message: "Customer record not found." },
        { status: 404 }
      )
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "customer_not_found", message: "Customer profile not found." },
        { status: 404 }
      )
    }

    // 2. Fetch current terms version from DB — never trust client-supplied version
    const { data: currentVersion } = await supabase
      .from("terms_versions")
      .select("id, version")
      .eq("is_current", true)
      .single()

    if (!currentVersion) {
      return NextResponse.json(
        { success: false, error: "no_current_version", message: "No current Terms of Service version found." },
        { status: 500 }
      )
    }

    // 3. Validate reservationId if provided — must belong to this customer
    if (reservationId) {
      const { data: reservation } = await supabase
        .from("reservations")
        .select("id, customer_id")
        .eq("id", reservationId)
        .single()

      if (!reservation) {
        return NextResponse.json(
          { success: false, error: "reservation_not_found", message: "Reservation not found." },
          { status: 404 }
        )
      }

      if (reservation.customer_id !== customer.id) {
        return NextResponse.json(
          { success: false, error: "forbidden", message: "Reservation does not belong to this customer." },
          { status: 403 }
        )
      }
    }

    // 4. Hash the IP address — never store raw IP
    const rawIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    const ipHash = createHash("sha256").update(rawIp).digest("hex")

    // 5. Record acceptance (idempotent via unique constraint)
    const { error: insertErr } = await supabase
      .from("terms_acceptances")
      .insert({
        customer_id: customer.id,
        terms_version_id: currentVersion.id,
        reservation_id: reservationId ?? null,
        ip_hash: ipHash,
        accepted_at: new Date().toISOString(),
      })

    // Ignore unique constraint violations (already accepted)
    if (insertErr && !insertErr.message?.includes("duplicate") && !insertErr.code?.includes("23505")) {
      console.error("[api/terms] insert error:", insertErr.message)
      return NextResponse.json(
        { success: false, error: "database_error", message: "Failed to record acceptance." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      termsVersion: currentVersion.version,
      acceptedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[api/terms] unexpected error:", err)
    return NextResponse.json(
      { success: false, error: "internal_error", message: "Unexpected error." },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data: version } = await supabase
      .from("terms_versions")
      .select("id, version, published_at, summary")
      .eq("is_current", true)
      .single()

    return NextResponse.json({
      success: true,
      currentVersion: version ?? { version: "v1.0", published_at: new Date().toISOString() },
    })
  } catch {
    return NextResponse.json({ success: false, error: "database_error" }, { status: 500 })
  }
}
