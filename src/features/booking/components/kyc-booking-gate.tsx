"use client"

import * as React from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  RiShieldCheckLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiAlertLine,
  RiArrowRightLine,
  RiFileList3Line,
  RiUserLine,
  RiRefreshLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export type KycStatus =
  | "not_submitted"
  | "pending_review"
  | "verified"
  | "rejected"
  | "requires_resubmission"

export interface KycBookingGateProps {
  onStatusChange?: (isVerified: boolean) => void
  returnUrl?: string
  className?: string
}

interface KycApiResponse {
  authenticated: boolean
  status: KycStatus
  statusLabel: string
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
  hasDriverLicense: boolean
  hasGovernmentId: boolean
  requiredDocumentsUploaded: boolean
}

export function KycBookingGate({
  onStatusChange,
  returnUrl = "/booking/payment",
  className,
}: KycBookingGateProps) {
  const [loading, setLoading] = React.useState(true)
  const [kycData, setKycData] = React.useState<KycApiResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const loadData = React.useCallback(() => {
    setLoading(true)
    setError(null)
    fetch("/api/account/kyc", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to check verification status.")
        return res.json()
      })
      .then((data: KycApiResponse) => {
        setKycData(data)
        const isVerified = data.status === "verified"
        onStatusChange?.(isVerified)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error loading KYC status.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [onStatusChange])

  React.useEffect(() => {
    let active = true
    fetch("/api/account/kyc", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to check verification status.")
        return res.json()
      })
      .then((data: KycApiResponse) => {
        if (!active) return
        setKycData(data)
        const isVerified = data.status === "verified"
        onStatusChange?.(isVerified)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : "Error loading KYC status.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [onStatusChange])

  if (loading) {
    return (
      <div className={cn("rounded-2xl border bg-card/60 p-5 space-y-3 animate-pulse", className)}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-5 w-24 bg-muted rounded-full" />
        </div>
        <div className="h-3 w-4/5 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (error || !kycData) {
    return (
      <Alert className={cn("border-border bg-muted/40", className)}>
        <RiAlertLine className="size-4 text-muted-foreground" />
        <AlertTitle className="text-xs font-bold text-foreground">
          Verification Status Unavailable
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between gap-2 pt-1">
          <span>We could not verify your clearance. Please retry before confirming.</span>
          <Button variant="outline" size="sm" onClick={loadData} className="h-7 text-xs gap-1">
            <RiRefreshLine className="size-3" />
            <span>Retry</span>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Case 1: Unauthenticated
  if (!kycData.authenticated) {
    return (
      <div className={cn("rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiUserLine className="size-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-heading text-sm font-bold text-foreground">
              Sign In Required for Verification
            </h3>
          </div>
          <StatusBadge status="warning" label="Sign In Required" size="sm" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Please log in to your Veyra account so we can verify your identity credentials and clear your vehicle handover.
        </p>
        <Link href={`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`}>
          <Button size="sm" className="gap-1.5 w-full sm:w-auto">
            <span>Log In to Continue</span>
            <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
          </Button>
        </Link>
      </div>
    )
  }

  const encodedReturn = encodeURIComponent(returnUrl)
  const docsUrl = `/account/documents?returnUrl=${encodedReturn}`

  // Case 2: Verified
  if (kycData.status === "verified") {
    return (
      <div className={cn("rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-2", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <RiShieldCheckLine className="size-4.5" />
            <h3 className="font-heading text-sm font-bold">
              Identity Verified & Handover Cleared
            </h3>
          </div>
          <StatusBadge status="success" label="KYC Verified ✅" size="sm" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your government credentials and driver&apos;s license have been verified by Veyra. You are eligible for immediate rental authorization and priority key release.
        </p>
      </div>
    )
  }

  // Case 3: Pending Review
  if (kycData.status === "pending_review") {
    return (
      <div className={cn("rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <RiTimeLine className="size-4.5" />
            <h3 className="font-heading text-sm font-bold">
              Verification Under Review
            </h3>
          </div>
          <StatusBadge status="pending" label="Pending Review ⏳" size="sm" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your uploaded documents are currently being processed by our Butuan operations desk.
          {kycData.submittedAt && ` Submitted on ${kycData.submittedAt}.`}
          Final checkout is unlocked once your credentials receive clearance (typically under 15 minutes).
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link href={docsUrl}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <RiFileList3Line className="size-3.5" />
              <span>View Submitted Documents</span>
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={loadData} className="h-8 text-xs gap-1.5">
            <RiRefreshLine className="size-3.5" />
            <span>Check Update</span>
          </Button>
        </div>
      </div>
    )
  }

  // Case 4: Rejected / Requires Resubmission
  if (kycData.status === "rejected" || kycData.status === "requires_resubmission") {
    return (
      <div className={cn("rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <RiCloseCircleLine className="size-4.5" />
            <h3 className="font-heading text-sm font-bold">
              Verification Needs Resubmission
            </h3>
          </div>
          <StatusBadge status="error" label="Action Required ❌" size="sm" />
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
          <span className="font-semibold block">Reason for rejection:</span>
          <p>{kycData.rejectionReason || "Uploaded document was unreadable, expired, or failed security validation."}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Please upload a clear, unexpired replacement photocard driver&apos;s license to unlock rental completion.
        </p>
        <Link href={docsUrl}>
          <Button size="sm" variant="destructive" className="gap-1.5 w-full sm:w-auto">
            <span>Resubmit Verification Documents</span>
            <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
          </Button>
        </Link>
      </div>
    )
  }

  // Case 5: Not Submitted / Missing
  return (
    <div className={cn("rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <RiShieldCheckLine className="size-4.5" />
          <h3 className="font-heading text-sm font-bold text-foreground">
            Identity Verification Required
          </h3>
        </div>
        <StatusBadge status="warning" label="KYC Missing ⚠️" size="sm" />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Under Philippine Land Transportation Office (LTO) rental rules and insurance policy, every driver must present a verified driver&apos;s license and government ID before vehicle handover.
      </p>

      <div className="rounded-xl border bg-background/80 p-3.5 text-xs space-y-2">
        <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider">
          Required Documents:
        </span>
        <ul className="space-y-1.5 text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            <span><strong>Physical Driver&apos;s License:</strong> Non-Professional or Professional (LTO)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            <span><strong>Primary Government ID:</strong> Passport, UMID, PhilSys National ID, or PRC</span>
          </li>
        </ul>
      </div>

      <div className="pt-1">
        <Link href={docsUrl}>
          <Button size="sm" className="gap-1.5 w-full sm:w-auto shadow-xs">
            <span>Upload Documents to Continue</span>
            <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
