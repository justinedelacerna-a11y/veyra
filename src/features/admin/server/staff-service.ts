import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { StaffUser, StaffRole } from "@/features/admin/types"

interface RawStaffRow {
  id: string
  user_id: string
  first_name: string
  last_name: string
  employee_id: string
  role: string
  status: string
  joined_date: string
  created_at: string
  updated_at: string
  branch_id: string | null
  branches?: { id: string; name: string; city: string } | null
  users?: { id: string; email: string; status: string } | null
}

function mapRawToStaffUser(row: RawStaffRow): StaffUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.users?.email || "",
    role: row.role as StaffRole,
    branch: row.branches?.name || undefined,
    branchId: row.branch_id || undefined,
    status: row.status as StaffUser["status"],
    lastActive: row.updated_at,
    joinedDate: row.joined_date,
    permissions: getRolePermissions(row.role as StaffRole),
  }
}

function getRolePermissions(role: StaffRole): string[] {
  const base = ["view_reservations", "view_fleet", "view_customers"]
  switch (role) {
    case "superadmin":
    case "admin":
      return [
        ...base,
        "manage_staff",
        "manage_fleet",
        "manage_pricing",
        "manage_settings",
        "view_audit",
        "view_reports",
        "cancel_reservations",
        "manage_locations",
      ]
    case "fleet_manager":
      return [...base, "manage_fleet", "manage_maintenance", "manage_inspections", "view_reports"]
    case "branch_manager":
      return [...base, "manage_fleet", "cancel_reservations", "manage_maintenance", "manage_inspections", "view_reports"]
    case "finance":
      return [...base, "view_payments", "view_reports"]
    case "support":
      return [...base, "view_payments", "view_customers"]
    case "branch_staff":
    default:
      return base
  }
}

export async function getAdminStaffList(options?: {
  search?: string
  role?: string
  status?: string
}): Promise<StaffUser[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("staff_users")
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      employee_id,
      role,
      status,
      joined_date,
      created_at,
      updated_at,
      branch_id,
      branches (id, name, city),
      users (id, email, status)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getAdminStaffList] Database error:", error)
    return []
  }

  let staff = ((data || []) as unknown as RawStaffRow[]).map(mapRawToStaffUser)

  if (options?.role && options.role !== "all") {
    staff = staff.filter((s) => s.role === options.role)
  }

  if (options?.status && options.status !== "all") {
    staff = staff.filter((s) => s.status === options.status)
  }

  if (options?.search?.trim()) {
    const q = options.search.toLowerCase()
    staff = staff.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        (s.branch || "").toLowerCase().includes(q)
    )
  }

  return staff
}
