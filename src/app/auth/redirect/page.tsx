import { redirect } from "next/navigation"
import { getAdminStaffStatus } from "@/features/admin/server/admin-auth"
import { resolvePostLoginRedirect } from "@/features/admin/server/redirect-resolver"

/**
 * POST-SIGN-IN REDIRECT — /auth/redirect
 *
 * This Server Component runs immediately after sign-in and sign-up.
 * It determines the authentic user role strictly on the server:
 *
 *   - superadmin / admin  →  /admin (or requested safe returnUrl)
 *   - authorized staff    →  role landing page (or requested permitted admin/customer returnUrl)
 *   - customers           →  /account (or requested safe customer returnUrl)
 *   - unauthenticated     →  /sign-in
 *
 * Security guarantees:
 * - Role is verified against public.staff_users via Clerk session.
 * - Never trusts client-side role claims, localStorage, or query parameters.
 * - Customers requesting /admin are strictly blocked from /admin and sent to /account.
 * - External / open redirect URLs are rejected.
 * - Prevents infinite redirect loops between login and dashboard.
 */

interface Props {
  searchParams: Promise<{
    returnUrl?: string
    redirect_url?: string
  }>
}

export default async function AuthRedirectPage({ searchParams }: Props) {
  const params = await searchParams
  const returnUrl = params.returnUrl || params.redirect_url

  const staffStatus = await getAdminStaffStatus()

  const destination = resolvePostLoginRedirect({
    staffStatus,
    returnUrl,
  })

  redirect(destination)
}
