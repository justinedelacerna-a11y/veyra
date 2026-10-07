/**
 * Supabase Storage Utilities for Veyra
 *
 * Provides CDN URL resolution for public marketing buckets and
 * storage path formatters.
 */

export const VEHICLE_IMAGES_BUCKET = "vehicles-marketing"

/**
 * Resolves a vehicle photo storage path into a public CDN URL.
 * Handles existing full URLs gracefully.
 */
export function getVehicleImageUrl(
  storagePath: string | null | undefined
): string {
  if (!storagePath) return ""

  // If already a complete URL, return as-is
  if (
    storagePath.startsWith("http://") ||
    storagePath.startsWith("https://") ||
    storagePath.startsWith("data:") ||
    storagePath.startsWith("blob:")
  ) {
    return storagePath
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
    /\/+$/,
    ""
  )
  if (!supabaseUrl) return storagePath

  // Clean path: remove leading slashes and any duplicate bucket prefixes
  let cleanPath = storagePath.replace(/^\/+/, "")
  if (cleanPath.startsWith(`${VEHICLE_IMAGES_BUCKET}/`)) {
    cleanPath = cleanPath.slice(`${VEHICLE_IMAGES_BUCKET}/`.length)
  }

  return `${supabaseUrl}/storage/v1/object/public/${VEHICLE_IMAGES_BUCKET}/${cleanPath}`
}
