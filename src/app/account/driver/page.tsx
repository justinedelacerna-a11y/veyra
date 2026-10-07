import * as React from "react"
import { getCustomerDriverProfile } from "@/features/account/server"
import { AccountHeader } from "@/features/account/components/account-header"
import { StatusBadge } from "@/components/common/status-badge"
import {
  RiShieldCheckLine,
  RiInformationLine,
  RiIdCardLine,
  RiAlertLine,
} from "@remixicon/react"

const verificationStatusMap = {
  verified: { status: "success" as const, label: "Verified" },
  pending: { status: "pending" as const, label: "Verification Pending" },
  needs_update: { status: "warning" as const, label: "Update Required" },
}

export default async function DriverPage() {
  const driver = await getCustomerDriverProfile()
  const statusConfig = verificationStatusMap[driver.verificationStatus]

  return (
    <div className="space-y-8">
      <AccountHeader
        title="Driver Information"
        description="Your rental driver profile and license details used for vehicle handover verification."
      />

      {/* Sensitive Data Notice */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-900 dark:text-amber-300 flex gap-2.5 items-start">
        <RiAlertLine className="size-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Privacy Notice:</strong>{" "}
          Driver license details are encrypted and securely stored for reservation validation and insurance compliance. Complete credential management is handled securely via Clerk and Supabase.
        </p>
      </div>

      {/* License & Verification Card */}
      <section className="rounded-xl border bg-card p-6 space-y-5" aria-labelledby="license-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="license-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <RiIdCardLine className="size-4 text-primary" />
            Driver&apos;s License Details
          </h2>
          <StatusBadge
            status={statusConfig.status}
            label={statusConfig.label}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: "Full Legal Name", value: driver.fullName },
            { label: "Date of Birth", value: driver.dateOfBirth },
            { label: "License Number (Masked)", value: driver.licenseNumberMasked, mono: true },
            { label: "Issuing Authority", value: driver.licenseCountry },
            { label: "License Class", value: driver.licenseClass },
            { label: "License Expiry", value: driver.licenseExpiry },
            { label: "Issue Date", value: driver.issueDate },
            { label: "Points & Violations", value: driver.pointsOrViolations },
          ].map(({ label, value, mono }) => (
            <div key={label} className="p-3.5 rounded-lg border bg-background/50 space-y-1">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
              <div className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Verification Details */}
      <section className="rounded-xl border bg-card p-6 space-y-4" aria-labelledby="verification-heading">
        <h2 id="verification-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          <RiShieldCheckLine className="size-4 text-primary" />
          Verification & Eligibility
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
            <div>
              <div className="font-medium text-foreground">Rental Eligibility Status</div>
              <div className="text-xs text-muted-foreground mt-0.5">Based on license validation and driving record check</div>
            </div>
            <StatusBadge status={statusConfig.status} label={statusConfig.label} size="sm" />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
            <div>
              <div className="font-medium text-foreground">Standard Insurance Eligibility</div>
              <div className="text-xs text-muted-foreground mt-0.5">Compliant with Veyra liability waiver requirements</div>
            </div>
            <StatusBadge status="success" label="Eligible" size="sm" />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-medium text-foreground">International Driving Permit (IDP)</div>
              <div className="text-xs text-muted-foreground mt-0.5">Required only for non-Philippine license holders</div>
            </div>
            <StatusBadge status="neutral" label="Not Applicable" size="sm" />
          </div>
        </div>
      </section>

      {/* Physical License Reminder */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-foreground flex gap-2.5 items-start">
        <RiInformationLine className="size-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Handover Requirement:</strong>{" "}
          Your physical driver&apos;s license card must be presented in-person at the vehicle handover bay. Digital or photocopied versions cannot be accepted under LTO rental regulations.
        </p>
      </div>
    </div>
  )
}
