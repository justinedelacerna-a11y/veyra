import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import {
  RiShieldCheckLine,
  RiBuilding2Line,
  RiMoneyDollarCircleLine,
  RiCarLine,
  RiAlertLine,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "Settings — Veyra Operations",
  description: "System configuration and operational settings for Veyra.",
  robots: { index: false, follow: false },
}

export default async function AdminSettingsPage() {
  const staff = await requireAdminStaff(["admin", "superadmin"])

  const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true"
  const ownerEmailConfigured = Boolean(process.env.VEYRA_OWNER_EMAIL)
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Platform configuration, security settings, and operational parameters."
      />

      {/* Config status grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Supabase", configured: supabaseConfigured },
          { label: "Clerk Auth", configured: clerkConfigured },
          { label: "Payments Enabled", configured: paymentsEnabled },
          { label: "Owner Email Set", configured: ownerEmailConfigured },
          { label: "Service Role Key", configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
          { label: "Webhook Secret", configured: Boolean(process.env.CLERK_WEBHOOK_SIGNING_SECRET) },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <span className="text-xs font-medium">{item.label}</span>
            <StatusBadge
              status={item.configured ? "success" : "warning"}
              label={item.configured ? "Set" : "Not Set"}
              size="sm"
            />
          </div>
        ))}
      </div>

      {/* Business info */}
      <section className="space-y-3">
        <SectionHeader
          title="Business Information"
          badge={<RiBuilding2Line className="size-4 text-muted-foreground" />}
        />
        <div className="rounded-lg border bg-card divide-y">
          {[
            { label: "Business Name", value: "Veyra Car Rental" },
            { label: "Location", value: "Butuan City, Agusan del Norte, Philippines" },
            { label: "Currency", value: "Philippine Peso (₱ PHP)" },
            { label: "Timezone", value: "Asia/Manila (UTC+8)" },
            { label: "Business Hours", value: "Configurable per location" },
          ].map((item) => (
            <div key={item.label} className="p-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{item.label}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature flags */}
      <section className="space-y-3">
        <SectionHeader
          title="Feature Flags"
          badge={<StatusBadge status="info" label="Runtime" size="sm" />}
        />
        <div className="rounded-lg border bg-card divide-y">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Online Payments</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable PayMongo payment processing. Set PAYMENTS_ENABLED=true and configure PayMongo credentials.
              </p>
            </div>
            <StatusBadge
              status={paymentsEnabled ? "success" : "warning"}
              label={paymentsEnabled ? "Enabled" : "Disabled (Counter Pay)"}
              size="sm"
            />
          </div>
        </div>
      </section>

      {/* Authentication & access */}
      <section className="space-y-3">
        <SectionHeader
          title="Authentication & Authorization"
          badge={<RiShieldCheckLine className="size-4 text-muted-foreground" />}
        />
        <div className="rounded-lg border bg-card divide-y text-sm">
          <div className="p-4">
            <p className="font-medium mb-1">Authentication Provider</p>
            <p className="text-xs text-muted-foreground">Clerk — handles all user authentication, sessions, and MFA.</p>
          </div>
          <div className="p-4">
            <p className="font-medium mb-1">Authorization Model</p>
            <p className="text-xs text-muted-foreground">
              Role-based access control (RBAC) enforced at two layers:
              (1) Next.js Server Actions / Route Handlers — first line of defense.
              (2) Supabase Row-Level Security (RLS) policies — database-level enforcement.
              Customers cannot self-assign admin roles. Role changes require superadmin via Supabase.
            </p>
          </div>
          <div className="p-4">
            <p className="font-medium mb-1">Owner / Superadmin Email</p>
            <p className="text-xs text-muted-foreground">
              {ownerEmailConfigured
                ? "Configured via VEYRA_OWNER_EMAIL environment variable."
                : "Not configured. Set VEYRA_OWNER_EMAIL in your environment to designate the owner email."}
            </p>
          </div>
          <div className="p-4">
            <p className="font-medium mb-1">Your Access Level</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status="warning" label={staff.role.replace(/_/g, " ")} size="sm" />
              <span className="text-xs text-muted-foreground">{staff.email}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing rules */}
      <section className="space-y-3">
        <SectionHeader
          title="Pricing Architecture"
          badge={<RiMoneyDollarCircleLine className="size-4 text-muted-foreground" />}
        />
        <div className="rounded-lg border bg-card p-4 text-sm">
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>• All prices stored in centavos (minor units) in the database</li>
            <li>• Displayed and reported in Philippine Peso (₱)</li>
            <li>• Pricing calculated exclusively server-side — client cannot send totals</li>
            <li>• Quote snapshots preserve historical pricing (changing prices does not affect past bookings)</li>
            <li>• Deposit, base rental, extras, and taxes are separate line items in quotes</li>
          </ul>
        </div>
      </section>

      {/* Reservation system */}
      <section className="space-y-3">
        <SectionHeader
          title="Reservation State Machine"
          badge={<RiCarLine className="size-4 text-muted-foreground" />}
        />
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap gap-2 text-[11px]">
            {[
              "draft", "quote_created", "held", "payment_pending", "confirmed",
              "pickup_ready", "active", "return_inspection", "completed",
            ].map((state, i, arr) => (
              <React.Fragment key={state}>
                <span className="px-2 py-1 rounded bg-muted text-muted-foreground font-mono">{state}</span>
                {i < arr.length - 1 && <span className="text-muted-foreground self-center">→</span>}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Terminal states: <span className="font-mono">expired · payment_failed · cancelled · no_show · disputed</span>
          </p>
        </div>
      </section>

      {/* Security notice */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
        <RiAlertLine className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <strong className="text-amber-600 dark:text-amber-400">Security Notice:</strong>{" "}
          Environment variables and secrets are managed at the deployment level (.env.local / Vercel environment variables).
          Never expose SUPABASE_SERVICE_ROLE_KEY, CLERK_SECRET_KEY, or CLERK_WEBHOOK_SIGNING_SECRET to the browser.
          Settings that require code changes (e.g., payment providers) must be deployed by a developer.
        </div>
      </div>
    </div>
  )
}
