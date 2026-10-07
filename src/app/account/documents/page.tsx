import * as React from "react"
import { Metadata } from "next"
import { getCustomerDocuments } from "@/features/account/server/customer-repository"
import { AccountHeader } from "@/features/account/components/account-header"
import { DocumentUploadDialog } from "@/features/account/components/document-upload-dialog"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { DocumentStatus } from "@/features/account/types"
import { ValidDocumentType } from "@/features/account/server/document-actions"
import {
  RiFileList3Line,
  RiShieldCheckLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiAlertLine,
  RiCalendarLine,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "Identity Documents — Veyra Account",
  description: "Track the status of identity documents submitted for rental verification and security clearance.",
}

const documentStatusMap: Record<
  DocumentStatus,
  { badge: StatusType; label: string; icon: React.ElementType }
> = {
  not_uploaded: { badge: "neutral", label: "Not Uploaded", icon: RiFileList3Line },
  pending_review: { badge: "pending", label: "Pending Review", icon: RiTimeLine },
  approved: { badge: "success", label: "Approved & Verified", icon: RiCheckboxCircleLine },
  rejected: { badge: "error", label: "Rejected — Action Required", icon: RiCloseCircleLine },
  expired: { badge: "warning", label: "Expired — Update Required", icon: RiAlertLine },
}

interface StandardDocConfig {
  type: ValidDocumentType
  title: string
  description: string
  requiredForRental: boolean
}

const STANDARD_DOCUMENT_SLOTS: StandardDocConfig[] = [
  {
    type: "driver_license",
    title: "Official Driver's License",
    description: "Valid physical photocard driver's license (Philippine LTO or authorized international permit). Required before vehicle handover.",
    requiredForRental: true,
  },
  {
    type: "government_id",
    title: "Primary Government-Issued ID",
    description: "Passport, UMID, National ID (PhilSys), or PRC ID card for primary identity verification.",
    requiredForRental: true,
  },
  {
    type: "address_proof",
    title: "Proof of Billing / Address",
    description: "Utility bill, bank statement, or lease contract issued within the last 90 days matching your account address.",
    requiredForRental: false,
  },
]

export default async function DocumentsPage() {
  const liveDocuments = await getCustomerDocuments()

  // Match live documents with standard required slots or show them
  const documentCards = STANDARD_DOCUMENT_SLOTS.map((slot) => {
    // Find latest record for this document type
    const existing = liveDocuments.find((d) => d.category === slot.type)

    if (existing) {
      return {
        id: existing.id,
        slotType: slot.type,
        title: slot.title,
        description: slot.description,
        status: existing.status,
        statusLabel: existing.statusLabel,
        fileName: existing.fileName,
        uploadedAt: existing.uploadedAt,
        expiresAt: existing.expiresAt,
        rejectionReason: existing.rejectionReason,
        requiredForRental: slot.requiredForRental,
      }
    }

    return {
      id: `slot-${slot.type}`,
      slotType: slot.type,
      title: slot.title,
      description: slot.description,
      status: "not_uploaded" as DocumentStatus,
      statusLabel: "Not Uploaded",
      fileName: undefined,
      uploadedAt: undefined,
      expiresAt: undefined,
      rejectionReason: undefined,
      requiredForRental: slot.requiredForRental,
    }
  })

  return (
    <div className="space-y-8">
      <AccountHeader
        title="Identity Documents"
        description="Submit and track verification documents required for seamless vehicle collection and handover clearance."
      />

      {/* Security Notice */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
        <RiShieldCheckLine className="size-4 shrink-0 mt-0.5 text-primary" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Bank-Grade Privacy:</strong>{" "}
          All submitted documents are transferred via TLS 1.3, encrypted at rest in isolated private storage, and only accessible by credentialed Veyra verification specialists. Document URLs are never made public.
        </p>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documentCards.map((doc) => {
          const config = documentStatusMap[doc.status]

          return (
            <div
              key={doc.id}
              className="rounded-xl border bg-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-5 shadow-xs"
            >
              {/* Status Icon */}
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/60"
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
                        Required for Vehicle Handover
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

                {/* Upload Action */}
                <div className="pt-2">
                  <DocumentUploadDialog
                    documentType={doc.slotType}
                    documentTitle={doc.title}
                    isReplacement={doc.status === "approved" || doc.status === "pending_review"}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Status Legend */}
      <section className="rounded-xl border bg-muted/30 p-5 space-y-3" aria-labelledby="status-legend-heading">
        <h2 id="status-legend-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Verification Workflow Reference
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {(Object.entries(documentStatusMap) as [DocumentStatus, typeof documentStatusMap[DocumentStatus]][]).map(([key, config]) => {
            const Icon = config.icon
            return (
              <div key={key} className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-foreground">{config.label}</strong>
                  {key === "not_uploaded" && " — Awaiting document upload from member."}
                  {key === "pending_review" && " — Submitted and queued for staff verification."}
                  {key === "approved" && " — Verified and cleared for vehicle collection."}
                  {key === "rejected" && " — Verification failed. Resubmission requested."}
                  {key === "expired" && " — Document expiration date has passed."}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
