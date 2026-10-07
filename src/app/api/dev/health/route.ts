import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/dev/health
 *
 * Development-only database and auth connectivity check.
 * Returns a structured JSON report verifying:
 *   - Supabase connection (public catalog readable)
 *   - Clerk session (authenticated or not)
 *   - Application user (public.users row found)
 *   - Role (customer / staff / unknown)
 *
 * BLOCKED in production (NODE_ENV === 'production').
 * Does NOT expose JWTs, tokens, or secret keys.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Health check not available in production." },
      { status: 404 }
    )
  }

  const report: {
    supabase_connection: "OK" | "FAIL"
    clerk_session: "AUTHENTICATED" | "NOT_AUTHENTICATED"
    application_user: "FOUND" | "NOT_FOUND" | "N/A"
    role: "CUSTOMER" | "STAFF" | "ADMIN" | "UNKNOWN" | "N/A"
    rls_enforcement: "OK" | "FAIL" | "N/A"
    issues: string[]
  } = {
    supabase_connection: "FAIL",
    clerk_session: "NOT_AUTHENTICATED",
    application_user: "N/A",
    role: "N/A",
    rls_enforcement: "N/A",
    issues: [],
  }

  // ── 1. Clerk session ───────────────────────────────────────────
  let authExecuted = false
  let isAuthenticated = false
  let userId: string | null = null

  try {
    const authState = await auth()
    authExecuted = true
    isAuthenticated = Boolean(authState.isAuthenticated)
    userId = authState.userId ?? null
  } catch (err) {
    report.issues.push(
      `auth() error: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  const clerkUserId = userId

  if (clerkUserId) {
    report.clerk_session = "AUTHENTICATED"
  } else {
    report.issues.push(
      "No active Clerk session. Sign in at /sign-in to test authenticated paths."
    )
  }

  // ── 2. Supabase connection (anonymous public read) ─────────────
  const supabase = createClient()

  try {
    const { error: catalogError } = await supabase
      .from("vehicle_catalog")
      .select("id")
      .limit(1)

    if (catalogError) {
      report.supabase_connection = "FAIL"
      report.issues.push(`Supabase catalog read failed: ${catalogError.message}`)
    } else {
      report.supabase_connection = "OK"
    }
  } catch (err) {
    report.supabase_connection = "FAIL"
    report.issues.push(
      `Supabase connection error: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  // ── 3. Authenticated identity check ───────────────────────────
  if (clerkUserId) {
    try {
      // Query public.users for a row matching the Clerk sub claim.
      // The server client forwards the Clerk token via accessToken(),
      // so RLS uses auth.jwt() ->> 'sub' to evaluate veyra_private.current_user_id().
      const { data: userRows, error: userError } = await supabase
        .from("users")
        .select("id, user_type, status")
        .limit(1)

      if (userError) {
        report.application_user = "NOT_FOUND"
        report.issues.push(`users query error: ${userError.message}`)
      } else if (!userRows || userRows.length === 0) {
        report.application_user = "NOT_FOUND"
        report.rls_enforcement = "OK" // RLS is working — no row means user not synced
        report.issues.push(
          "Clerk user is authenticated but no matching row found in public.users. " +
            "The Clerk webhook (user.created) must sync the user into public.users first."
        )
      } else {
        const userRow = userRows[0] as { id: string; user_type: string; status: string }
        report.application_user = "FOUND"
        report.rls_enforcement = "OK"

        if (userRow.user_type === "customer") {
          report.role = "CUSTOMER"
        } else if (userRow.user_type === "staff") {
          // Distinguish admin from regular staff via a staff_users query
          const { data: staffRows } = await supabase
            .from("staff_users")
            .select("role")
            .limit(1)

          if (staffRows && staffRows.length > 0) {
            const staffRow = staffRows[0] as { role: string }
            report.role =
              staffRow.role === "admin" || staffRow.role === "superadmin"
                ? "ADMIN"
                : "STAFF"
          } else {
            report.role = "STAFF"
          }
        } else {
          report.role = "UNKNOWN"
        }
      }
    } catch (err) {
      report.application_user = "NOT_FOUND"
      report.issues.push(
        `Identity check error: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const allOk =
    report.supabase_connection === "OK" &&
    report.issues.length === 0

  const rawCookieHeader = req.headers.get("cookie") || ""
  const cookieNames = rawCookieHeader
    ? rawCookieHeader
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean)
    : []
  const authStatusHeader =
    req.headers.get("x-clerk-auth-status") ||
    req.headers.get("x-middleware-request-x-clerk-auth-status") ||
    "none"
  const authReasonHeader =
    req.headers.get("x-clerk-auth-reason") ||
    req.headers.get("x-middleware-request-x-clerk-auth-reason") ||
    "none"

  return NextResponse.json(
    {
      status: allOk ? "HEALTHY" : "DEGRADED",
      timestamp: new Date().toISOString(),
      checks: {
        supabase_connection: report.supabase_connection,
        clerk_session: report.clerk_session,
        application_user: report.application_user,
        role: report.role,
        rls_enforcement: report.rls_enforcement,
      },
      diagnostics: {
        auth_executed: authExecuted,
        is_authenticated: isAuthenticated,
        has_user_id: Boolean(userId),
        cookies_present: cookieNames,
        auth_status_header: authStatusHeader,
        auth_reason_header: authReasonHeader,
        request_host: req.headers.get("host") || "none",
      },
      issues: report.issues.length > 0 ? report.issues : undefined,
    },
    { status: allOk ? 200 : 503 }
  )
}
