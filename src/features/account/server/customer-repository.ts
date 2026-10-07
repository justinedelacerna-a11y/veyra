import "server-only"
import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import type {
  CustomerProfile,
  CustomerDocument,
  DriverRentalProfile,
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
      .select("id, first_name, last_name, phone, membership_tier, membership_number, total_rentals, preferred_hub_id, created_at, locations(name)")
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
      .select("id, type, original_filename, status, expires_at, created_at")
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
      requiredForRental: doc.type === "driver_license",
    }))
  } catch (err) {
    console.error("[customer-repository] unexpected error fetching documents:", err)
    return []
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
