"use client"

import * as React from "react"
import { StaffUser, StaffRole, STAFF_ROLE_LABELS } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { StatusType } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateStaffRoleAction } from "@/features/admin/server/admin-actions"
import { RiShieldUserLine, RiEditLine, RiLoader4Line, RiCheckLine, RiAlertLine } from "@remixicon/react"

const ROLE_FILTERS = [
  { label: "All Roles", value: "all" },
  { label: "Superadmin", value: "superadmin" },
  { label: "Admin", value: "admin" },
  { label: "Fleet Manager", value: "fleet_manager" },
  { label: "Branch Manager", value: "branch_manager" },
  { label: "Branch Staff", value: "branch_staff" },
  { label: "Finance", value: "finance" },
  { label: "Support", value: "support" },
]

const ASSIGNABLE_ROLES: { value: StaffRole; label: string; desc: string }[] = [
  { value: "superadmin", label: "Owner / Superadmin", desc: "Complete master administrative privileges and staff management" },
  { value: "admin", label: "Administrator", desc: "Full operational access across all modules" },
  { value: "fleet_manager", label: "Fleet Manager", desc: "Manage fleet vehicles, telemetry, and maintenance bays" },
  { value: "branch_manager", label: "Branch Manager", desc: "Manage branch reservations, handover, and returns" },
  { value: "branch_staff", label: "Branch Staff", desc: "Front-desk counter operations, check-in, and inspections" },
  { value: "finance", label: "Finance Officer", desc: "Ledger review, payment captures, deposits, and refunds" },
  { value: "support", label: "Customer Support", desc: "View bookings and handle customer inquiries" },
]

const STATUS_BADGE: Record<string, { badge: StatusType; label: string }> = {
  active: { badge: "success", label: "Active" },
  inactive: { badge: "neutral", label: "Inactive" },
  suspended: { badge: "error", label: "Suspended" },
}

const ROLE_BADGE: Record<StaffRole, StatusType> = {
  superadmin: "error",
  admin: "warning",
  fleet_manager: "info",
  branch_manager: "info",
  branch_staff: "neutral",
  finance: "pending",
  support: "neutral",
}

const PAGE_SIZE = 15

interface StaffClientProps {
  initialStaff: StaffUser[]
  currentUserRole?: StaffRole
}

export function StaffClient({ initialStaff, currentUserRole }: StaffClientProps) {
  const isOwner = currentUserRole === "superadmin"
  const [staffList, setStaffList] = React.useState<StaffUser[]>(initialStaff)
  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)

  // Edit role modal state
  const [editingStaff, setEditingStaff] = React.useState<StaffUser | null>(null)
  const [selectedRole, setSelectedRole] = React.useState<StaffRole>("branch_staff")
  const [selectedStatus, setSelectedStatus] = React.useState<"active" | "inactive" | "suspended">("active")
  const [isSaving, setIsSaving] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleOpenEdit = (staff: StaffUser) => {
    setEditingStaff(staff)
    setSelectedRole(staff.role)
    setSelectedStatus(staff.status)
    setFeedback(null)
  }

  const handleSaveRole = async () => {
    if (!editingStaff) return
    setIsSaving(true)
    setFeedback(null)

    try {
      const res = await updateStaffRoleAction({
        staffUserId: editingStaff.id,
        newRole: selectedRole,
        newStatus: selectedStatus,
      })

      if (!res.success) {
        setFeedback({ type: "error", message: res.message || "Failed to update staff member." })
      } else {
        setStaffList((prev) =>
          prev.map((s) =>
            s.id === editingStaff.id
              ? { ...s, role: selectedRole, status: selectedStatus }
              : s
          )
        )
        setFeedback({ type: "success", message: res.message || "Permissions updated successfully." })
        setTimeout(() => {
          setEditingStaff(null)
        }, 1200)
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : String(err) })
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = React.useMemo(() => {
    let items = staffList
    if (roleFilter !== "all") items = items.filter((s) => s.role === roleFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.branch || "").toLowerCase().includes(q)
      )
    }
    return items
  }, [staffList, search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const paginated = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)

  const roleCounts = React.useMemo(() => {
    return staffList.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [staffList])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Role Management"
        description="Manage operational staff accounts, roles, and access permissions across all Veyra hubs."
      />

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Staff", value: initialStaff.length },
          { label: "Admin / Superadmin", value: (roleCounts["admin"] || 0) + (roleCounts["superadmin"] || 0) },
          { label: "Fleet Managers", value: roleCounts["fleet_manager"] || 0 },
          { label: "Branch Staff", value: (roleCounts["branch_staff"] || 0) + (roleCounts["branch_manager"] || 0) },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
            <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Role filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {ROLE_FILTERS.map((rf) => {
          const count = rf.value === "all"
            ? initialStaff.length
            : initialStaff.filter((s) => s.role === rf.value).length
          return (
            <button
              key={rf.value}
              type="button"
              onClick={() => { setRoleFilter(rf.value); setPage(1) }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                roleFilter === rf.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {rf.label}
              <span className="ml-1.5 font-mono text-[11px] opacity-75">({count})</span>
            </button>
          )
        })}
      </div>

      <FilterBar
        searchPlaceholder="Search by name, email, or branch…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onClear={() => { setSearch(""); setRoleFilter("all"); setPage(1) }}
        totalCount={filtered.length}
      />

      <DataTableWrapper
        isEmpty={paginated.length === 0}
        emptyTitle="No staff members found"
        emptyDescription="Staff accounts are created in the Supabase database and linked to Clerk identities."
        totalItems={filtered.length}
        currentPage={clampedPage}
        totalPages={totalPages}
        onPageChange={setPage}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              {isOwner && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((s) => {
              const statusCfg = STATUS_BADGE[s.status] || { badge: "neutral", label: s.status }
              return (
                <TableRow key={s.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{s.firstName} {s.lastName}</span>
                        <span className="text-xs text-muted-foreground">{s.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <RiShieldUserLine className="size-3.5 text-muted-foreground" />
                      <StatusBadge
                        status={ROLE_BADGE[s.role] || "neutral"}
                        label={STAFF_ROLE_LABELS[s.role] || s.role}
                        size="sm"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.branch || "All Branches"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                      {s.permissions.slice(0, 3).map((p) => (
                        <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-mono">
                          {p.replace(/_/g, " ")}
                        </span>
                      ))}
                      {s.permissions.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                          +{s.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={statusCfg.badge} label={statusCfg.label} size="sm" />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.joinedDate).toLocaleDateString("en-PH")}
                  </TableCell>
                  {isOwner && (
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenEdit(s)}
                        className="gap-1 text-xs"
                      >
                        <RiEditLine className="size-3" />
                        Edit Role
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </DataTableWrapper>

      {/* Edit Role Dialog for Superadmin */}
      <Dialog open={!!editingStaff} onOpenChange={(open) => { if (!open) setEditingStaff(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Staff Permissions</DialogTitle>
            <DialogDescription>
              Assign operational roles and permissions for{" "}
              <strong className="text-foreground">
                {editingStaff?.firstName} {editingStaff?.lastName}
              </strong>{" "}
              ({editingStaff?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Role & Entitlements
              </label>
              <div className="space-y-2">
                {ASSIGNABLE_ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      selectedRole === r.value
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="staff_role"
                      value={r.value}
                      checked={selectedRole === r.value}
                      onChange={() => setSelectedRole(r.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Account Status
              </label>
              <div className="flex gap-2">
                {(["active", "inactive", "suspended"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border capitalize flex-1 transition-colors ${
                      selectedStatus === st
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {feedback.type === "success" ? (
                  <RiCheckLine className="size-4 shrink-0" />
                ) : (
                  <RiAlertLine className="size-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingStaff(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRole}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving && <RiLoader4Line className="size-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Notice */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-amber-600 dark:text-amber-400">Owner Access Control Policy:</strong>{" "}
          Privileged staff roles are enforced server-side via Supabase Row-Level Security (RLS) policies.
          Only authenticated accounts verified against the master Owner authorization system can grant, modify,
          or revoke staff roles. Normal customers are strictly prohibited from self-assigning any administrative roles.
        </p>
      </div>
    </div>
  )
}
