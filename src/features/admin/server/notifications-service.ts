import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface AdminNotification {
  id: string
  userId: string
  channel: "email" | "sms" | "in_app" | "push"
  eventType: string
  templateId: string
  status: "pending" | "sent" | "failed" | "skipped"
  sentAt: string | null
  failureReason: string | null
  retryCount: number
  scheduledFor: string
  createdAt: string
  payload: Record<string, unknown>
}

export async function getAdminNotificationsList(options?: {
  status?: string
  limit?: number
}): Promise<AdminNotification[]> {
  const supabase = createClient()

  let query = supabase
    .from("notification_queue")
    .select(`
      id,
      user_id,
      channel,
      event_type,
      template_id,
      status,
      sent_at,
      failure_reason,
      retry_count,
      scheduled_for,
      created_at,
      payload
    `)
    .order("created_at", { ascending: false })
    .limit(options?.limit || 100)

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error("[getAdminNotificationsList] Database error:", error)
    return []
  }

  return ((data || []) as unknown as {
    id: string
    user_id: string
    channel: string
    event_type: string
    template_id: string
    status: string
    sent_at: string | null
    failure_reason: string | null
    retry_count: number
    scheduled_for: string
    created_at: string
    payload: Record<string, unknown>
  }[]).map((n) => ({
    id: n.id,
    userId: n.user_id,
    channel: n.channel as AdminNotification["channel"],
    eventType: n.event_type,
    templateId: n.template_id,
    status: n.status as AdminNotification["status"],
    sentAt: n.sent_at,
    failureReason: n.failure_reason,
    retryCount: n.retry_count,
    scheduledFor: n.scheduled_for,
    createdAt: n.created_at,
    payload: n.payload || {},
  }))
}
