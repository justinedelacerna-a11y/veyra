import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getCustomerKycStatus } from "@/features/account/server/customer-repository"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * GET /api/account/kyc
 *
 * Secure, privacy-preserving endpoint returning customer KYC verification status.
 *
 * Security & Privacy:
 * - Requires authenticated session
 * - Returns only minimal UI state (status, timestamps, rejection reason)
 * - Never returns document storage paths, raw IDs, or sensitive PII
 * - Rate-limited
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        status: "not_submitted",
        statusLabel: "Authentication Required",
        hasDriverLicense: false,
        hasGovernmentId: false,
        requiredDocumentsUploaded: false,
      })
    }

    const rateLimit = checkRateLimit("kycStatusCheck", userId, {
      maxRequests: 30,
      windowMs: 60 * 1000,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many requests. Please wait." },
        { status: 429 }
      )
    }

    const kyc = await getCustomerKycStatus()

    return NextResponse.json({
      authenticated: true,
      status: kyc.status,
      statusLabel: kyc.statusLabel,
      submittedAt: kyc.submittedAt,
      reviewedAt: kyc.reviewedAt,
      rejectionReason: kyc.rejectionReason,
      hasDriverLicense: kyc.hasDriverLicense,
      hasGovernmentId: kyc.hasGovernmentId,
      requiredDocumentsUploaded: kyc.requiredDocumentsUploaded,
    })
  } catch (err) {
    console.error("[api/account/kyc] Error retrieving KYC status:", err)
    return NextResponse.json(
      { error: "server_error", message: "Failed to retrieve verification status." },
      { status: 500 }
    )
  }
}
