import "server-only"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import type { StaffRole } from "@/features/admin/types"

export interface StaffAuthContext {
  userId: string
  clerkId: string
  email: string
  role: StaffRole
  firstName: string
  lastName: string
  branchId: string | null
  staffId: string
  isOwner?: boolean
}

export type StaffAuthStatus =
  | { state: "unauthenticated" }
  | { state: "forbidden"; email: string; userType: string }
  | { state: "authorized"; context: StaffAuthContext }

/**
 * Validates the currently authenticated Clerk user against the Supabase
 * users and staff_users tables.
 *
 * Rules:
 * - Unauthenticated -> returns { state: "unauthenticated" }
 * - Authenticated with email matching VEYRA_OWNER_EMAIL -> verified on server,
 *   auto-provisioned/elevated in Supabase, returns { state: "authorized", role: "superadmin" }
 * - Authenticated as 'customer' -> returns { state: "forbidden" }
 * - Authenticated with active staff_users record -> returns { state: "authorized", context }
 */
export async function getAdminStaffStatus(): Promise<StaffAuthStatus> {
  const { userId } = await auth()
  if (!userId) {
    return { state: "unauthenticated" }
  }

  // 1. Fetch verified Clerk user email
  const clerkUser = await currentUser()
  const clerkEmail =
    clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    ""

  const ownerEmail = process.env.VEYRA_OWNER_EMAIL?.trim().toLowerCase()
  const isOwner = Boolean(ownerEmail && clerkEmail && clerkEmail.toLowerCase() === ownerEmail)

  // 2. Dedicated Owner / Super Admin Authorization System
  if (isOwner) {
    try {
      const serviceClient = createServiceClient()

      // Fetch or auto-provision the Owner in public.users
      const { data: existingUser } = await serviceClient
        .from("users")
        .select("id, email, clerk_id, user_type, status")
        .or(`clerk_id.eq.${userId},email.eq.${clerkEmail}`)
        .limit(1)
        .maybeSingle()

      let internalUserId = existingUser?.id

      if (!existingUser) {
        const { data: newUser, error: createErr } = await serviceClient
          .from("users")
          .insert({
            clerk_id: userId,
            email: clerkEmail,
            user_type: "staff",
            status: "active",
            email_verified: true,
          })
          .select("id")
          .single()

        if (!createErr && newUser) {
          internalUserId = newUser.id
        }
      } else if (
        existingUser.user_type !== "staff" ||
        existingUser.status !== "active" ||
        existingUser.clerk_id !== userId
      ) {
        await serviceClient
          .from("users")
          .update({
            clerk_id: userId,
            user_type: "staff",
            status: "active",
          })
          .eq("id", existingUser.id)
      }

      if (internalUserId) {
        // Fetch or provision Owner profile in staff_users
        const { data: existingStaff } = await serviceClient
          .from("staff_users")
          .select("id, role, status")
          .eq("user_id", internalUserId)
          .limit(1)
          .maybeSingle()

        let staffId = existingStaff?.id

        if (!existingStaff) {
          const { data: newStaff, error: staffErr } = await serviceClient
            .from("staff_users")
            .insert({
              user_id: internalUserId,
              first_name: clerkUser?.firstName || "Veyra",
              last_name: clerkUser?.lastName || "Owner",
              employee_id: "OWNER-001",
              role: "superadmin",
              status: "active",
              joined_date: new Date().toISOString().split("T")[0],
            })
            .select("id")
            .single()

          if (!staffErr && newStaff) {
            staffId = newStaff.id
          }
        } else if (existingStaff.role !== "superadmin" || existingStaff.status !== "active") {
          await serviceClient
            .from("staff_users")
            .update({
              role: "superadmin",
              status: "active",
            })
            .eq("id", existingStaff.id)
        }

        return {
          state: "authorized",
          context: {
            userId: internalUserId,
            clerkId: userId,
            email: clerkEmail,
            role: "superadmin",
            firstName: clerkUser?.firstName || "Veyra",
            lastName: clerkUser?.lastName || "Owner",
            branchId: null,
            staffId: staffId || internalUserId,
            isOwner: true,
          },
        }
      }
    } catch (err) {
      console.error("[getAdminStaffStatus] Error in owner verification flow:", err)
    }
  }

  // 3. Standard Staff RLS verification
  const supabase = createClient()

  // Fetch user's own row from public.users
  const { data: userRows } = await supabase
    .from("users")
    .select("id, clerk_id, email, user_type, status")
    .limit(1)

  const user = userRows?.[0]
  if (!user || user.status !== "active") {
    return { state: "forbidden", email: clerkEmail || "unknown", userType: "unregistered" }
  }

  if (user.user_type !== "staff") {
    return { state: "forbidden", email: user.email, userType: user.user_type }
  }

  // Fetch staff profile
  const { data: staffRows } = await supabase
    .from("staff_users")
    .select("id, user_id, role, branch_id, first_name, last_name, employee_id, status")
    .eq("status", "active")
    .limit(1)

  const staff = staffRows?.[0]
  if (!staff) {
    return { state: "forbidden", email: user.email, userType: "staff_unassigned" }
  }

  return {
    state: "authorized",
    context: {
      userId: user.id,
      clerkId: user.clerk_id,
      email: user.email,
      role: staff.role as StaffRole,
      firstName: staff.first_name,
      lastName: staff.last_name,
      branchId: staff.branch_id,
      staffId: staff.id,
      isOwner: false,
    },
  }
}

/**
 * Server-side guard to enforce that the caller has staff permissions.
 * Throws or redirects if unauthenticated or forbidden.
 * Owner/Super Admin always passes any allowedRoles requirement.
 */
export async function requireAdminStaff(
  allowedRoles?: StaffRole[]
): Promise<StaffAuthContext> {
  const status = await getAdminStaffStatus()

  if (status.state === "unauthenticated") {
    redirect("/sign-in?redirect_url=/admin")
  }

  if (status.state === "forbidden") {
    throw new Error(`FORBIDDEN: Account ${status.email} (${status.userType}) does not have staff permissions.`)
  }

  // Superadmin / Owner has complete access across all modules
  if (status.context.role === "superadmin") {
    return status.context
  }

  if (allowedRoles && !allowedRoles.includes(status.context.role)) {
    throw new Error(
      `FORBIDDEN: Role ${status.context.role} is not permitted for this operation. Required: ${allowedRoles.join(", ")}`
    )
  }

  return status.context
}
