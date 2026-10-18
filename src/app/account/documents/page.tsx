import * as React from "react"
import { Metadata } from "next"
import { getCustomerDocuments, getCustomerKycStatus } from "@/features/account/server/customer-repository"
import { AccountHeader } from "@/features/account/components/account-header"
import { DocumentUploadDialog } from "@/features/account/components/document-upload-dialog"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { DocumentStatus } from "@/features/account/types"
import { ValidDocumentType } from "@/features/account/server/document-actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  RiFileList3Line,
  RiShieldCheckLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiAlertLine,
  RiCalendarLine,
  RiArrowLeftLine,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "Identity Documents & KYC — Veyra Account",
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
  isOptional?: boolean
}

const MANDATORY_DOCUMENT_SLOTS: StandardDocConfig[] = [
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
]

const OPTIONAL_DOCUMENT_SLOTS: StandardDocConfig[] = [
  {
    type: "address_proof",
    title: "Proof of Billing / Address (Optional)",
    description: "Utility bill, bank statement, or lease contract issued within the last 90 days. Optional supplemental document for corporate invoicing or fleet account records; NOT required for rental clearance or vehicle collection.",
    requiredForRental: false,
    isOptional: true,
  },
]

export default async function DocumentsPage(props: {
  searchParams?: Promise<{ returnUrl?: string }>
}) {
  const searchParams = props.searchParams ? await props.searchParams : {}
  const returnUrl = searchParams?.returnUrl

  const [liveDocuments, kyc] = await Promise.all([
    getCustomerDocuments(),
    getCustomerKycStatus(),
  ])

  const createCards = (slots: StandardDocConfig[]) =>
    slots.map((slot) => {
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
          isOptional: slot.isOptional,
        }
      }

      return {
        id: `slot-${slot.type}`,
        slotType: slot.type,
        title: slot.title,
        description: slot.description,
        status: "not_uploaded" as DocumentStatus,
        statusLabel: slot.isOptional ? "Optional • Not Submitted" : "Not Uploaded",
        fileName: undefined,
        uploadedAt: undefined,
        expiresAt: undefined,
        rejectionReason: undefined,
        requiredForRental: slot.requiredForRental,
        isOptional: slot.isOptional,
      }
    })

  const mandatoryCards = createCards(MANDATORY_DOCUMENT_SLOTS)
  const optionalCards = createCards(OPTIONAL_DOCUMENT_SLOTS)

  return (
    <div className="space-y-8">
      {/* Return to Booking Banner if redirected from checkout */}
      {returnUrl && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase text-primary tracking-wider">
              Booking Verification Step
            </span>
            <p className="text-sm font-medium text-foreground">
              Please submit your required driver&apos;s license below to complete your rental.
            </p>
          </div>
          <Link href={returnUrl}>
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
              <RiArrowLeftLine className="size-3.5" />
              <span>Return to Booking</span>
            </Button>
          </Link>
        </div>
      )}

      <AccountHeader
        title="Identity & Driver KYC Verification"
        description="Submit and track verification documents required under Philippine LTO guidelines for rental clearance and key release."
      />

      {/* Primary Customer KYC Status Overview Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overall Account Verification Status
            </span>
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              {kyc.status === "verified" ? (
                <>
                  <RiShieldCheckLine className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <span>KYC Verified • Cleared for Rentals</span>
                </>
              ) : kyc.status === "pending_review" ? (
                <>
                  <RiTimeLine className="size-5 text-amber-600 dark:text-amber-400" />
                  <span>Verification Pending Review</span>
                </>
              ) : kyc.status === "rejected" || kyc.status === "requires_resubmission" ? (
                <>
                  <RiCloseCircleLine className="size-5 text-destructive" />
                  <span>Requires Resubmission</span>
                </>
              ) : (
                <>
                  <RiAlertLine className="size-5 text-muted-foreground" />
                  <span>Verification Not Submitted</span>
                </>
              )}
            </h2>
          </div>

          <StatusBadge
            status={
              kyc.status === "verified"
                ? "success"
                : kyc.status === "pending_review"
                ? "pending"
                : kyc.status === "rejected" || kyc.status === "requires_resubmission"
                ? "error"
                : "neutral"
            }
            label={kyc.statusLabel}
            size="md"
            showIcon
          />
        </div>

        {/* Detailed Explanation / Requirements */}
        <div className="text-xs text-muted-foreground space-y-3 leading-relaxed">
          {kyc.status === "verified" && (
            <p className="text-emerald-700 dark:text-emerald-400 font-medium">
              ✅ Your driver&apos;s license and identity credentials have been verified by Veyra. You are eligible for contactless key handover at all Butuan City barangay pickup hubs.
            </p>
          )}

          {kyc.status === "pending_review" && (
            <p className="text-amber-700 dark:text-amber-400 font-medium">
              ⏳ Documents received. Our local operations team is reviewing your credentials. Average turnaround is under 15 minutes.
            </p>
          )}

          {(kyc.status === "rejected" || kyc.status === "requires_resubmission") && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-destructive space-y-1">
              <span className="font-semibold block">Rejection Reason:</span>
              <p>{kyc.rejectionReason || "Uploaded document was unreadable or failed verification. Please upload a clear replacement photocard."}</p>
            </div>
          )}

          {kyc.status === "not_submitted" && (
            <p>
              Before driving any Veyra vehicle, Philippine LTO regulations require an official physical photocard driver&apos;s license and a primary government ID on file. Upload your documents below to complete verification. Proof of billing or address is not required for clearance.
            </p>
          )}
        </div>
      </div>

      {/* Security & Privacy Notice */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
        <RiShieldCheckLine className="size-4 shrink-0 mt-0.5 text-primary" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Bank-Grade Privacy & Protection:</strong>{" "}
          All submitted documents are transferred via TLS 1.3, encrypted at rest in isolated private storage, and only accessible by credentialed Veyra verification specialists via temporary signed URLs. Document files and ID numbers are never exposed publicly.
        </p>
      </div>

      {/* Mandatory Identity Documents Checklist */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
              Mandatory KYC Identity Checklist
            </h3>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-semibold uppercase">
              Required for Rental Clearance
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Both an official driver&apos;s license and a primary government ID are required under Philippine LTO guidelines before vehicle key handover.
          </p>
        </div>

        <div className="space-y-4">
          {mandatoryCards.map((doc) => {
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
                      <h4 className="font-heading text-base font-semibold text-foreground">{doc.title}</h4>
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
      </div>

      {/* Optional Supplemental Documents Section */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Optional Supplemental Documents
            </h3>
            <span className="text-[10px] bg-muted text-muted-foreground border px-2 py-0.5 rounded font-medium uppercase">
              Not Required for Booking
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Proof of billing or address (utility bill, bank statement, or lease contract) is entirely optional. It is never required to complete customer KYC verification or confirm a vehicle rental.
          </p>
        </div>

        <div className="space-y-4">
          {optionalCards.map((doc) => {
            const config = documentStatusMap[doc.status]

            return (
              <div
                key={doc.id}
                className="rounded-xl border border-dashed bg-card/50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-5 shadow-xs"
              >
                {/* Status Icon */}
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40"
                  aria-hidden="true"
                >
                  <RiFileList3Line className="size-5 text-muted-foreground" />
                </div>

                {/* Document Info */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div>
                      <h4 className="font-heading text-base font-semibold text-foreground">{doc.title}</h4>
                      <span className="text-[10px] text-muted-foreground bg-muted border px-2 py-0.5 rounded font-medium mt-1 inline-block">
                        Optional Document • Not Required
                      </span>
                    </div>
                    <StatusBadge
                      status={doc.status === "not_uploaded" ? "neutral" : config.badge}
                      label={doc.status === "not_uploaded" ? "Optional • Not Submitted" : doc.statusLabel}
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
