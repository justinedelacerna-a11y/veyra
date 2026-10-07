"use client"

import * as React from "react"
import { useUser, useSession, useClerk } from "@clerk/nextjs"
import { AccountHeader } from "@/features/account/components/account-header"
import { StatusBadge } from "@/components/common/status-badge"
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
import {
  RiShieldKeyholeLine,
  RiShieldCheckLine,
  RiSmartphoneLine,
  RiComputerLine,
  RiMapPinLine,
  RiTimeLine,
  RiLogoutBoxRLine,
  RiKey2Line,
  RiLoader4Line,
  RiCheckLine,
  RiAlertLine,
  RiUserSettingsLine,
  RiInformationLine,
  RiRefreshLine,
} from "@remixicon/react"

type UserSessionWithActivity = Awaited<
  ReturnType<NonNullable<ReturnType<typeof useUser>["user"]>["getSessions"]>
>[number]

function maskIp(ip?: string | null): string {
  if (!ip) return "Protected IP"
  const parts = ip.split(".")
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`
  }
  if (ip.includes(":")) {
    const v6Parts = ip.split(":")
    return `${v6Parts[0]}:${v6Parts[1]}:****:****`
  }
  return "***.***"
}

function formatRelativeTime(date?: Date | null): string {
  if (!date) return "Recently"
  const now = Date.now()
  const diffMs = now - new Date(date).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 60) return "Active just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  return `${diffDays}d ago`
}

export function AccountSecurityView() {
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser()
  const { session: currentSession, isLoaded: isCurrentSessionLoaded } = useSession()
  const clerk = useClerk()

  const [sessions, setSessions] = React.useState<UserSessionWithActivity[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(true)
  const [loadSessionsError, setLoadSessionsError] = React.useState<string | null>(null)

  const [revokingSessionId, setRevokingSessionId] = React.useState<string | null>(null)
  const [isRevokingAllOthers, setIsRevokingAllOthers] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [confirmSignOutOpen, setConfirmSignOutOpen] = React.useState(false)
  const [confirmRevokeId, setConfirmRevokeId] = React.useState<string | null>(null)

  const handleRefreshSessions = React.useCallback(async () => {
    if (!user) return
    setIsLoadingSessions(true)
    setLoadSessionsError(null)
    try {
      const list = await user.getSessions()
      setSessions(list || [])
    } catch (err) {
      console.error("[AccountSecurityView] Error loading sessions:", err)
      setLoadSessionsError(err instanceof Error ? err.message : "Unable to retrieve active sessions.")
    } finally {
      setIsLoadingSessions(false)
    }
  }, [user])

  React.useEffect(() => {
    let isCancelled = false
    if (user) {
      user
        .getSessions()
        .then((list) => {
          if (!isCancelled) {
            setSessions(list || [])
            setIsLoadingSessions(false)
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error("[AccountSecurityView] Error loading sessions:", err)
            setLoadSessionsError(
              err instanceof Error ? err.message : "Unable to retrieve active sessions."
            )
            setIsLoadingSessions(false)
          }
        })
    }
    return () => {
      isCancelled = true
    }
  }, [user])

  const isInitialLoading = !isUserLoaded || !isCurrentSessionLoaded

  const handleOpenClerkProfile = () => {
    clerk.openUserProfile()
  }

  const handleRevokeSession = async (sessionId: string) => {
    setActionError(null)
    setActionSuccess(null)
    setRevokingSessionId(sessionId)
    try {
      const targetSession = sessions.find((s) => s.id === sessionId)
      if (targetSession) {
        await targetSession.revoke()
        setActionSuccess("Session revoked successfully. Device signed out.")
        setConfirmRevokeId(null)
        await handleRefreshSessions()
      } else {
        setActionError("Session not found or already expired.")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to revoke session.")
    } finally {
      setRevokingSessionId(null)
    }
  }

  const handleRevokeAllOtherSessions = async () => {
    if (!sessions.length || !currentSession) return
    setActionError(null)
    setActionSuccess(null)
    setIsRevokingAllOthers(true)
    try {
      const otherSessions = sessions.filter((s) => s.id !== currentSession.id)
      for (const s of otherSessions) {
        await s.revoke()
      }
      setActionSuccess(`Revoked ${otherSessions.length} other session${otherSessions.length !== 1 ? "s" : ""}.`)
      await handleRefreshSessions()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to revoke other sessions.")
    } finally {
      setIsRevokingAllOthers(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await clerk.signOut({ redirectUrl: "/sign-in" })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to sign out.")
      setIsSigningOut(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded-md" />
          <div className="h-4 w-96 bg-muted/60 rounded-md" />
        </div>
        <div className="h-20 bg-muted/40 rounded-xl border border-dashed" />
        <div className="h-40 bg-card rounded-xl border" />
        <div className="h-60 bg-card rounded-xl border" />
        <div className="h-60 bg-card rounded-xl border" />
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div className="space-y-6">
        <AccountHeader
          title="Security & Access"
          description="Authentication required to manage security credentials."
        />
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <RiShieldKeyholeLine className="size-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Please sign in to access your security portal.</p>
          <Button onClick={() => clerk.redirectToSignIn()} size="sm">
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress || "Not configured"
  const isEmailVerified = user.primaryEmailAddress?.verification?.status === "verified"
  const isPasswordConfigured = user.passwordEnabled
  const isTwoFactorActive = user.twoFactorEnabled
  const hasBackupCodes = user.backupCodeEnabled
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Active Member"
  const lastSignIn = user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Current session"

  const otherSessionsCount = sessions.filter((s) => s.id !== currentSession?.id).length

  return (
    <div className="space-y-8">
      <AccountHeader
        title="Security & Access"
        description="Manage your credentials, multi-factor verification, and active authenticated sessions."
      />

      {/* Live Security Badge Notice */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
        <RiShieldCheckLine className="size-4 shrink-0 mt-0.5 text-primary" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Clerk Managed Identity Protection:</strong>{" "}
          Your session tokens and identity credentials are cryptographically verified by Clerk. Passwords, biometric passkeys, and two-factor authentication are securely managed without storing plaintext credentials in application databases.
        </p>
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

      {/* Account Identity Information */}
      <section className="rounded-xl border bg-card p-6 space-y-4 shadow-xs" aria-labelledby="identity-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="identity-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <RiUserSettingsLine className="size-4 text-primary" />
            Signed-In Account Identity
          </h2>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleOpenClerkProfile}
            className="text-xs gap-1.5"
          >
            <RiUserSettingsLine className="size-3.5" />
            <span>Manage Clerk Profile</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm pt-2">
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Primary Email</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-foreground">{primaryEmail}</span>
              {isEmailVerified && (
                <StatusBadge status="success" label="Verified" size="sm" />
              )}
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Account ID</span>
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {user.id ? `${user.id.slice(0, 10)}...${user.id.slice(-4)}` : "Verified ID"}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Member Since</span>
            <span className="font-medium text-foreground">{memberSince}</span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Last Authenticated</span>
            <span className="font-medium text-foreground">{lastSignIn}</span>
          </div>
        </div>
      </section>

      {/* Credentials & Multi-Factor Authentication */}
      <section className="rounded-xl border bg-card p-6 space-y-5 shadow-xs" aria-labelledby="credentials-heading">
        <h2 id="credentials-heading" className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          <RiKey2Line className="size-4 text-primary" />
          Authentication & Credentials
        </h2>

        {/* Password */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Password Credentials</span>
              <StatusBadge
                status={isPasswordConfigured ? "success" : "neutral"}
                label={isPasswordConfigured ? "Active Password" : "Passwordless / SSO"}
                size="sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isPasswordConfigured
                ? "Your account is protected by an encrypted password."
                : "Your account authenticates via verified email OTP or connected social provider."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenClerkProfile}
            className="text-xs gap-1.5 shrink-0 self-start sm:self-center"
          >
            <span>{isPasswordConfigured ? "Change Password" : "Set Up Password"}</span>
          </Button>
        </div>

        {/* Two-Factor Authentication */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Multi-Factor Authentication (2FA)</span>
              <StatusBadge
                status={isTwoFactorActive ? "success" : "warning"}
                label={isTwoFactorActive ? "2FA Enabled" : "2FA Recommended"}
                size="sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isTwoFactorActive
                ? "Time-based one-time password (TOTP) or SMS security codes active on sign-in."
                : "Add an extra layer of security to prevent unauthorized access to your bookings."}
              {hasBackupCodes && " · Backup recovery codes generated."}
            </p>
          </div>
          <Button
            type="button"
            variant={isTwoFactorActive ? "outline" : "default"}
            size="sm"
            onClick={handleOpenClerkProfile}
            className="text-xs gap-1.5 shrink-0 self-start sm:self-center"
          >
            <RiShieldCheckLine className="size-3.5" />
            <span>{isTwoFactorActive ? "Manage 2FA" : "Enable 2FA Protection"}</span>
          </Button>
        </div>
      </section>

      {/* Active Login Sessions & Devices */}
      <section className="rounded-xl border bg-card p-6 space-y-5 shadow-xs" aria-labelledby="sessions-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="sessions-heading" className="font-heading text-base font-bold text-foreground">
                Active Login Sessions & Devices
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={isLoadingSessions}
                onClick={() => handleRefreshSessions()}
                title="Refresh sessions"
                className="h-6 w-6 p-0"
              >
                <RiRefreshLine className={`size-3.5 ${isLoadingSessions ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Authorized client sessions currently registered to your Veyra account.
            </p>
          </div>

          {otherSessionsCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isRevokingAllOthers}
              onClick={handleRevokeAllOtherSessions}
              className="text-xs text-destructive hover:bg-destructive/10 shrink-0 self-start sm:self-center gap-1.5"
            >
              {isRevokingAllOthers ? (
                <RiLoader4Line className="size-3.5 animate-spin" />
              ) : (
                <RiLogoutBoxRLine className="size-3.5" />
              )}
              <span>Sign Out All Other Devices</span>
            </Button>
          )}
        </div>

        {loadSessionsError && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between gap-2">
            <span>{loadSessionsError}</span>
            <Button size="xs" variant="outline" onClick={() => handleRefreshSessions()}>
              Retry
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {isLoadingSessions && sessions.length === 0 ? (
            <div className="p-6 rounded-lg border border-dashed text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RiLoader4Line className="size-4 animate-spin text-primary" />
              <span>Querying verified Clerk session registry...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground text-center">
              Active session registered on current device.
            </div>
          ) : (
            sessions.map((sessionItem) => {
              const isCurrent = sessionItem.id === currentSession?.id
              const activity = sessionItem.latestActivity
              const isMobile = activity?.isMobile || activity?.deviceType?.toLowerCase().includes("iphone") || activity?.deviceType?.toLowerCase().includes("android")
              const DeviceIcon = isMobile ? RiSmartphoneLine : RiComputerLine
              const deviceName = activity?.deviceType || (isMobile ? "Mobile Device" : "Desktop Workstation")
              const browserInfo = [activity?.browserName, activity?.browserVersion].filter(Boolean).join(" ") || "Verified Web Session"
              const locationInfo = [activity?.city, activity?.country].filter(Boolean).join(", ") || "Current Network"
              const maskedIpAddress = maskIp(activity?.ipAddress)
              const lastActiveText = isCurrent ? "Active now" : formatRelativeTime(sessionItem.lastActiveAt)
              const isThisRevoking = revokingSessionId === sessionItem.id

              return (
                <div
                  key={sessionItem.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-background/50"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 p-2 rounded-lg border bg-muted shrink-0" aria-hidden="true">
                      <DeviceIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{deviceName}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{browserInfo}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <RiMapPinLine className="size-3" />
                          <span>{locationInfo}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <RiTimeLine className="size-3" />
                          <span>{lastActiveText}</span>
                        </span>
                        <span>·</span>
                        <span className="font-mono text-[11px]">{maskedIpAddress}</span>
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <Dialog
                      open={confirmRevokeId === sessionItem.id}
                      onOpenChange={(open) => !open && setConfirmRevokeId(null)}
                    >
                      <DialogTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={isThisRevoking}
                            onClick={() => setConfirmRevokeId(sessionItem.id)}
                            className="text-xs font-medium text-destructive hover:bg-destructive/10 shrink-0 self-start sm:self-center"
                          />
                        }
                      >
                        {isThisRevoking ? (
                          <>
                            <RiLoader4Line className="size-3 animate-spin" />
                            <span>Revoking...</span>
                          </>
                        ) : (
                          <span>Revoke Access</span>
                        )}
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Revoke Session Access?</DialogTitle>
                          <DialogDescription>
                            This will immediately terminate the session on {deviceName} ({browserInfo}). The user on that device will be signed out.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isThisRevoking}
                            onClick={() => setConfirmRevokeId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isThisRevoking}
                            onClick={() => handleRevokeSession(sessionItem.id)}
                            className="gap-1.5"
                          >
                            {isThisRevoking ? (
                              <RiLoader4Line className="size-3.5 animate-spin" />
                            ) : (
                              <RiLogoutBoxRLine className="size-3.5" />
                            )}
                            <span>Confirm Revoke</span>
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground flex gap-2">
          <RiInformationLine className="size-4 text-primary shrink-0 mt-0.5" />
          <p>
            Revoking a session immediately invalidates its authentication credentials on the remote device. If you detect unfamiliar activity, revoke the session and change your password immediately.
          </p>
        </div>
      </section>

      {/* Account Sign Out Section */}
      <section className="rounded-xl border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs" aria-labelledby="signout-heading">
        <div className="space-y-1">
          <h2 id="signout-heading" className="font-heading text-sm font-bold text-foreground">
            Sign Out of Veyra
          </h2>
          <p className="text-xs text-muted-foreground">
            End your authenticated session on this browser. You can sign back in at any time.
          </p>
        </div>

        <Dialog open={confirmSignOutOpen} onOpenChange={setConfirmSignOutOpen}>
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 shrink-0 self-start sm:self-center"
              />
            }
          >
            <RiLogoutBoxRLine className="size-3.5" />
            <span>Sign Out</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RiLogoutBoxRLine className="size-5 text-destructive" />
                Sign Out of Your Account?
              </DialogTitle>
              <DialogDescription>
                You will be signed out of your current session on this device and redirected to the login screen.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSigningOut}
                onClick={() => setConfirmSignOutOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="gap-1.5"
              >
                {isSigningOut ? (
                  <RiLoader4Line className="size-3.5 animate-spin" />
                ) : (
                  <RiLogoutBoxRLine className="size-3.5" />
                )}
                <span>Sign Out</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  )
}
