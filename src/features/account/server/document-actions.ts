"use server"

import { revalidatePath } from "next/cache"
import { currentUser } from "@clerk/nextjs/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { logger, safeErrorMessage } from "@/lib/logger"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED_DOCUMENT_TYPES = [
  "driver_license",
  "government_id",
  "address_proof",
  "passport",
] as const

export type ValidDocumentType = typeof ALLOWED_DOCUMENT_TYPES[number]

export interface UploadDocumentResult {
  success: boolean
  message: string
  documentId?: string
  error?: string
}

/**
 * Server action to securely upload a customer identity document.
 * 
 * Enforces:
 * - Authenticated Clerk session
 * - Customer DB record resolution
 * - Server-side MIME & size validation
 * - Unpredictable UUID-based storage path in private bucket
 * - Metadata persistence in public.customer_documents
 */
export async function uploadCustomerDocumentAction(
  formData: FormData
): Promise<UploadDocumentResult> {
  const log = logger("account/document-upload")
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, message: "Authentication required to upload documents.", error: "UNAUTHORIZED" }
    }

    // Rate limit per authenticated user
    const rateLimit = checkRateLimit("documentUpload", user.id, RATE_LIMITS.documentUpload)
    if (!rateLimit.allowed) {
      log.warn("rate_limited", { retryAfterMs: rateLimit.retryAfterMs })
      return {
        success: false,
        message: "Too many uploads. Please wait a moment before uploading again.",
        error: "RATE_LIMITED",
      }
    }

    const file = formData.get("file") as File | null
    const documentType = formData.get("documentType") as string | null

    if (!file || typeof file === "string") {
      return { success: false, message: "No document file was provided.", error: "INVALID_FILE" }
    }

    if (!documentType || !ALLOWED_DOCUMENT_TYPES.includes(documentType as ValidDocumentType)) {
      return { success: false, message: "Invalid document type specified.", error: "INVALID_TYPE" }
    }

    // 1. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        message: "File exceeds the 10 MB maximum limit.",
        error: "FILE_TOO_LARGE",
      }
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        message: "Invalid file format. Only JPEG, PNG, WebP, and PDF documents are accepted.",
        error: "INVALID_MIME",
      }
    }

    // 3. Resolve customer ID
    const userSupabase = createClient()
    const { data: customer, error: custErr } = await userSupabase
      .from("customers")
      .select("id")
      .maybeSingle()

    if (custErr || !customer) {
      return {
        success: false,
        message: "Customer profile not found. Please refresh and try again.",
        error: "CUSTOMER_NOT_FOUND",
      }
    }

    // 4. Initialize privileged Supabase client for storage upload
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminSupabase = createServiceClient(supabaseUrl, serviceRoleKey)

    // 5. Generate secure storage path
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin"
    const timestamp = Date.now()
    const uniqueId = crypto.randomUUID()
    const storagePath = `${customer.id}/${documentType}/${timestamp}-${uniqueId}.${extension}`

    // 6. Convert file to ArrayBuffer / Buffer for upload
    const fileBytes = await file.arrayBuffer()
    const buffer = Buffer.from(fileBytes)

    const { error: uploadError } = await adminSupabase.storage
      .from("customer-documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      log.error("storage_upload_error", { error: safeErrorMessage(uploadError) })
      return {
        success: false,
        message: "Failed to store document. Please try again.",
        error: "STORAGE_ERROR",
      }
    }

    // 7. Insert record into customer_documents table
    const { data: docRecord, error: dbError } = await adminSupabase
      .from("customer_documents")
      .insert({
        customer_id: customer.id,
        type: documentType,
        storage_path: storagePath,
        original_filename: file.name.slice(0, 255),
        mime_type: file.type,
        file_size_bytes: file.size,
        status: "pending_review",
      })
      .select("id")
      .single()

    if (dbError || !docRecord) {
      log.error("db_insert_error", { error: safeErrorMessage(dbError) })
      // Attempt cleanup of orphaned storage file
      await adminSupabase.storage.from("customer-documents").remove([storagePath])
      return {
        success: false,
        message: "Failed to register document in records. Please try again.",
        error: "DB_ERROR",
      }
    }

    // 8. Revalidate account documents page
    revalidatePath("/account/documents")

    log.info("document_uploaded", { documentId: docRecord.id, documentType })
    return {
      success: true,
      message: "Document uploaded successfully and submitted for verification.",
      documentId: docRecord.id,
    }
  } catch (err) {
    log.error("unexpected_error", { error: safeErrorMessage(err) })
    return {
      success: false,
      message: "An unexpected error occurred while uploading your document. Please try again.",
      error: "UNEXPECTED_ERROR",
    }
  }
}
