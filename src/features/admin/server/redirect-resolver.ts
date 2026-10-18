import "server-only"
import type { StaffRole } from "@/features/admin/types"
import type { StaffAuthStatus } from "@/features/admin/server/admin-auth"

/**
 * Maps each staff role to its authoritative landing page.
 * Superadmin and Admin land on the main /admin operations overview.
 * Specialized staff roles land on their primary operational domain.
 */
export function getStaffLandingPage(role: StaffRole): string {
  switch (role) {
    case "superadmin":
    case "admin":
    case "branch_manager":
      return "/admin"
    case "fleet_manager":
      return "/admin/fleet"
    case "finance":
      return "/admin/payments"
    case "support":
    case "branch_staff":
    default:
      return "/admin/reservations"
  }
}

/**
 * Validates whether a specific staff role has permission to access a target admin route.
 */
export function canStaffAccessRoute(role: StaffRole, pathname: string): boolean {
  const normalized = pathname.split("?")[0].split("#")[0].toLowerCase()

  // Superadmin and Admin have unrestricted access to all admin modules
  if (role === "superadmin" || role === "admin") {
    return true
  }

  // Common modules all active staff can view
  if (
    normalized === "/admin" ||
    normalized === "/admin/notifications"
  ) {
    return true
  }

  switch (role) {
    case "fleet_manager":
      return (
        normalized.startsWith("/admin/fleet") ||
        normalized.startsWith("/admin/maintenance") ||
        normalized.startsWith("/admin/inspections") ||
        normalized.startsWith("/admin/reports")
      )
    case "branch_manager":
      return (
        normalized.startsWith("/admin/reservations") ||
        normalized.startsWith("/admin/fleet") ||
        normalized.startsWith("/admin/maintenance") ||
        normalized.startsWith("/admin/inspections") ||
        normalized.startsWith("/admin/customers") ||
        normalized.startsWith("/admin/reports") ||
        normalized.startsWith("/admin/payments")
      )
    case "finance":
      return (
        normalized.startsWith("/admin/payments") ||
        normalized.startsWith("/admin/reports")
      )
    case "support":
      return (
        normalized.startsWith("/admin/reservations") ||
        normalized.startsWith("/admin/customers") ||
        normalized.startsWith("/admin/payments")
      )
    case "branch_staff":
      return (
        normalized.startsWith("/admin/reservations") ||
        normalized.startsWith("/admin/fleet") ||
        normalized.startsWith("/admin/inspections") ||
        normalized.startsWith("/admin/customers")
      )
    default:
      return false
  }
}

/**
 * Validates and sanitizes a return URL.
 *
 * Security Guarantees:
 * 1. Blocks external redirect attempts (open redirects): http://, https://, //, /\, etc.
 * 2. Blocks dangerous schemes (javascript:, data:, vbscript:).
 * 3. Prevents infinite redirect loops back to auth pages (/sign-in, /sign-up, /auth/redirect).
 * 4. Strictly forbids customers from redirecting to /admin paths.
 */
export function sanitizeReturnUrl(
  url: string | null | undefined,
  isStaff: boolean
): string | null {
  if (!url || typeof url !== "string") return null

  const trimmed = url.trim()
  if (!trimmed) return null

  // Must be a relative path starting with '/'
  // Explicitly reject protocol-relative (//) or backslash (\, /\) bypasses
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null
  }

  // Reject URLs containing backslashes or ASCII control characters
  if (trimmed.includes("\\") || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    return null
  }

  // Extract path without query parameters or hash for path-based validation
  const pathOnly = trimmed.split("?")[0].split("#")[0].toLowerCase()

  // Prevent redirect loops back to authentication pages
  if (
    pathOnly === "/sign-in" ||
    pathOnly.startsWith("/sign-in/") ||
    pathOnly === "/sign-up" ||
    pathOnly.startsWith("/sign-up/") ||
    pathOnly === "/auth/redirect" ||
    pathOnly.startsWith("/auth/redirect/")
  ) {
    return null
  }

  const isAdminTarget = pathOnly === "/admin" || pathOnly.startsWith("/admin/")

  // Customers must NEVER be redirected to admin paths!
  if (isAdminTarget && !isStaff) {
    return null
  }

  return trimmed
}

export interface ResolveRedirectInput {
  staffStatus: StaffAuthStatus
  returnUrl?: string | null
}

/**
 * Determines the authoritative post-login redirect destination.
 *
 * Rules:
 * - Unauthenticated -> /sign-in
 * - Admin / Superadmin -> requested safe admin/customer URL or /admin
 * - Authorized Staff -> requested permitted admin/customer URL or staff landing page
 * - Customer -> requested safe customer URL (booking, account, etc.) or /account
 * - Customers requesting /admin -> blocked from /admin, redirected to /account
 * - External URLs -> blocked, falls back to role default
 */
export function resolvePostLoginRedirect({
  staffStatus,
  returnUrl,
}: ResolveRedirectInput): string {
  if (staffStatus.state === "unauthenticated") {
    return "/sign-in"
  }

  const isStaff = staffStatus.state === "authorized"
  const sanitizedUrl = sanitizeReturnUrl(returnUrl, isStaff)

  if (isStaff) {
    const { role } = staffStatus.context
    const defaultLanding = getStaffLandingPage(role)

    if (sanitizedUrl) {
      const pathOnly = sanitizedUrl.split("?")[0].split("#")[0].toLowerCase()
      const isAdminPath = pathOnly === "/admin" || pathOnly.startsWith("/admin/")

      if (isAdminPath) {
        // Verify staff member has permission for this specific admin module
        if (canStaffAccessRoute(role, pathOnly)) {
          return sanitizedUrl
        }
        return defaultLanding
      }

      // Staff/admins visiting customer-facing pages (e.g. /vehicles, /booking)
      // Allowed so admins are not forced off customer pages
      if (sanitizedUrl !== "/") {
        return sanitizedUrl
      }

      // If returnUrl was explicitly "/" or empty, staff should land on admin
      return defaultLanding
    }

    return defaultLanding
  }

  // Customer or unauthorized non-staff user
  // If a safe customer return URL was provided (e.g. /booking/options, /account/documents, /vehicles)
  if (sanitizedUrl) {
    const pathOnly = sanitizedUrl.split("?")[0].split("#")[0].toLowerCase()
    const isAdminPath = pathOnly === "/admin" || pathOnly.startsWith("/admin/")

    // Defensive check: ensure no customer reaches an admin destination
    if (!isAdminPath && sanitizedUrl !== "/") {
      return sanitizedUrl
    }
  }

  // Default customer landing page
  return "/account"
}
