import "server-only"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import type { AuditEvent, AuditAction, StaffRole } from "@/features/admin/types"

interface RawAuditRow {
  id: string
  actor_id: string
  actor_role: string
  action: string
  resource_type: string
  resource_id: string
  result: string
  details: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  users?: { email: string } | null
}

import type { Json } from "@/types/database"

export interface RecordAuditEventInput {
  actorId: string
  actorRole: StaffRole
  action: AuditAction
  resourceType: string
  resourceId: string
  result: "success" | "failure"
  details: string
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  ipAddress?: string | null
}

/**
 * Appends an immutable audit event to public.audit_events.
 * Uses service role client because RLS revokes direct INSERT from authenticated clients.
 */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  try {
    const serviceClient = createServiceClient()
    const { error } = await serviceClient.from("audit_events").insert({
      actor_id: input.actorId,
      actor_role: input.actorRole,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      result: input.result,
      details: input.details,
      before_state: (input.beforeState as unknown as Json) ?? null,
      after_state: (input.afterState as unknown as Json) ?? null,
      ip_address: input.ipAddress || null,
    })

    if (error) {
      console.error("[recordAuditEvent] Database insert error:", error)
    }
  } catch (err) {
    console.error("[recordAuditEvent] Unexpected error inserting audit record:", err)
  }
}

export async function getAdminAuditLog(options?: {
  search?: string
  action?: string
  limit?: number
}): Promise<AuditEvent[]> {
  const supabase = createClient()

  let query = supabase
    .from("audit_events")
    .select(`
      id,
      actor_id,
      actor_role,
      action,
      resource_type,
      resource_id,
      result,
      details,
      before_state,
      after_state,
      ip_address,
      created_at,
      users!actor_id (email)
    `)
    .order("created_at", { ascending: false })
    .limit(options?.limit || 200)

  if (options?.action && options.action !== "all") {
    query = query.eq("action", options.action)
  }

  const { data, error } = await query

  if (error) {
    console.error("[getAdminAuditLog] Database error:", error)
    return []
  }

  let events = ((data || []) as unknown as RawAuditRow[]).map((e) => ({
    id: e.id,
    timestamp: e.created_at,
    actorId: e.actor_id,
    actorName: e.users?.email || e.actor_id.slice(0, 8),
    actorRole: e.actor_role as StaffRole,
    action: e.action as AuditAction,
    resource: e.resource_type,
    resourceId: e.resource_id,
    result: e.result as "success" | "failure",
    details: e.details,
    ipAddress: e.ip_address || undefined,
  }))

  if (options?.search?.trim()) {
    const q = options.search.toLowerCase()
    events = events.filter(
      (e) =>
        e.actorName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q) ||
        e.resourceId.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q)
    )
  }

  return events
}
