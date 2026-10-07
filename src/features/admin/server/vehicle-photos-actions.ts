"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdminStaff } from "./admin-auth"
import { recordAuditEvent } from "./audit-service"
import { getVehicleImageUrl, VEHICLE_IMAGES_BUCKET } from "@/lib/supabase/storage"
import type { VehicleImage } from "@/types"

export interface PhotoActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * Fetch all images for a vehicle from the database.
 */
export async function getVehicleImagesAction(
  vehicleId: string
): Promise<VehicleImage[]> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("vehicle_images")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error || !data) {
      return []
    }

    return (data as Array<{
      id: string
      vehicle_id: string
      storage_path: string
      alt_text: string | null
      sort_order: number
      is_primary: boolean
      created_at: string
    }>).map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      storagePath: row.storage_path,
      altText: row.alt_text,
      sortOrder: row.sort_order,
      isPrimary: Boolean(row.is_primary),
      createdAt: row.created_at,
      url: getVehicleImageUrl(row.storage_path),
    }))
  } catch (err) {
    console.error("[getVehicleImagesAction] Failed:", err)
    return []
  }
}

/**
 * Upload a new vehicle photo to Supabase Storage and register in database.
 */
export async function uploadVehiclePhotoAction(
  formData: FormData
): Promise<PhotoActionResult<VehicleImage>> {
  try {
    // 1. Enforce admin/staff authorization
    const staff = await requireAdminStaff([
      "fleet_manager",
      "branch_manager",
      "admin",
      "superadmin",
    ])

    const vehicleId = formData.get("vehicleId") as string
    const file = formData.get("file") as File | null
    const altText = (formData.get("altText") as string) || null
    const makePrimary = formData.get("isPrimary") === "true"

    if (!vehicleId) {
      return {
        success: false,
        message: "Missing vehicle ID.",
        error: "INVALID_VEHICLE_ID",
      }
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return {
        success: false,
        message: "Please select a valid image file.",
        error: "NO_FILE_PROVIDED",
      }
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        success: false,
        message: `Unsupported file format (${file.type}). Allowed: JPG, PNG, WEBP.`,
        error: "INVALID_MIME_TYPE",
      }
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        message: `File size exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        error: "FILE_TOO_LARGE",
      }
    }

    const supabase = createServiceClient()

    // 4. Generate clean storage path
    const extension = file.name.split(".").pop()?.toLowerCase() || "webp"
    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 32)
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const storagePath = `vehicle-images/${vehicleId}/${safeBaseName}-${uniqueSuffix}.${extension}`

    // 5. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[uploadVehiclePhotoAction] Storage upload error:", uploadError)
      return {
        success: false,
        message: `Failed to upload photo to storage: ${uploadError.message}`,
        error: "STORAGE_ERROR",
      }
    }

    // 6. Check existing photos to determine primary status and sort order
    const { data: existingRows } = await supabase
      .from("vehicle_images")
      .select("id, is_primary, sort_order")
      .eq("vehicle_id", vehicleId)

    const hasExistingPhotos = (existingRows && existingRows.length > 0)
    const shouldBePrimary = makePrimary || !hasExistingPhotos
    const nextSortOrder = (existingRows && existingRows.length > 0)
      ? Math.max(...existingRows.map((r) => Number((r as { sort_order: number }).sort_order || 0))) + 1
      : 0

    // If this should be primary, demote any current primary
    if (shouldBePrimary && hasExistingPhotos) {
      await supabase
        .from("vehicle_images")
        .update({ is_primary: false })
        .eq("vehicle_id", vehicleId)
    }

    // 7. Insert DB record
    const { data: inserted, error: insertError } = await supabase
      .from("vehicle_images")
      .insert({
        vehicle_id: vehicleId,
        storage_path: storagePath,
        alt_text: altText,
        sort_order: nextSortOrder,
        is_primary: shouldBePrimary,
      })
      .select("*")
      .single()

    if (insertError || !inserted) {
      console.error("[uploadVehiclePhotoAction] DB insert error:", insertError)
      // Cleanup orphaned storage file
      await supabase.storage.from(VEHICLE_IMAGES_BUCKET).remove([storagePath])
      return {
        success: false,
        message: `Failed to save photo record: ${insertError?.message || "Unknown error"}`,
        error: "DB_ERROR",
      }
    }

    const row = inserted as {
      id: string
      vehicle_id: string
      storage_path: string
      alt_text: string | null
      sort_order: number
      is_primary: boolean
      created_at: string
    }

    const newImage: VehicleImage = {
      id: row.id,
      vehicleId: row.vehicle_id,
      storagePath: row.storage_path,
      altText: row.alt_text,
      sortOrder: row.sort_order,
      isPrimary: Boolean(row.is_primary),
      createdAt: row.created_at,
      url: getVehicleImageUrl(row.storage_path),
    }

    // 8. Record audit log
    await recordAuditEvent({
      action: "vehicle.photo_uploaded",
      resourceType: "vehicle",
      resourceId: vehicleId,
      actorId: staff.staffId,
      actorRole: staff.role,
      result: "success",
      details: `Uploaded vehicle photo (${storagePath}, primary=${shouldBePrimary})`,
    })

    // 9. Revalidate affected pages
    revalidatePath("/admin/fleet")
    revalidatePath(`/admin/fleet/${vehicleId}`)
    revalidatePath("/vehicles")
    revalidatePath(`/vehicles/${vehicleId}`)
    revalidatePath("/")
    revalidatePath("/booking")

    return {
      success: true,
      message: "Vehicle photo uploaded successfully.",
      data: newImage,
    }
  } catch (err) {
    console.error("[uploadVehiclePhotoAction] Uncaught error:", err)
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to upload vehicle photo.",
      error: "UNCAUGHT_ERROR",
    }
  }
}

/**
 * Set an existing photo as the primary image for a vehicle.
 */
export async function setPrimaryVehiclePhotoAction(
  photoId: string,
  vehicleId: string
): Promise<PhotoActionResult> {
  try {
    const staff = await requireAdminStaff([
      "fleet_manager",
      "branch_manager",
      "admin",
      "superadmin",
    ])

    const supabase = createServiceClient()

    // Demote current primary
    await supabase
      .from("vehicle_images")
      .update({ is_primary: false })
      .eq("vehicle_id", vehicleId)

    // Promote target photo
    const { error } = await supabase
      .from("vehicle_images")
      .update({ is_primary: true })
      .eq("id", photoId)
      .eq("vehicle_id", vehicleId)

    if (error) {
      return {
        success: false,
        message: `Failed to set primary photo: ${error.message}`,
        error: error.message,
      }
    }

    await recordAuditEvent({
      action: "vehicle.photo_set_primary",
      resourceType: "vehicle",
      resourceId: vehicleId,
      actorId: staff.staffId,
      actorRole: staff.role,
      result: "success",
      details: `Set photo ${photoId} as primary for vehicle ${vehicleId}`,
    })

    revalidatePath("/admin/fleet")
    revalidatePath(`/admin/fleet/${vehicleId}`)
    revalidatePath("/vehicles")
    revalidatePath(`/vehicles/${vehicleId}`)
    revalidatePath("/")
    revalidatePath("/booking")

    return {
      success: true,
      message: "Primary vehicle photo updated.",
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to set primary photo.",
      error: "UNCAUGHT_ERROR",
    }
  }
}

/**
 * Delete a vehicle photo from storage and database.
 */
export async function deleteVehiclePhotoAction(
  photoId: string,
  vehicleId: string
): Promise<PhotoActionResult> {
  try {
    const staff = await requireAdminStaff([
      "fleet_manager",
      "branch_manager",
      "admin",
      "superadmin",
    ])

    const supabase = createServiceClient()

    // 1. Fetch the target photo record
    const { data: photo, error: fetchErr } = await supabase
      .from("vehicle_images")
      .select("id, storage_path, is_primary")
      .eq("id", photoId)
      .eq("vehicle_id", vehicleId)
      .single()

    if (fetchErr || !photo) {
      return {
        success: false,
        message: "Photo record not found.",
        error: "NOT_FOUND",
      }
    }

    const typedPhoto = photo as { id: string; storage_path: string; is_primary: boolean }

    // 2. Remove from storage
    if (typedPhoto.storage_path) {
      await supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .remove([typedPhoto.storage_path])
    }

    // 3. Delete from DB
    const { error: delErr } = await supabase
      .from("vehicle_images")
      .delete()
      .eq("id", photoId)

    if (delErr) {
      return {
        success: false,
        message: `Failed to remove photo record: ${delErr.message}`,
        error: delErr.message,
      }
    }

    // 4. If deleted photo was primary, elect a new primary from remaining photos
    if (typedPhoto.is_primary) {
      const { data: remaining } = await supabase
        .from("vehicle_images")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .order("sort_order", { ascending: true })
        .limit(1)

      if (remaining && remaining.length > 0) {
        const nextPrimaryId = (remaining[0] as { id: string }).id
        await supabase
          .from("vehicle_images")
          .update({ is_primary: true })
          .eq("id", nextPrimaryId)
      }
    }

    await recordAuditEvent({
      action: "vehicle.photo_deleted",
      resourceType: "vehicle",
      resourceId: vehicleId,
      actorId: staff.staffId,
      actorRole: staff.role,
      result: "success",
      details: `Deleted photo ${photoId} (${typedPhoto.storage_path}) from vehicle ${vehicleId}`,
    })

    revalidatePath("/admin/fleet")
    revalidatePath(`/admin/fleet/${vehicleId}`)
    revalidatePath("/vehicles")
    revalidatePath(`/vehicles/${vehicleId}`)
    revalidatePath("/")
    revalidatePath("/booking")

    return {
      success: true,
      message: "Photo deleted successfully.",
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete photo.",
      error: "UNCAUGHT_ERROR",
    }
  }
}

/**
 * Reorder vehicle photos.
 */
export async function reorderVehiclePhotosAction(
  vehicleId: string,
  orderedPhotoIds: string[]
): Promise<PhotoActionResult> {
  try {
    const staff = await requireAdminStaff([
      "fleet_manager",
      "branch_manager",
      "admin",
      "superadmin",
    ])

    const supabase = createServiceClient()

    // Update each photo's sort_order according to array order
    for (let index = 0; index < orderedPhotoIds.length; index++) {
      const id = orderedPhotoIds[index]
      await supabase
        .from("vehicle_images")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("vehicle_id", vehicleId)
    }

    await recordAuditEvent({
      action: "vehicle.photos_reordered",
      resourceType: "vehicle",
      resourceId: vehicleId,
      actorId: staff.staffId,
      actorRole: staff.role,
      result: "success",
      details: `Reordered ${orderedPhotoIds.length} photos for vehicle ${vehicleId}`,
    })

    revalidatePath(`/admin/fleet/${vehicleId}`)
    revalidatePath(`/vehicles/${vehicleId}`)

    return {
      success: true,
      message: "Photos reordered successfully.",
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to reorder photos.",
      error: "UNCAUGHT_ERROR",
    }
  }
}
