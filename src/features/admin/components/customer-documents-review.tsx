"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AdminCustomerDocument } from "@/features/admin/types"
import {
  getAdminDocumentSignedUrlAction,
  reviewCustomerDocumentAction,
} from "@/features/admin/server/admin-actions"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  RiFileList3Line,
  RiExternalLinkLine,
  RiCheckLine,
  RiCloseLine,
  RiLoader4Line,
  RiAlertLine,
  RiCalendarLine,
  RiHardDrive2Line,
} from "@remixicon/react"

interface CustomerDocumentsReviewProps {
  customerId: string
  documents: AdminCustomerDocument[]
}

const DOCUMENT_TITLES: Record<string, string> = {
  driver_license: "Official Driver's License",
  government_id: "Government-Issued ID",
  passport: "Passport",
  address_proof: "Proof of Address",
}

const STATUS_MAP: Record<
  AdminCustomerDocument["status"],
  { badge: StatusType; label: string }
> = {
  pending_review: { badge: "pending", label: "Pending Review" },
  approved: { badge: "success", label: "Approved & Verified" },
  rejected: { badge: "error", label: "Rejected" },
  expired: { badge: "warning", label: "Expired" },
}

export function CustomerDocumentsReview({
  documents,
}: CustomerDocumentsReviewProps) {
  const router = useRouter()
  const [openingDocId, setOpeningDocId] = React.useState<string | null>(null)
  const [actingDocId, setActingDocId] = React.useState<string | null>(null)
  const [rejectingDocId, setRejectingDocId] = React.useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null)

  const handleView = async (docId: string) => {
    setOpeningDocId(docId)
    setActionError(null)
    try {
      const res = await getAdminDocumentSignedUrlAction(docId)
      if (res.success && res.data?.signedUrl) {
        window.open(res.data.signedUrl, "_blank", "noopener,noreferrer")
      } else {
        setActionError(res.message || "Failed to generate document link.")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error opening document.")
    } finally {
      setOpeningDocId(null)
    }
  }

  const handleApprove = async (docId: string) => {
    setActingDocId(docId)
    setActionError(null)
    setActionSuccess(null)
    try {
      const res = await reviewCustomerDocumentAction(docId, "approved")
      if (res.success) {
        setActionSuccess("Document approved and verified.")
        router.refresh()
      } else {
        setActionError(res.message || "Approval failed.")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error approving document.")
    } finally {
      setActingDocId(null)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingDocId) return
    setActingDocId(rejectingDocId)
    setActionError(null)
    setActionSuccess(null)
    try {
      const res = await reviewCustomerDocumentAction(
        rejectingDocId,
        "rejected",
        rejectionReason.trim() || undefined
      )
      if (res.success) {
        setActionSuccess("Document rejected. Notification recorded.")
        setRejectingDocId(null)
        setRejectionReason("")
        router.refresh()
      } else {
        setActionError(res.message || "Rejection failed.")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error rejecting document.")
    } finally {
      setActingDocId(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <section className="rounded-lg border bg-card p-5 space-y-4" aria-labelledby="docs-review-heading">
      <div className="flex items-center justify-between">
        <h2 id="docs-review-heading" className="font-heading text-sm font-bold flex items-center gap-2">
          <RiFileList3Line className="size-4 text-primary" />
          Verification Documents ({documents.length})
        </h2>
      </div>

      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <RiAlertLine className="size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <RiCheckLine className="size-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="p-4 rounded-lg border border-dashed bg-background/50 text-xs text-muted-foreground text-center">
          No verification documents uploaded yet by this customer.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const statusConfig = STATUS_MAP[doc.status] || {
              badge: "neutral",
              label: doc.status,
            }
            const isProcessing = actingDocId === doc.id
            const isOpening = openingDocId === doc.id

            return (
              <div
                key={doc.id}
                className="p-4 rounded-lg border bg-background/50 text-sm space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">
                      {DOCUMENT_TITLES[doc.type] || doc.type}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {doc.originalFilename}
                    </div>
                  </div>
                  <StatusBadge
                    status={statusConfig.badge}
                    label={statusConfig.label}
                    size="sm"
                    showIcon
                  />
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1">
                    <RiHardDrive2Line className="size-3.5" />
                    <span>{formatFileSize(doc.fileSizeBytes)}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <RiCalendarLine className="size-3.5" />
                    <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                  </span>
                  {doc.expiresAt && (
                    <>
                      <span>·</span>
                      <span>Expires {new Date(doc.expiresAt).toLocaleDateString()}</span>
                    </>
                  )}
                  {doc.reviewedAt && (
                    <>
                      <span>·</span>
                      <span>Reviewed {new Date(doc.reviewedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                {/* Rejection reason callout */}
                {doc.status === "rejected" && doc.rejectionReason && (
                  <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive flex items-start gap-2">
                    <RiCloseLine className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Rejection Note:</strong> {doc.rejectionReason}
                    </div>
                  </div>
                )}

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isOpening}
                    onClick={() => handleView(doc.id)}
                    className="gap-1 text-xs"
                  >
                    {isOpening ? (
                      <RiLoader4Line className="size-3.5 animate-spin" />
                    ) : (
                      <RiExternalLinkLine className="size-3.5" />
                    )}
                    <span>Inspect File</span>
                  </Button>

                  {doc.status !== "approved" && (
                    <Button
                      type="button"
                      variant="default"
                      size="xs"
                      disabled={isProcessing}
                      onClick={() => handleApprove(doc.id)}
                      className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isProcessing ? (
                        <RiLoader4Line className="size-3.5 animate-spin" />
                      ) : (
                        <RiCheckLine className="size-3.5" />
                      )}
                      <span>Approve & Verify</span>
                    </Button>
                  )}

                  {doc.status !== "rejected" && (
                    <Dialog
                      open={rejectingDocId === doc.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setRejectingDocId(null)
                          setRejectionReason("")
                        }
                      }}
                    >
                      <DialogTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={isProcessing}
                            onClick={() => setRejectingDocId(doc.id)}
                            className="gap-1 text-xs text-destructive hover:bg-destructive/10"
                          />
                        }
                      >
                        <RiCloseLine className="size-3.5" />
                        <span>Reject</span>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleReject}>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                              <RiAlertLine className="size-5" />
                              Reject Document Verification
                            </DialogTitle>
                            <DialogDescription>
                              Specify why this document is being rejected so the customer can upload an acceptable replacement.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-3 py-4">
                            <Label htmlFor="reject-reason" className="text-xs font-medium">
                              Reason for Rejection
                            </Label>
                            <Textarea
                              id="reject-reason"
                              placeholder="e.g. Image blurry, name does not match profile, or expired photocard."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={3}
                              className="text-xs resize-none"
                              required
                            />
                          </div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingDocId(null)
                                setRejectionReason("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                              disabled={!rejectionReason.trim() || isProcessing}
                              className="gap-1.5"
                            >
                              {isProcessing ? (
                                <RiLoader4Line className="size-3.5 animate-spin" />
                              ) : (
                                <RiCloseLine className="size-3.5" />
                              )}
                              <span>Confirm Rejection</span>
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
