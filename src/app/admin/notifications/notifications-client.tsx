"use client"

import * as React from "react"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { FilterBar } from "@/components/admin/primitives"
import type { AdminNotification } from "@/features/admin/server/notifications-service"
import type { StatusType } from "@/components/common/status-badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { RiNotification2Line } from "@remixicon/react"

const STATUS_BADGE: Record<AdminNotification["status"], { badge: StatusType; label: string }> = {
  pending: { badge: "warning", label: "Pending" },
  sent: { badge: "success", label: "Sent" },
  failed: { badge: "error", label: "Failed" },
  skipped: { badge: "neutral", label: "Skipped" },
}

const CHANNEL_BADGE: Record<AdminNotification["channel"], { badge: StatusType; label: string }> = {
  email: { badge: "info", label: "Email" },
  sms: { badge: "pending", label: "SMS" },
  in_app: { badge: "neutral", label: "In-App" },
  push: { badge: "neutral", label: "Push" },
}

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
]

interface NotificationsClientProps {
  initialNotifications: AdminNotification[]
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const filtered = React.useMemo(() => {
    let items = initialNotifications
    if (statusFilter !== "all") items = items.filter((n) => n.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (n) =>
          n.eventType.toLowerCase().includes(q) ||
          n.channel.toLowerCase().includes(q) ||
          n.templateId.toLowerCase().includes(q) ||
          n.userId.toLowerCase().includes(q)
      )
    }
    return items
  }, [initialNotifications, search, statusFilter])

  const statusCounts = React.useMemo(() => {
    return initialNotifications.reduce((acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [initialNotifications])

  const failedCount = statusCounts["failed"] || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Outbound notification queue — emails, SMS, and in-app alerts sent to customers and staff."
        actions={
          failedCount > 0 ? (
            <StatusBadge status="error" label={`${failedCount} Failed`} size="sm" />
          ) : (
            <StatusBadge status="success" label="All Delivered" size="sm" />
          )
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Sent", value: statusCounts["sent"] || 0 },
          { label: "Pending", value: statusCounts["pending"] || 0 },
          { label: "Failed", value: statusCounts["failed"] || 0 },
          { label: "Skipped", value: statusCounts["skipped"] || 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
            <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((sf) => {
          const count = sf.value === "all" ? initialNotifications.length : statusCounts[sf.value] || 0
          return (
            <button
              key={sf.value}
              type="button"
              onClick={() => setStatusFilter(sf.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === sf.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {sf.label} <span className="ml-1 font-mono text-[11px] opacity-75">({count})</span>
            </button>
          )
        })}
      </div>

      <FilterBar
        searchPlaceholder="Search by event type, channel, or template…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => { setSearch(""); setStatusFilter("all") }}
        totalCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <RiNotification2Line className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No notifications found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Notifications are queued when bookings are created, confirmed, or status changes occur.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => {
                const statusCfg = STATUS_BADGE[n.status]
                const channelCfg = CHANNEL_BADGE[n.channel]
                return (
                  <TableRow key={n.id} className="hover:bg-muted/20">
                    <TableCell>
                      <span className="text-xs font-mono font-medium">{n.eventType}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={channelCfg.badge} label={channelCfg.label} size="sm" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={statusCfg.badge} label={statusCfg.label} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{n.templateId}</TableCell>
                    <TableCell className="text-xs text-center">
                      {n.retryCount > 0 ? (
                        <span className="text-amber-600 font-semibold">{n.retryCount}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(n.scheduledFor).toLocaleString("en-PH", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {n.sentAt ? new Date(n.sentAt).toLocaleString("en-PH", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      }) : "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-lg border bg-card divide-y">
        <div className="p-4">
          <SectionHeader title="Notification Event Types" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              "reservation.created", "reservation.confirmed", "reservation.cancelled",
              "pickup.upcoming", "return.upcoming", "payment.received",
              "maintenance.scheduled", "inspection.required"
            ].map((et) => (
              <span key={et} className="px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground font-mono">
                {et}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Architecture note:</strong> The notification queue is managed by a background worker.
            Actual dispatch (email, SMS) requires integration with a provider such as Resend, Twilio, or SendGrid.
            This view shows the queue state only.
          </p>
        </div>
      </div>
    </div>
  )
}
