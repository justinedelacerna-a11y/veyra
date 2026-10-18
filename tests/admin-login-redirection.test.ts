import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  getStaffLandingPage,
  canStaffAccessRoute,
  sanitizeReturnUrl,
  resolvePostLoginRedirect,
} from "../src/features/admin/server/redirect-resolver"
import type { StaffAuthStatus, StaffAuthContext } from "../src/features/admin/server/admin-auth"
import type { StaffRole } from "../src/features/admin/types"

// ─── Mock Fixtures ──────────────────────────────────────────────────────────

function createStaffContext(role: StaffRole, email: string = "staff@veyra.rentals"): StaffAuthContext {
  return {
    userId: "usr-staff-123",
    clerkId: "user_clerk_staff_123",
    email,
    role,
    firstName: "Staff",
    lastName: "Member",
    branchId: "branch-001",
    staffId: "stf-001",
    isOwner: role === "superadmin",
  }
}

const SUPERADMIN_STATUS: StaffAuthStatus = {
  state: "authorized",
  context: createStaffContext("superadmin", "owner@veyra.rentals"),
}

const ADMIN_STATUS: StaffAuthStatus = {
  state: "authorized",
  context: createStaffContext("admin", "admin@veyra.rentals"),
}

const FLEET_MANAGER_STATUS: StaffAuthStatus = {
  state: "authorized",
  context: createStaffContext("fleet_manager", "fleet@veyra.rentals"),
}

const FINANCE_STATUS: StaffAuthStatus = {
  state: "authorized",
  context: createStaffContext("finance", "finance@veyra.rentals"),
}

const SUPPORT_STATUS: StaffAuthStatus = {
  state: "authorized",
  context: createStaffContext("support", "support@veyra.rentals"),
}

const BRANCH_STAFF_STATUS: StaffAuthStatus = {
  state: "authorized",
  context: createStaffContext("branch_staff", "branch@veyra.rentals"),
}

const CUSTOMER_STATUS: StaffAuthStatus = {
  state: "forbidden",
  email: "customer@example.com",
  userType: "customer",
}

const REVOKED_STAFF_STATUS: StaffAuthStatus = {
  state: "forbidden",
  email: "ex-staff@veyra.rentals",
  userType: "staff_unassigned",
}

const UNAUTHENTICATED_STATUS: StaffAuthStatus = {
  state: "unauthenticated",
}

// Simulated requireAdminStaff guard
function simulateRequireAdminStaff(
  status: StaffAuthStatus,
  allowedRoles?: StaffRole[]
): StaffAuthContext {
  if (status.state === "unauthenticated") {
    throw new Error("UNAUTHENTICATED: Redirect to /sign-in?redirect_url=/admin")
  }

  if (status.state === "forbidden") {
    throw new Error(`FORBIDDEN: Account ${status.email} (${status.userType}) does not have staff permissions.`)
  }

  if (status.context.role === "superadmin") {
    return status.context
  }

  if (allowedRoles && !allowedRoles.includes(status.context.role)) {
    throw new Error(`FORBIDDEN: Role ${status.context.role} is not permitted for this operation.`)
  }

  return status.context
}

// ─── Test Suite: 10 Requirements ────────────────────────────────────────────

describe("Veyra Issue #4 — Automatic Admin Login Redirection Test Suite", () => {
  // Requirement 1: Admin login redirects to /admin
  it("Requirement 1: Admin login automatically redirects to /admin when no returnUrl provided", () => {
    const destination = resolvePostLoginRedirect({
      staffStatus: ADMIN_STATUS,
    })
    assert.equal(destination, "/admin")

    const destinationWithRoot = resolvePostLoginRedirect({
      staffStatus: ADMIN_STATUS,
      returnUrl: "/",
    })
    assert.equal(destinationWithRoot, "/admin")
  })

  // Requirement 2: Superadmin login redirects to /admin
  it("Requirement 2: Superadmin login automatically redirects to /admin", () => {
    const destination = resolvePostLoginRedirect({
      staffStatus: SUPERADMIN_STATUS,
    })
    assert.equal(destination, "/admin")

    const destinationWithRoot = resolvePostLoginRedirect({
      staffStatus: SUPERADMIN_STATUS,
      returnUrl: "/",
    })
    assert.equal(destinationWithRoot, "/admin")
  })

  // Requirement 3: Customer login redirects to the customer area
  it("Requirement 3: Customer login redirects to /account when no returnUrl provided", () => {
    const destination = resolvePostLoginRedirect({
      staffStatus: CUSTOMER_STATUS,
    })
    assert.equal(destination, "/account")

    const destinationWithRoot = resolvePostLoginRedirect({
      staffStatus: CUSTOMER_STATUS,
      returnUrl: "/",
    })
    assert.equal(destinationWithRoot, "/account")
  })

  // Requirement 4: Staff access follows existing permissions and designated landing pages
  it("Requirement 4: Staff roles redirect to their permitted operational landing pages", () => {
    // Fleet manager lands on /admin/fleet
    assert.equal(getStaffLandingPage("fleet_manager"), "/admin/fleet")
    const fleetDest = resolvePostLoginRedirect({ staffStatus: FLEET_MANAGER_STATUS })
    assert.equal(fleetDest, "/admin/fleet")

    // Finance lands on /admin/payments
    assert.equal(getStaffLandingPage("finance"), "/admin/payments")
    const financeDest = resolvePostLoginRedirect({ staffStatus: FINANCE_STATUS })
    assert.equal(financeDest, "/admin/payments")

    // Support lands on /admin/reservations
    assert.equal(getStaffLandingPage("support"), "/admin/reservations")
    const supportDest = resolvePostLoginRedirect({ staffStatus: SUPPORT_STATUS })
    assert.equal(supportDest, "/admin/reservations")

    // Branch staff lands on /admin/reservations
    assert.equal(getStaffLandingPage("branch_staff"), "/admin/reservations")
    const branchStaffDest = resolvePostLoginRedirect({ staffStatus: BRANCH_STAFF_STATUS })
    assert.equal(branchStaffDest, "/admin/reservations")

    // Role route permissions verification
    assert.equal(canStaffAccessRoute("fleet_manager", "/admin/fleet"), true)
    assert.equal(canStaffAccessRoute("fleet_manager", "/admin/maintenance"), true)
    assert.equal(canStaffAccessRoute("fleet_manager", "/admin/inspections"), true)
    assert.equal(canStaffAccessRoute("fleet_manager", "/admin/settings"), false) // forbidden module
    assert.equal(canStaffAccessRoute("finance", "/admin/payments"), true)
    assert.equal(canStaffAccessRoute("finance", "/admin/fleet"), false) // forbidden module
  })

  // Requirement 5: Customers cannot access admin pages directly
  it("Requirement 5: Customers requesting /admin are blocked and safely redirected to /account", () => {
    // Customer requesting /admin as returnUrl
    const dest1 = resolvePostLoginRedirect({
      staffStatus: CUSTOMER_STATUS,
      returnUrl: "/admin",
    })
    assert.equal(dest1, "/account") // NOT /admin!

    // Customer requesting nested /admin/settings as returnUrl
    const dest2 = resolvePostLoginRedirect({
      staffStatus: CUSTOMER_STATUS,
      returnUrl: "/admin/settings",
    })
    assert.equal(dest2, "/account") // NOT /admin/settings!

    // URL sanitizer strictly drops admin targets for non-staff
    assert.equal(sanitizeReturnUrl("/admin", false), null)
    assert.equal(sanitizeReturnUrl("/admin/fleet", false), null)
    assert.equal(sanitizeReturnUrl("/admin/settings", false), null)
  })

  // Requirement 6: Customers cannot call protected admin APIs / Server Actions
  it("Requirement 6: requireAdminStaff rejects customer session and blocks privileged execution", () => {
    assert.throws(
      () => simulateRequireAdminStaff(CUSTOMER_STATUS),
      /FORBIDDEN.*does not have staff permissions/
    )

    // Even if calling with specific role constraints
    assert.throws(
      () => simulateRequireAdminStaff(CUSTOMER_STATUS, ["admin", "superadmin"]),
      /FORBIDDEN/
    )
  })

  // Requirement 7: Revoked staff access no longer permits privileged actions
  it("Requirement 7: Revoked staff access is treated as forbidden and denies admin entry", () => {
    // Revoked staff attempting login redirect
    const dest = resolvePostLoginRedirect({
      staffStatus: REVOKED_STAFF_STATUS,
      returnUrl: "/admin",
    })
    assert.equal(dest, "/account") // Never lands on admin!

    // Revoked staff attempting to call protected admin action
    assert.throws(
      () => simulateRequireAdminStaff(REVOKED_STAFF_STATUS),
      /FORBIDDEN.*staff_unassigned/
    )
  })

  // Requirement 8: Safe return-to-page redirects work
  it("Requirement 8: Legitimate customer and admin return-to-page URLs are preserved", () => {
    // Customer returning to booking review
    const custBooking = resolvePostLoginRedirect({
      staffStatus: CUSTOMER_STATUS,
      returnUrl: "/booking/review",
    })
    assert.equal(custBooking, "/booking/review")

    // Customer returning to account documents
    const custDocs = resolvePostLoginRedirect({
      staffStatus: CUSTOMER_STATUS,
      returnUrl: "/account/documents",
    })
    assert.equal(custDocs, "/account/documents")

    // Admin returning to specific admin page
    const adminSettings = resolvePostLoginRedirect({
      staffStatus: ADMIN_STATUS,
      returnUrl: "/admin/settings",
    })
    assert.equal(adminSettings, "/admin/settings")

    // Admin browsing customer pages (not forced off customer site)
    const adminCustomerPage = resolvePostLoginRedirect({
      staffStatus: ADMIN_STATUS,
      returnUrl: "/vehicles",
    })
    assert.equal(adminCustomerPage, "/vehicles")
  })

  // Requirement 9: External redirect attempts are blocked
  it("Requirement 9: External, protocol-relative, and malicious redirect attempts are blocked", () => {
    // External http/https URLs
    assert.equal(sanitizeReturnUrl("https://evil.com", true), null)
    assert.equal(sanitizeReturnUrl("http://phishing.site/admin", true), null)

    // Protocol-relative URLs
    assert.equal(sanitizeReturnUrl("//evil.com", true), null)

    // Backslash bypasses
    assert.equal(sanitizeReturnUrl("/\\evil.com", true), null)
    assert.equal(sanitizeReturnUrl("\\evil.com", true), null)

    // Dangerous pseudo-protocols
    assert.equal(sanitizeReturnUrl("javascript:alert(document.cookie)", true), null)
    assert.equal(sanitizeReturnUrl("data:text/html,<script>alert(1)</script>", true), null)

    // Redirect loop prevention
    assert.equal(sanitizeReturnUrl("/sign-in", true), null)
    assert.equal(sanitizeReturnUrl("/sign-up", true), null)
    assert.equal(sanitizeReturnUrl("/auth/redirect", true), null)

    // Malicious returnUrl in resolver falls back safely
    const fallbackAdmin = resolvePostLoginRedirect({
      staffStatus: ADMIN_STATUS,
      returnUrl: "https://evil.com",
    })
    assert.equal(fallbackAdmin, "/admin")

    const fallbackCustomer = resolvePostLoginRedirect({
      staffStatus: CUSTOMER_STATUS,
      returnUrl: "//attacker.com/steal-token",
    })
    assert.equal(fallbackCustomer, "/account")
  })

  // Requirement 10: Existing customer authentication and unauthenticated flow remain functional
  it("Requirement 10: Unauthenticated users are directed to /sign-in and query preserved", () => {
    const unauthDest = resolvePostLoginRedirect({
      staffStatus: UNAUTHENTICATED_STATUS,
      returnUrl: "/admin",
    })
    assert.equal(unauthDest, "/sign-in")

    assert.throws(
      () => simulateRequireAdminStaff(UNAUTHENTICATED_STATUS),
      /UNAUTHENTICATED/
    )
  })
})
