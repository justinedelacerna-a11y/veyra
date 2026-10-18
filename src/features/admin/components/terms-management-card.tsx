"use client"

import * as React from "react"
import { useActionState } from "react"
import { publishTermsVersionAction, PublishTermsActionState } from "../server/terms-actions"
import { TermsVersionRecord, TermsAcceptanceAuditItem } from "../server/terms-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/common/status-badge"
import {
  RiFileTextLine,
  RiHistoryLine,
  RiCheckDoubleLine,
  RiAddLine,
  RiAlertLine,
  RiShieldCheckLine,
  RiArrowRightLine,
} from "@remixicon/react"

interface TermsManagementCardProps {
  currentVersion: TermsVersionRecord
  versions: TermsVersionRecord[]
  recentAcceptances: TermsAcceptanceAuditItem[]
  userRole: string
}

export function TermsManagementCard({
  currentVersion,
  versions,
  recentAcceptances,
  userRole,
}: TermsManagementCardProps) {
  const [showPublishForm, setShowPublishForm] = React.useState(false)
  const [showAuditDrawer, setShowAuditDrawer] = React.useState(false)

  const [state, formAction, isPending] = useActionState<PublishTermsActionState, FormData>(
    publishTermsVersionAction,
    {}
  )

  const handleFormAction = async (formData: FormData) => {
    formAction(formData)
    setShowPublishForm(false)
  }

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return isoStr
    }
  }

  const canPublish = userRole === "admin" || userRole === "superadmin"

  return (
    <div className="rounded-lg border bg-card p-5 space-y-6">
      {/* Top Banner: Current Version Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-foreground">
              {currentVersion.version}
            </span>
            <StatusBadge status="success" label="Active & Published" size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">
            Effective since <span className="font-medium text-foreground">{formatDate(currentVersion.published_at)}</span>
          </p>
          {currentVersion.summary && (
            <p className="text-xs text-muted-foreground pt-1 italic">
              &ldquo;{currentVersion.summary}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAuditDrawer(!showAuditDrawer)}
            className="text-xs gap-1.5"
          >
            <RiHistoryLine className="size-3.5" data-icon="inline-start" />
            <span>{showAuditDrawer ? "Hide Audit Records" : `Audit Acceptances (${recentAcceptances.length})`}</span>
          </Button>

          {canPublish && (
            <Button
              size="sm"
              onClick={() => setShowPublishForm(!showPublishForm)}
              className="text-xs gap-1.5"
            >
              <RiAddLine className="size-3.5" data-icon="inline-start" />
              <span>{showPublishForm ? "Cancel" : "Publish Updated Version"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Action Messages */}
      {state.message && (
        <div
          role="status"
          className={`rounded-lg border p-3.5 text-xs flex items-center gap-2.5 ${
            state.success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {state.success ? (
            <RiShieldCheckLine className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <RiAlertLine className="size-4 shrink-0 text-destructive" />
          )}
          <span>{state.message}</span>
        </div>
      )}

      {/* Publish Form (expandable) */}
      {showPublishForm && (
        <form action={handleFormAction} className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Publish New Terms of Service Version
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Publishing a new version updates the public <code className="text-primary font-mono">/terms</code> page.
              Historical acceptance records are immutable and will remain preserved referencing their original version.
              New or subsequent bookings will enforce the updated version.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="version" className="text-xs font-medium text-foreground">
                Version Identifier <span className="text-destructive">*</span>
              </label>
              <Input
                id="version"
                name="version"
                placeholder="e.g. v1.1"
                required
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="summary" className="text-xs font-medium text-foreground">
                Summary of Changes / Legal Notes <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="summary"
                name="summary"
                placeholder="Describe updates to policies, liability, pickup guidelines, or fee schedules..."
                required
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <RiShieldCheckLine className="size-3.5 text-primary" />
              <span>Enforced by admin audit logging</span>
            </span>
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 text-xs font-semibold">
              <span>{isPending ? "Publishing..." : "Confirm & Publish Version"}</span>
              <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
            </Button>
          </div>
        </form>
      )}

      {/* Version Registry Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <RiFileTextLine className="size-3.5 text-muted-foreground" />
          <span>Version Registry</span>
        </h4>

        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Version</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Published</th>
                <th className="py-2.5 px-3 font-semibold">Acceptances</th>
                <th className="py-2.5 px-3 font-semibold">Change Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {versions.map((ver) => (
                <tr key={ver.id} className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{ver.version}</td>
                  <td className="py-2.5 px-3">
                    {ver.is_current ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Current
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        Superseded
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{formatDate(ver.published_at)}</td>
                  <td className="py-2.5 px-3 font-semibold text-foreground">
                    {ver.acceptances_count ?? 0}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground line-clamp-1 max-w-xs">
                    {ver.summary || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational / Audit Drawer (expandable) */}
      {showAuditDrawer && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <RiCheckDoubleLine className="size-3.5 text-primary" />
                <span>Recent Customer Acceptance Records</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Displaying recent cryptographic acceptances linked to customer reservations. IP addresses are hashed with SHA-256 to protect customer privacy.
              </p>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Total shown: {recentAcceptances.length}
            </span>
          </div>

          {recentAcceptances.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No acceptance records found yet.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded border bg-card">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-muted/60 border-b text-muted-foreground sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Accepted At</th>
                    <th className="py-2 px-3 font-semibold">Customer</th>
                    <th className="py-2 px-3 font-semibold">Version</th>
                    <th className="py-2 px-3 font-semibold">Reservation Ref</th>
                    <th className="py-2 px-3 font-semibold">IP Hash (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentAcceptances.map((acc) => (
                    <tr key={acc.id} className="hover:bg-muted/10">
                      <td className="py-1.5 px-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(acc.accepted_at)}
                      </td>
                      <td className="py-1.5 px-3 font-medium text-foreground">
                        <div>{acc.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">{acc.customerEmail}</div>
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold text-foreground">
                        {acc.version}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-primary">
                        {acc.reservationReference || "Standalone"}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-muted-foreground truncate max-w-[120px]" title={acc.ip_hash || ""}>
                        {acc.ip_hash ? `${acc.ip_hash.slice(0, 10)}...` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
