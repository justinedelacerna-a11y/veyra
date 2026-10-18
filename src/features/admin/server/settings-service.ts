import "server-only"
import { createServiceClient } from "@/lib/supabase/server"

export interface RentalDurationConfig {
  minDays: number
  maxDays: number | null
}

const DEFAULT_CONFIG: RentalDurationConfig = {
  minDays: 1,
  maxDays: 30,
}

/**
 * Load the rental duration configuration from system_settings.
 * Falls back to defaults if the setting is missing or malformed.
 * Cached for the duration of the request (Next.js fetch deduplication).
 */
export async function getRentalDurationConfig(): Promise<RentalDurationConfig> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "rental_duration")
      .single()

    if (error || !data) {
      return DEFAULT_CONFIG
    }

    const value = data.value as Record<string, unknown>
    const minDays = typeof value.min_days === "number" ? value.min_days : DEFAULT_CONFIG.minDays
    const maxDays =
      value.max_days === null
        ? null
        : typeof value.max_days === "number"
        ? value.max_days
        : DEFAULT_CONFIG.maxDays

    // Sanity check
    if (minDays < 1) return DEFAULT_CONFIG
    if (maxDays !== null && maxDays < minDays) return DEFAULT_CONFIG

    return { minDays, maxDays }
  } catch {
    return DEFAULT_CONFIG
  }
}

export interface UpdateRentalDurationParams {
  minDays: number
  maxDays: number | null
  staffId: string
}

export type UpdateSettingResult =
  | { success: true }
  | { success: false; error: string; message: string }

/**
 * Update the rental duration configuration.
 * Only called from the admin settings Server Action — caller must have verified staff role.
 */
export async function updateRentalDurationConfig(
  params: UpdateRentalDurationParams
): Promise<UpdateSettingResult> {
  const { minDays, maxDays, staffId } = params

  // Validate
  if (!Number.isInteger(minDays) || minDays < 1) {
    return { success: false, error: "invalid_min", message: "Minimum days must be a positive integer." }
  }
  if (maxDays !== null) {
    if (!Number.isInteger(maxDays) || maxDays < 1) {
      return { success: false, error: "invalid_max", message: "Maximum days must be a positive integer or null." }
    }
    if (maxDays < minDays) {
      return {
        success: false,
        error: "min_exceeds_max",
        message: "Minimum rental days cannot exceed maximum rental days.",
      }
    }
  }

  try {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from("system_settings")
      .upsert(
        {
          key: "rental_duration",
          value: { min_days: minDays, max_days: maxDays },
          updated_at: new Date().toISOString(),
          updated_by_staff_id: staffId,
        },
        { onConflict: "key" }
      )

    if (error) {
      console.error("[settings-service] update error:", error.message)
      return { success: false, error: "database_error", message: "Failed to save rental duration settings." }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[settings-service] unexpected error:", msg)
    return { success: false, error: "unexpected", message: "An unexpected error occurred." }
  }
}
