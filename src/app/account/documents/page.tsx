import * as React from "react"
import { MOCK_DOCUMENTS } from "@/lib/mock/customer"
import { AccountHeader } from "@/features/account/components/account-header"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { DocumentStatus } from "@/features/account/types"
import {
  RiFileList3Line,
  RiInformationLine,
  RiUploadLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiAlertLine,
  RiCalendarLine,
} from "@remixicon/react"

const documentStatusMap: Record<DocumentStatus, { badge: StatusType; label: string; icon: React.ElementType }> = {
  not_uploaded: { badge: "neutral", label: "Not Uploaded", icon: RiUploadLine },
  pending_review: { badge: "pending", label: "Pending Review", icon: RiTimeLine },
  approved: { badge: "success", label: "Approved & Verified", icon: RiCheckboxCircleLine },
  rejected: { badge: "error", label: "Rejected — Action Required", icon: RiCloseCircleLine },
  expired: { badge: "warning", label: "Expired — Update Required", icon: RiAlertLine },
}

export default function DocumentsPage() {
  const documents = MOCK_DOCUMENTS

  return (
    <div className="space-y-8">
      <AccountHeader
        title="Identity Documents"
        description="Track the status of identity documents submitted for rental verification and security clearance."
      />

      {/* Security Notice */}
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/40 p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
        <RiInformationLine className="size-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Document Security:</strong>{" "}
          Document upload is not active in this frontend prototype. In production, files will be stored in Supabase private storage with access-controlled signed URLs. Document data is never exposed in browser storage, public URLs, or URL query parameters.
        </p>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((doc) => {
          const config = documentStatusMap[doc.status]

          return (
            <div
              key={doc.id}
              className="rounded-xl border bg-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-5"
            >
              {/* Status Icon */}
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted"
                aria-hidden="true"
              >
                <RiFileList3Line className="size-5 text-muted-foreground" />
              </div>

              {/* Document Info */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground">{doc.title}</h3>
                    {doc.requiredForRental && (
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-medium mt-1 inline-block">
                        Required for Rental Handover
                      </span>
                    )}
                  </div>
                  <StatusBadge
                    status={config.badge}
                    label={doc.statusLabel}
                    showIcon
                    size="sm"
                  />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{doc.description}</p>

                {/* File & Date Info */}
                {doc.uploadedAt && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <RiFileList3Line className="size-3.5 text-foreground" />
                      <span className="font-mono truncate">{doc.fileName}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <RiCalendarLine className="size-3.5" />
                      <span>Uploaded {doc.uploadedAt}</span>
                    </span>
                    {doc.expiresAt && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <RiCalendarLine className="size-3.5" />
                          <span>Expires {doc.expiresAt}</span>
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Rejection Reason */}
                {doc.status === "rejected" && doc.rejectionReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
                    <RiCloseCircleLine className="size-4 shrink-0 mt-0.5" />
                    <span>{doc.rejectionReason}</span>
                  </div>
                )}

                {/* Action Placeholder */}
                {(doc.status === "not_uploaded" || doc.status === "rejected" || doc.status === "expired") && (
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-dashed border-border px-3 py-1.5 rounded-lg cursor-not-allowed opacity-70"
                      aria-disabled="true"
                      title="Document upload is not available in prototype mode"
                    >
                      <RiUploadLine className="size-3.5" />
                      <span>{doc.status === "not_uploaded" ? "Upload Document" : "Upload Replacement"}</span>
                      <span className="ml-1 text-[10px] px-1.5 rounded bg-muted text-muted-foreground">Prototype Only</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Status Legend */}
      <section className="rounded-xl border bg-muted/30 p-5 space-y-3" aria-labelledby="status-legend-heading">
        <h2 id="status-legend-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Document Status Reference
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {(Object.entries(documentStatusMap) as [DocumentStatus, typeof documentStatusMap[DocumentStatus]][]).map(([key, config]) => {
            const Icon = config.icon
            return (
              <div key={key} className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-foreground">{config.label}</strong>
                  {key === "not_uploaded" && " — Document has not been submitted yet."}
                  {key === "pending_review" && " — Under review by the Veyra team."}
                  {key === "approved" && " — Verified and accepted for rentals."}
                  {key === "rejected" && " — Could not be verified. Resubmission required."}
                  {key === "expired" && " — Document validity period has lapsed."}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
