"use server"

import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { updateRentalDurationConfig } from "@/features/admin/server/settings-service"
import { revalidatePath } from "next/cache"

export interface UpdateRentalDurationState {
  success?: boolean
  error?: string
  message?: string
}

/**
 * Server Action: Update rental duration configuration.
 * Only admin and superadmin roles can invoke this.
 */
export async function updateRentalDurationAction(
  _prevState: UpdateRentalDurationState,
  formData: FormData
): Promise<UpdateRentalDurationState> {
  // 1. Enforce admin/superadmin role server-side
  const staff = await requireAdminStaff(["admin", "superadmin"])

  const minDaysRaw = formData.get("min_days")
  const maxDaysRaw = formData.get("max_days")

  const minDays = parseInt(String(minDaysRaw), 10)
  const maxDaysStr = String(maxDaysRaw || "").trim()
  const maxDays = maxDaysStr === "" || maxDaysStr === "0" ? null : parseInt(maxDaysStr, 10)

  if (isNaN(minDays)) {
    return { success: false, error: "invalid_input", message: "Minimum days is required and must be a number." }
  }

  if (maxDays !== null && isNaN(maxDays)) {
    return { success: false, error: "invalid_input", message: "Maximum days must be a number or left blank for no limit." }
  }

  const result = await updateRentalDurationConfig({
    minDays,
    maxDays,
    staffId: staff.staffId,
  })

  if (result.success) {
    revalidatePath("/admin/settings")
    return { success: true, message: `Rental duration updated: ${minDays}–${maxDays ?? "∞"} days.` }
  }

  return { success: false, error: result.error, message: result.message }
}
