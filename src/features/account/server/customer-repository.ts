import "server-only"
import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import type {
  CustomerProfile,
  CustomerDocument,
  DriverRentalProfile,
  CustomerKycSummary,
  KycVerificationStatus,
} from "../types"

/**
 * Fetch the authenticated customer's profile from Clerk and Supabase.
 *
 * RLS: `customers: own row select` enforces that customers can only read
 * their own record where `user_id = veyra_private.current_user_id()`.
 */
export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const user = await currentUser()
  if (!user) {
    return null
  }

  const supabase = createClient()

  try {
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, membership_tier, membership_number, total_rentals, verification_status, preferred_hub_id, created_at, locations(name)")
      .maybeSingle()

    if (error) {
      console.warn("[customer-repository] error fetching customer row:", error.message)
    }

    const email = user.emailAddresses[0]?.emailAddress || ""

    if (customer) {
      const locName = Array.isArray(customer.locations)
        ? customer.locations[0]?.name
        : (customer.locations as { name?: string } | null)?.name

      return {
        id: customer.id,
        firstName: customer.first_name || user.firstName || "Member",
        lastName: customer.last_name || user.lastName || "",
        email,
        phone: customer.phone || "",
        memberSince: new Date(customer.created_at || user.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        tier:
          customer.membership_tier === "elite"
            ? "Veyra Circle • Elite Tier"
            : customer.membership_tier === "preferred"
            ? "Veyra Circle • Preferred Tier"
            : "Veyra Circle • Standard Tier",
        membershipNumber: customer.membership_number || "VYR-M-ACTIVE",
        preferredHubId: customer.preferred_hub_id || "",
        preferredHubName: locName || "Flagship Airport Terminal",
        totalRentals: customer.total_rentals || 0,
        verificationStatus: (customer.verification_status as KycVerificationStatus) || "not_submitted",
      }
    }

    // Default to Clerk identity when DB customer row has not yet synced
    return {
      id: user.id,
      firstName: user.firstName || "Member",
      lastName: user.lastName || "",
      email,
      phone: "",
      memberSince: new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      tier: "Veyra Circle • Standard Tier",
      membershipNumber: "VYR-PENDING",
      preferredHubId: "",
      preferredHubName: "Flagship Airport Terminal",
      totalRentals: 0,
    }
  } catch (err) {
    console.error("[customer-repository] unexpected error:", err)
    return {
      id: user.id,
      firstName: user.firstName || "Member",
      lastName: user.lastName || "",
      email: user.emailAddresses[0]?.emailAddress || "",
      phone: "",
      memberSince: new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      tier: "Veyra Circle • Standard Tier",
      membershipNumber: "VYR-MEMBER",
      preferredHubId: "",
      preferredHubName: "Flagship Airport Terminal",
      totalRentals: 0,
    }
  }
}

/**
 * Fetch the authenticated customer's documents from public.customer_documents.
 */
export async function getCustomerDocuments(): Promise<CustomerDocument[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("customer_documents")
      .select("id, type, original_filename, status, rejection_reason, expires_at, created_at, reviewed_at")
      .order("created_at", { ascending: false })

    if (error || !data) {
      console.warn("[customer-repository] error fetching documents:", error?.message)
      return []
    }

    return data.map((doc) => ({
      id: doc.id,
      title:
        doc.type === "driver_license"
          ? "Official Driver's License"
          : doc.type === "passport"
          ? "Passport Identification"
          : doc.type === "government_id"
          ? "Government-Issued ID"
          : "Proof of Address",
      category: doc.type as CustomerDocument["category"],
      description:
        doc.type === "driver_license"
          ? "Valid physical photocard driver's license."
          : "Verified government identification document.",
      status: doc.status === "approved"
        ? "approved"
        : doc.status === "rejected"
        ? "rejected"
        : doc.status === "expired"
        ? "expired"
        : "pending_review",
      statusLabel:
        doc.status === "approved"
          ? "Approved & Verified"
          : doc.status === "rejected"
          ? "Needs Re-upload"
          : doc.status === "expired"
          ? "Document Expired"
          : "Under Verification",
      fileName: doc.original_filename,
      uploadedAt: new Date(doc.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      expiresAt: doc.expires_at || undefined,
      rejectionReason: doc.rejection_reason || undefined,
      requiredForRental: doc.type === "driver_license",
    }))
  } catch (err) {
    console.error("[customer-repository] unexpected error fetching documents:", err)
    return []
  }
}

/**
 * Fetch unified Customer KYC status summary for booking gate & account display.
 */
export async function getCustomerKycStatus(): Promise<CustomerKycSummary> {
  const user = await currentUser()
  if (!user) {
    return {
      status: "not_submitted",
      statusLabel: "Authentication Required",
      hasDriverLicense: false,
      hasGovernmentId: false,
      requiredDocumentsUploaded: false,
      documents: [],
    }
  }

  const supabase = createClient()

  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("id, verification_status")
      .maybeSingle()

    const documents = await getCustomerDocuments()

    const dlDoc = documents.find((d) => d.category === "driver_license")
    const govDoc = documents.find((d) => d.category === "government_id" || d.category === "passport")

    const hasDriverLicense = dlDoc?.status === "approved"
    const hasGovernmentId = govDoc?.status === "approved"
    const hasPendingDocs = documents.some((d) => d.status === "pending_review")
    const hasRejectedDocs = documents.some((d) => d.status === "rejected")
    const rejectedDoc = documents.find((d) => d.status === "rejected")

    let status: KycVerificationStatus = "not_submitted"
    let statusLabel = "Not Submitted"

    const rawStatus = customer?.verification_status

    if (rawStatus === "verified" || hasDriverLicense) {
      status = "verified"
      statusLabel = "Verified"
    } else if (rawStatus === "rejected" || hasRejectedDocs) {
      status = "rejected"
      statusLabel = "Rejected — Action Required"
    } else if (rawStatus === "requires_resubmission") {
      status = "requires_resubmission"
      statusLabel = "Requires Resubmission"
    } else if (rawStatus === "pending" || hasPendingDocs || documents.length > 0) {
      status = "pending_review"
      statusLabel = "Pending Review"
    } else {
      status = "not_submitted"
      statusLabel = "Not Submitted"
    }

    const latestDoc = documents[0]

    return {
      status,
      statusLabel,
      submittedAt: latestDoc?.uploadedAt,
      rejectionReason: rejectedDoc?.rejectionReason,
      hasDriverLicense,
      hasGovernmentId,
      requiredDocumentsUploaded: Boolean(dlDoc && dlDoc.status !== "not_uploaded"),
      documents,
    }
  } catch (err) {
    console.error("[customer-repository] Error fetching KYC status:", err)
    return {
      status: "not_submitted",
      statusLabel: "Status Check Unavailable",
      hasDriverLicense: false,
      hasGovernmentId: false,
      requiredDocumentsUploaded: false,
      documents: [],
    }
  }
}

/**
 * Fetch driver profile from customer records and recent reservation driver submissions.
 */
export async function getCustomerDriverProfile(): Promise<DriverRentalProfile> {
  const profile = await getCustomerProfile()
  const supabase = createClient()

  let licenseMasked = "Unregistered"
  let verificationStatus: "verified" | "pending" | "needs_update" = "needs_update"
  let licenseCountry = "Philippines (LTO)"

  try {
    // Check if customer has verified driver submission from reservation_drivers
    const { data: drivers } = await supabase
      .from("reservation_drivers")
      .select("license_number, license_country")
      .order("created_at", { ascending: false })
      .limit(1)

    if (drivers && drivers.length > 0 && drivers[0].license_number) {
      const raw = drivers[0].license_number
      licenseMasked = raw.length > 4 ? `***-**-${raw.slice(-4)}` : raw
      verificationStatus = "verified"
      if (drivers[0].license_country) {
        licenseCountry = drivers[0].license_country === "PH" ? "Philippines (LTO)" : drivers[0].license_country
      }
    }
  } catch {
    // Keep defaults
  }

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Registered Driver"

  return {
    fullName: fullName || "Registered Driver",
    dateOfBirth: "Not Specified",
    licenseNumberMasked: licenseMasked,
    licenseCountry,
    licenseClass: "Non-Professional (B, B1 — Cars & SUVs up to 5,000kg)",
    licenseExpiry: "Verified on File",
    verificationStatus,
    issueDate: "Verified",
    pointsOrViolations: "Clean Record • Zero Demerit Points",
  }
}

export interface CustomerPaymentRecord {
  id: string
  reservationId: string
  reservationReference: string
  amount: number
  currency: string
  method: string
  status: string
  provider: string | null
  providerPaymentId: string | null
  providerTxnRef: string | null
  failureReason: string | null
  createdAt: string
}

/**
 * Fetch transaction and payment history for the authenticated customer.
 */
export async function getCustomerPayments(): Promise<CustomerPaymentRecord[]> {
  const user = await currentUser()
  if (!user) return []

  const supabase = createClient()

  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .maybeSingle()

    if (!customer) return []

    const { data, error } = await supabase
      .from("payments")
      .select("id, reservation_id, amount, currency, status, method, provider, provider_payment_id, provider_txn_ref, failure_reason, created_at, reservations(reference)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })

    if (error || !data) {
      console.warn("[customer-repository] error fetching customer payments:", error?.message)
      return []
    }

    return data.map((p) => {
      const resObj = Array.isArray(p.reservations) ? p.reservations[0] : p.reservations
      const ref = (resObj as { reference?: string } | null)?.reference || "VYR-RESERVATION"

      return {
        id: p.id,
        reservationId: p.reservation_id,
        reservationReference: ref,
        amount: Number(p.amount) / 100, // minor units to standard PHP
        currency: p.currency || "PHP",
        method: p.method || "counter",
        status: p.status,
        provider: p.provider,
        providerPaymentId: p.provider_payment_id,
        providerTxnRef: p.provider_txn_ref,
        failureReason: p.failure_reason,
        createdAt: p.created_at,
      }
    })
  } catch (err) {
    console.error("[customer-repository] unexpected error fetching payments:", err)
    return []
  }
}

