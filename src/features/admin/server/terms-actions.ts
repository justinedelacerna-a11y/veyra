"use server"

import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { publishNewTermsVersion } from "./terms-service"
import { revalidatePath } from "next/cache"

export interface PublishTermsActionState {
  success?: boolean
  error?: string
  message?: string
  version?: string
}

/**
 * Server Action: Publish a new Terms of Service version.
 * Requires admin or superadmin role.
 */
export async function publishTermsVersionAction(
  _prevState: PublishTermsActionState,
  formData: FormData
): Promise<PublishTermsActionState> {
  // 1. Enforce admin role server-side
  const staff = await requireAdminStaff(["admin", "superadmin"])

  const versionRaw = formData.get("version")
  const summaryRaw = formData.get("summary")

  const version = String(versionRaw || "").trim()
  const summary = String(summaryRaw || "").trim()

  if (!version) {
    return {
      success: false,
      error: "missing_version",
      message: 'Version identifier is required (e.g. "v1.1").',
    }
  }

  if (!summary) {
    return {
      success: false,
      error: "missing_summary",
      message: "Please describe the changes or justification in the summary.",
    }
  }

  const result = await publishNewTermsVersion({
    version,
    summary,
    staffId: staff.staffId,
  })

  if (result.success) {
    revalidatePath("/admin/settings")
    revalidatePath("/terms")
    return {
      success: true,
      version: result.version,
      message: `Successfully published Terms of Service version ${result.version}.`,
    }
  }

  return {
    success: false,
    error: result.error,
    message: result.message,
  }
}
