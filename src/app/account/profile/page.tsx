"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { AccountHeader } from "@/features/account/components/account-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RiEditLine, RiSaveLine, RiCloseLine, RiCheckLine, RiInformationLine } from "@remixicon/react"

type FormState = "idle" | "editing" | "saving" | "success"

interface ProfileFields {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export default function ProfilePage() {
  const { user } = useUser()
  const [formState, setFormState] = React.useState<FormState>("idle")
  const [fields, setFields] = React.useState<ProfileFields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [original, setOriginal] = React.useState<ProfileFields>({ ...fields })

  const [syncedUserId, setSyncedUserId] = React.useState<string | null>(null)

  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id)
    const initial = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      phone: user.primaryPhoneNumber?.phoneNumber || "",
    }
    setFields(initial)
    setOriginal(initial)
  }

  const handleEdit = () => {
    setOriginal({ ...fields })
    setFormState("editing")
  }

  const handleCancel = () => {
    setFields({ ...original })
    setFormState("idle")
  }

  const handleSave = () => {
    setFormState("saving")
    // Simulated async interaction — no persistence to localStorage/sessionStorage
    setTimeout(() => {
      setFormState("success")
      setTimeout(() => setFormState("idle"), 2500)
    }, 1000)
  }

  const handleChange = (field: keyof ProfileFields, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }))
  }

  const isEditing = formState === "editing"
  const isSaving = formState === "saving"

  return (
    <div className="space-y-8">
      <AccountHeader
        title="Profile Settings"
        description="Manage your personal contact information and account preferences."
        action={
          formState === "idle" ? (
            <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
              <RiEditLine className="size-4" data-icon="inline-start" />
              <span>Edit Profile</span>
            </Button>
          ) : null
        }
      />

      {/* Prototype Notice */}
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/40 p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
        <RiInformationLine className="size-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Prototype Mode:</strong>{" "}
          Profile changes are simulated in this frontend build. No data is persisted to any server, database, or browser storage. Real profile management will be powered by Clerk.
        </p>
      </div>

      {/* Personal Information */}
      <section className="rounded-xl border bg-card p-6 space-y-5" aria-labelledby="personal-info-heading">
        <h2 id="personal-info-heading" className="font-heading text-base font-semibold text-foreground">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="profile-first-name" className="text-xs font-medium">
              First Name
            </Label>
            <Input
              id="profile-first-name"
              value={fields.firstName}
              disabled={!isEditing && !isSaving}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-last-name" className="text-xs font-medium">
              Last Name
            </Label>
            <Input
              id="profile-last-name"
              value={fields.lastName}
              disabled={!isEditing && !isSaving}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-xs font-medium">
              Email Address
            </Label>
            <Input
              id="profile-email"
              type="email"
              value={fields.email}
              disabled={!isEditing && !isSaving}
              onChange={(e) => handleChange("email", e.target.value)}
              className="transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone" className="text-xs font-medium">
              Mobile Phone
            </Label>
            <Input
              id="profile-phone"
              type="tel"
              value={fields.phone}
              disabled={!isEditing && !isSaving}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="transition-colors"
            />
          </div>
        </div>

        {/* Edit Mode Actions */}
        {(isEditing || isSaving) && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin inline-block" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <RiSaveLine className="size-4" data-icon="inline-start" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="gap-1.5">
              <RiCloseLine className="size-4" data-icon="inline-start" />
              <span>Cancel</span>
            </Button>
          </div>
        )}

        {/* Success Feedback */}
        {formState === "success" && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <RiCheckLine className="size-4 shrink-0" />
            <span className="font-medium">Profile updated (prototype simulation — no real persistence)</span>
          </div>
        )}
      </section>

      {/* Account Identifiers */}
      <section className="rounded-xl border bg-card p-6 space-y-4" aria-labelledby="account-id-heading">
        <h2 id="account-id-heading" className="font-heading text-base font-semibold text-foreground">
          Account Details
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-muted-foreground">Membership Number</span>
            <span className="font-mono font-semibold text-foreground">
              {user ? `VYR-M-${user.id.slice(-5).toUpperCase()}` : "VYR-MEMBER"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-muted-foreground">Member Since</span>
            <span className="font-medium text-foreground">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Member"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-muted-foreground">Membership Tier</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">Veyra Circle • Standard Tier</span>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-muted-foreground">Total Completed Rentals</span>
            <span className="font-medium text-foreground">0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Preferred Pickup Hub</span>
            <span className="font-medium text-foreground text-right max-w-[60%]">Flagship Airport Terminal</span>
          </div>
        </div>
      </section>
    </div>
  )
}
