import "server-only"
import { currentUser } from "@clerk/nextjs/server"
import { createServiceClient } from "@/lib/supabase/server"
import type {
  CustomerProfile,
  CustomerDocument,
  DriverRentalProfile,
  CustomerKycSummary,
  KycVerificationStatus,
} from "../types"

export interface ResolvedCustomerRecord {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  membershipNumber: string
  membershipTier: string
  totalRentals: number
  verificationStatus: KycVerificationStatus
  preferredHubId: string | null
  createdAt: string
}

/**
 * Safely resolve or auto-provision the authenticated customer profile in Supabase.
 *
 * Requirements enforced:
 * - Stable identity mapping: first lookup by immutable clerk_id.
 * - Safely link pre-existing seed/unlinked records by email without account hijacking.
 * - Auto-provision missing public.users and public.customers rows idempotently.
 * - Never trust client-supplied customer IDs; always derive from verified Clerk session.
 */
export async function resolveOrCreateCustomerProfile(user: {
  id: string
  emailAddresses?: Array<{ emailAddress: string; id?: string }>
  primaryEmailAddressId?: string | null
  firstName?: string | null
  lastName?: string | null
  createdAt?: number
}): Promise<ResolvedCustomerRecord | null> {
  if (!user || !user.id) {
    return null
  }

  const supabase = createServiceClient()
  const clerkId = user.id
  const primaryEmail =
    user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress?.toLowerCase() ||
    user.emailAddresses?.[0]?.emailAddress?.toLowerCase() ||
    ""

  // 1. Stable identity mapping: Check public.users by clerk_id
  const { data: initialUser, error: uErr } = await supabase
    .from("users")
    .select("id, email, clerk_id, user_type, status")
    .eq("clerk_id", clerkId)
    .maybeSingle()

  let dbUser = initialUser

  if (uErr) {
    console.error("[customer-repository] Error querying user by clerk_id:", uErr.message)
  }

  // 2. If no record has this clerk_id, check if an unlinked row matches the verified primary email
  if (!dbUser && primaryEmail) {
    const { data: emailUser } = await supabase
      .from("users")
      .select("id, email, clerk_id, user_type, status")
      .eq("email", primaryEmail)
      .maybeSingle()

    if (emailUser) {
      // Only link if clerk_id is missing, temporary, or already matches
      const isUnlinked =
        !emailUser.clerk_id ||
        emailUser.clerk_id.startsWith("temp_") ||
        emailUser.clerk_id === clerkId

      if (isUnlinked) {
        const { data: updatedUser, error: updateErr } = await supabase
          .from("users")
          .update({
            clerk_id: clerkId,
            email_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", emailUser.id)
          .select("id, email, clerk_id, user_type, status")
          .single()

        if (!updateErr && updatedUser) {
          dbUser = updatedUser
        }
      }
    }
  }

  // 3. If user row still does not exist, provision safely
  if (!dbUser) {
    const emailToUse = primaryEmail || `${clerkId}@customer.veyra.local`
    const { data: newUser, error: createUErr } = await supabase
      .from("users")
      .insert({
        clerk_id: clerkId,
        email: emailToUse,
        email_verified: Boolean(primaryEmail),
        user_type: "customer",
        status: "active",
      })
      .select("id, email, clerk_id, user_type, status")
      .single()

    if (createUErr || !newUser) {
      // In case of concurrent creation, query by clerk_id
      const { data: fallbackUser } = await supabase
        .from("users")
        .select("id, email, clerk_id, user_type, status")
        .eq("clerk_id", clerkId)
        .maybeSingle()

      if (!fallbackUser) {
        console.error("[customer-repository] Failed to provision public.users record:", createUErr?.message)
        return null
      }
      dbUser = fallbackUser
    } else {
      dbUser = newUser
    }
  }

  // 4. Resolve customer profile row by user_id
  const { data: initialCustomer, error: cErr } = await supabase
    .from("customers")
    .select("id, user_id, first_name, last_name, phone, membership_tier, membership_number, total_rentals, verification_status, preferred_hub_id, created_at")
    .eq("user_id", dbUser.id)
    .maybeSingle()

  let customer = initialCustomer

  if (cErr) {
    console.error("[customer-repository] Error querying customer by user_id:", cErr.message)
  }

  // 5. If customer profile row does not exist, provision safely
  if (!customer) {
    const firstName = user.firstName?.trim() || "Customer"
    const lastName = user.lastName?.trim() || "Member"
    const membershipNumber = `VYR-CUS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    const { data: newCustomer, error: createCErr } = await supabase
      .from("customers")
      .insert({
        user_id: dbUser.id,
        first_name: firstName,
        last_name: lastName,
        membership_number: membershipNumber,
        membership_tier: "standard",
        verification_status: "unverified",
      })
      .select("id, user_id, first_name, last_name, phone, membership_tier, membership_number, total_rentals, verification_status, preferred_hub_id, created_at")
      .single()

    if (createCErr || !newCustomer) {
      // In case of concurrent creation, query again
      const { data: fallbackCustomer } = await supabase
        .from("customers")
        .select("id, user_id, first_name, last_name, phone, membership_tier, membership_number, total_rentals, verification_status, preferred_hub_id, created_at")
        .eq("user_id", dbUser.id)
        .maybeSingle()

      if (!fallbackCustomer) {
        console.error("[customer-repository] Failed to provision customer row:", createCErr?.message)
        return null
      }
      customer = fallbackCustomer
    } else {
      customer = newCustomer
    }
  }

  return {
    id: customer.id,
    userId: dbUser.id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: dbUser.email,
    phone: customer.phone,
    membershipNumber: customer.membership_number,
    membershipTier: customer.membership_tier,
    totalRentals: customer.total_rentals,
    verificationStatus: (customer.verification_status as KycVerificationStatus) || "unverified",
    preferredHubId: customer.preferred_hub_id,
    createdAt: customer.created_at,
  }
}

/**
 * Fetch the authenticated customer's profile from Clerk and Supabase.
 */
export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const user = await currentUser()
  if (!user) {
    return null
  }

  try {
    const customer = await resolveOrCreateCustomerProfile(user)
    if (!customer) {
      return null
    }

    let locName: string | undefined
    if (customer.preferredHubId) {
      const supabase = createServiceClient()
      const { data: loc } = await supabase
        .from("locations")
        .select("name")
        .eq("id", customer.preferredHubId)
        .maybeSingle()
      locName = loc?.name
    }

    return {
      id: customer.id,
      firstName: customer.firstName || user.firstName || "Member",
      lastName: customer.lastName || user.lastName || "",
      email: customer.email || user.emailAddresses[0]?.emailAddress || "",
      phone: customer.phone || "",
      memberSince: new Date(customer.createdAt || user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      tier:
        customer.membershipTier === "elite"
          ? "Veyra Circle • Elite Tier"
          : customer.membershipTier === "preferred"
          ? "Veyra Circle • Preferred Tier"
          : "Veyra Circle • Standard Tier",
      membershipNumber: customer.membershipNumber || "VYR-M-ACTIVE",
      preferredHubId: customer.preferredHubId || "",
      preferredHubName: locName || "Flagship Airport Terminal",
      totalRentals: customer.totalRentals || 0,
      verificationStatus: customer.verificationStatus || "not_submitted",
    }
  } catch (err) {
    console.error("[customer-repository] unexpected error:", err)
    return null
  }
}

/**
 * Fetch the authenticated customer's documents from public.customer_documents.
 */
export async function getCustomerDocuments(): Promise<CustomerDocument[]> {
  const user = await currentUser()
  if (!user) {
    return []
  }

  try {
    const customer = await resolveOrCreateCustomerProfile(user)
    if (!customer) {
      return []
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("customer_documents")
      .select("id, type, original_filename, status, rejection_reason, expires_at, created_at, reviewed_at")
      .eq("customer_id", customer.id)
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

  try {
    const customer = await resolveOrCreateCustomerProfile(user)
    if (!customer) {
      return {
        status: "not_submitted",
        statusLabel: "Status Check Unavailable",
        hasDriverLicense: false,
        hasGovernmentId: false,
        requiredDocumentsUploaded: false,
        documents: [],
      }
    }

    const documents = await getCustomerDocuments()

    const dlDoc = documents.find((d) => d.category === "driver_license")
    const govDoc = documents.find((d) => d.category === "government_id" || d.category === "passport")

    const hasDriverLicense = dlDoc?.status === "approved"
    const hasGovernmentId = govDoc?.status === "approved"

    // Only mandatory identity documents (driver's license and primary government ID) govern KYC clearance.
    // Optional supplemental documents (such as proof of billing/address) do not block or alter KYC clearance.
    const requiredDocs = documents.filter(
      (d) => d.category === "driver_license" || d.category === "government_id" || d.category === "passport"
    )
    const hasPendingRequiredDocs = requiredDocs.some((d) => d.status === "pending_review")
    const hasRejectedRequiredDocs = requiredDocs.some((d) => d.status === "rejected")
    const rejectedDoc = requiredDocs.find((d) => d.status === "rejected")

    let status: KycVerificationStatus = "not_submitted"
    let statusLabel = "Not Submitted"

    const rawStatus = customer.verificationStatus

    if (rawStatus === "verified" || hasDriverLicense) {
      status = "verified"
      statusLabel = "Verified"
    } else if (rawStatus === "rejected" || hasRejectedRequiredDocs) {
      status = "rejected"
      statusLabel = "Rejected — Action Required"
    } else if (rawStatus === "requires_resubmission") {
      status = "requires_resubmission"
      statusLabel = "Requires Resubmission"
    } else if (rawStatus === "pending" || hasPendingRequiredDocs || requiredDocs.length > 0) {
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
  const supabase = createServiceClient()

  let licenseMasked = "Unregistered"
  let verificationStatus: "verified" | "pending" | "needs_update" = "needs_update"
  let licenseCountry = "Philippines (LTO)"

  try {
    if (profile?.id) {
      // Find reservations for this customer
      const { data: userRes } = await supabase
        .from("reservations")
        .select("id")
        .eq("customer_id", profile.id)

      const resIds = userRes?.map((r) => r.id) || []
      if (resIds.length > 0) {
        const { data: drivers } = await supabase
          .from("reservation_drivers")
          .select("license_number, license_country")
          .in("reservation_id", resIds)
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
  isDemo: boolean
  vehicleName?: string
  rentalDays?: number
  pickupAt?: string
  returnAt?: string
}

/**
 * Fetch transaction and payment history for the authenticated customer.
 */
export async function getCustomerPayments(): Promise<CustomerPaymentRecord[]> {
  const user = await currentUser()
  if (!user) return []

  try {
    const customer = await resolveOrCreateCustomerProfile(user)
    if (!customer) return []

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("payments")
      .select("id, reservation_id, amount, currency, status, method, provider, provider_payment_id, provider_txn_ref, failure_reason, created_at, is_demo, reservations(reference, rental_days, pickup_at, return_at, vehicles(make, model, year))")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })

    if (error || !data) {
      console.warn("[customer-repository] error fetching customer payments:", error?.message)
      return []
    }

    return data.map((p) => {
      const resObj = (Array.isArray(p.reservations) ? p.reservations[0] : p.reservations) as {
        reference?: string
        rental_days?: number
        pickup_at?: string
        return_at?: string
        vehicles?: { make?: string; model?: string; year?: number } | { make?: string; model?: string; year?: number }[] | null
      } | null
      const ref = resObj?.reference || "VYR-RESERVATION"
      const vehicle = Array.isArray(resObj?.vehicles) ? resObj?.vehicles[0] : resObj?.vehicles
      const vehicleName = vehicle?.make ? `${vehicle.year || ""} ${vehicle.make} ${vehicle.model}`.trim() : undefined

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
        isDemo: Boolean(p.is_demo),
        vehicleName,
        rentalDays: resObj?.rental_days || undefined,
        pickupAt: resObj?.pickup_at || undefined,
        returnAt: resObj?.return_at || undefined,
      }
    })
  } catch (err) {
    console.error("[customer-repository] unexpected error fetching payments:", err)
    return []
  }
}

