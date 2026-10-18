import "server-only"
import { createServiceClient } from "@/lib/supabase/server"
import { recordAuditEvent } from "./audit-service"

export interface TermsVersionRecord {
  id: string
  version: string
  published_at: string
  is_current: boolean
  summary: string | null
  acceptances_count?: number
}

export interface TermsAcceptanceAuditItem {
  id: string
  accepted_at: string
  ip_hash: string | null
  version: string
  customerName: string
  customerEmail: string
  reservationReference: string | null
}

export interface PublishTermsVersionParams {
  version: string
  summary: string
  staffId: string
}

export type PublishTermsResult =
  | { success: true; version: string }
  | { success: false; error: string; message: string }

/**
 * Get the currently active Terms of Service version.
 */
export async function getCurrentTermsVersion(): Promise<TermsVersionRecord> {
  const fallback: TermsVersionRecord = {
    id: "a0000000-0000-0000-0000-000000000001",
    version: "v1.0",
    published_at: "2026-10-01T00:00:00.000Z",
    is_current: true,
    summary: "Initial Terms of Service for Veyra Car Rental, Butuan City.",
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("terms_versions")
      .select("id, version, published_at, is_current, summary")
      .eq("is_current", true)
      .maybeSingle()

    if (error || !data) {
      return fallback
    }

    return data as TermsVersionRecord
  } catch {
    return fallback
  }
}

/**
 * Get all published Terms of Service versions with acceptance count.
 */
export async function getTermsVersions(): Promise<TermsVersionRecord[]> {
  try {
    const supabase = createServiceClient()
    const { data: versions, error } = await supabase
      .from("terms_versions")
      .select("id, version, published_at, is_current, summary")
      .order("published_at", { ascending: false })

    if (error || !versions) {
      return [await getCurrentTermsVersion()]
    }

    // Get count of acceptances per version
    const { data: acceptances } = await supabase
      .from("terms_acceptances")
      .select("terms_version_id")

    const countMap = new Map<string, number>()
    if (acceptances) {
      for (const row of acceptances) {
        countMap.set(row.terms_version_id, (countMap.get(row.terms_version_id) || 0) + 1)
      }
    }

    return versions.map((v) => ({
      ...v,
      acceptances_count: countMap.get(v.id) || 0,
    }))
  } catch {
    return [await getCurrentTermsVersion()]
  }
}

/**
 * Get recent terms acceptance records for compliance and operational audit.
 */
export async function getRecentTermsAcceptances(
  limit: number = 20
): Promise<TermsAcceptanceAuditItem[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("terms_acceptances")
      .select(`
        id,
        accepted_at,
        ip_hash,
        terms_versions (version),
        customers (
          first_name,
          last_name,
          users (email)
        ),
        reservations (reference)
      `)
      .order("accepted_at", { ascending: false })
      .limit(limit)

    if (error || !data) {
      if (error) {
        console.error("[terms-service] getRecentTermsAcceptances db error:", error.message)
      }
      return []
    }

    interface RawTermsAcceptanceRow {
      id: string
      accepted_at: string
      ip_hash: string | null
      terms_versions: { version: string } | null
      customers: {
        first_name: string | null
        last_name: string | null
        users: { email: string } | null
      } | null
      reservations: { reference: string } | null
    }

    return (data as unknown as RawTermsAcceptanceRow[]).map((row) => ({
      id: row.id,
      accepted_at: row.accepted_at,
      ip_hash: row.ip_hash,
      version: row.terms_versions?.version || "Unknown",
      customerName: row.customers
        ? `${row.customers.first_name || ""} ${row.customers.last_name || ""}`.trim() || "Customer"
        : "Unknown",
      customerEmail: row.customers?.users?.email || "Unknown",
      reservationReference: row.reservations?.reference || null,
    }))
  } catch (err) {
    console.error("[terms-service] getRecentTermsAcceptances error:", err)
    return []
  }
}

/**
 * Publish a new Terms of Service version.
 * Marks existing versions as not current, inserts the new version,
 * and appends an immutable audit event.
 */
export async function publishNewTermsVersion(
  params: PublishTermsVersionParams
): Promise<PublishTermsResult> {
  const { version, summary, staffId } = params

  const versionTrimmed = version.trim()
  if (!versionTrimmed || !/^v\d+(\.\d+)+$/i.test(versionTrimmed)) {
    return {
      success: false,
      error: "invalid_version_format",
      message: 'Version format must follow "v1.1", "v2.0", etc.',
    }
  }

  if (!summary || summary.trim().length < 5) {
    return {
      success: false,
      error: "invalid_summary",
      message: "Please provide a meaningful summary of changes (at least 5 characters).",
    }
  }

  try {
    const supabase = createServiceClient()

    // 1. Check if version already exists
    const { data: existing } = await supabase
      .from("terms_versions")
      .select("id")
      .eq("version", versionTrimmed)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: "version_exists",
        message: `Version ${versionTrimmed} has already been published. Please use a unique version identifier.`,
      }
    }

    // 2. Fetch current version for audit trail beforeState
    const { data: currentOld } = await supabase
      .from("terms_versions")
      .select("id, version, summary")
      .eq("is_current", true)
      .maybeSingle()

    // 3. Demote currently active version(s)
    await supabase
      .from("terms_versions")
      .update({ is_current: false })
      .eq("is_current", true)

    // 4. Insert new version
    const { data: newVersion, error: insertErr } = await supabase
      .from("terms_versions")
      .insert({
        version: versionTrimmed,
        summary: summary.trim(),
        is_current: true,
        published_at: new Date().toISOString(),
        created_by_staff_id: staffId || null,
      })
      .select("id, version, published_at")
      .single()

    if (insertErr || !newVersion) {
      console.error("[terms-service] insert error:", insertErr?.message)
      return {
        success: false,
        error: "database_error",
        message: "Failed to create new terms version record.",
      }
    }

    // 5. Append audit event
    await recordAuditEvent({
      actorId: staffId,
      actorRole: "admin",
      action: "settings.changed",
      resourceType: "terms_versions",
      resourceId: newVersion.id,
      result: "success",
      details: `Published new Terms of Service version ${versionTrimmed}. Summary: ${summary.trim()}`,
      beforeState: currentOld ? { version: currentOld.version, summary: currentOld.summary } : null,
      afterState: { version: newVersion.version, summary: summary.trim() },
    })

    return {
      success: true,
      version: newVersion.version,
    }
  } catch (err) {
    console.error("[terms-service] publish unexpected error:", err)
    return {
      success: false,
      error: "unexpected_error",
      message: "An unexpected error occurred while publishing the new version.",
    }
  }
}
