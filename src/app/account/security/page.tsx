import * as React from "react"
import { MOCK_SECURITY_SESSIONS } from "@/lib/mock/customer"
import { AccountHeader } from "@/features/account/components/account-header"
import {
  RiShieldKeyholeLine,
  RiInformationLine,
  RiComputerLine,
  RiSmartphoneLine,
  RiMapPinLine,
  RiTimeLine,
  RiAlertLine,
} from "@remixicon/react"

export default function SecurityPage() {
  const sessions = MOCK_SECURITY_SESSIONS

  return (
    <div className="space-y-8">
      <AccountHeader
        title="Security & Access"
        description="Manage your password, two-factor authentication, and active login sessions."
      />

      {/* Prototype Notice */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-900 dark:text-amber-300 flex gap-2.5 items-start">
        <RiAlertLine className="size-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Prototype Notice:</strong>{" "}
          Security controls on this page are display-only. Password changes, MFA configuration, and session management will be provided by Clerk when real authentication is connected. No actions here persist or affect real account security.
        </p>
      </div>

      {/* Password */}
      <section className="rounded-xl border bg-card p-6 space-y-5" aria-labelledby="password-heading">
        <h2 id="password-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          <RiShieldKeyholeLine className="size-4 text-primary" />
          Password
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Account Password</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last changed: <span className="font-mono">January 2024</span>
            </p>
          </div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Password management will be available via Clerk"
            className="text-xs font-medium text-muted-foreground border border-dashed border-border px-3 py-1.5 rounded-lg cursor-not-allowed opacity-70 inline-flex items-center gap-1.5"
          >
            <span>Change Password</span>
            <span className="text-[10px] px-1.5 rounded bg-muted">Prototype</span>
          </button>
        </div>
      </section>

      {/* Two-Factor Authentication */}
      <section className="rounded-xl border bg-card p-6 space-y-5" aria-labelledby="mfa-heading">
        <h2 id="mfa-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          Two-Factor Authentication
        </h2>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b">
            <div>
              <p className="text-sm font-medium text-foreground">Authenticator App (TOTP)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Time-based one-time password via authenticator application</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              Enabled
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">SMS Backup Code</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fallback OTP via registered mobile number</p>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
              Not Active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="text-xs font-medium text-muted-foreground border border-dashed border-border px-3 py-1.5 rounded-lg cursor-not-allowed opacity-70 inline-flex items-center gap-1.5"
          >
            <span>Manage 2FA Settings</span>
            <span className="text-[10px] px-1.5 rounded bg-muted">Prototype</span>
          </button>
        </div>
      </section>

      {/* Active Sessions */}
      <section className="rounded-xl border bg-card p-6 space-y-5" aria-labelledby="sessions-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="sessions-heading" className="font-heading text-base font-bold text-foreground">
            Active Login Sessions
          </h2>
          <span className="text-xs text-muted-foreground">{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => {
            const DeviceIcon = session.device.includes("iPhone") || session.device.includes("Mobile") || session.device.includes("Android")
              ? RiSmartphoneLine
              : RiComputerLine

            return (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-background/50"
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 rounded-lg border bg-muted shrink-0">
                    <DeviceIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{session.device}</span>
                      {session.isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{session.browser}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <RiMapPinLine className="size-3" />
                        <span>{session.location}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <RiTimeLine className="size-3" />
                        <span>{session.lastActive}</span>
                      </span>
                      <span>·</span>
                      <span className="font-mono">{session.ipAddressMasked}</span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="text-xs font-medium text-muted-foreground border border-dashed border-border px-3 py-1.5 rounded-lg cursor-not-allowed opacity-70 shrink-0 self-start sm:self-center"
                  >
                    Revoke (Prototype)
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground flex gap-2">
          <RiInformationLine className="size-4 text-primary shrink-0 mt-0.5" />
          <p>
            Session management including revoking individual sessions and signing out all other devices will be powered by Clerk in the production build.
          </p>
        </div>
      </section>
    </div>
  )
}
