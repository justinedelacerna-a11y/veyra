import {
  CustomerProfile,
  DriverRentalProfile,
  CustomerDocument,
  SecuritySession,
} from "@/features/account/types"

/**
 * Mock Customer Profile Data
 * NOTE: This mock identity is for frontend prototype representation only.
 * Real customer authentication and profile data will be managed via Clerk and Supabase.
 */
export const MOCK_CUSTOMER_PROFILE: CustomerProfile = {
  id: "usr_mock_elena",
  firstName: "Elena",
  lastName: "Cruz",
  email: "elena.cruz@example.com",
  phone: "+63 917 555 0192",
  memberSince: "January 2024",
  tier: "Veyra Circle • Emerald Tier",
  membershipNumber: "VYR-M-77291",
  preferredHubId: "loc-cgy-airport",
  preferredHubName: "Laguindingan International Airport (CGY)",
  totalRentals: 4,
}

/**
 * Mock Driver Rental Profile
 * SENSITIVE NOTE: Maintained in runtime memory for prototype display only.
 * Never write this object to browser localStorage or sessionStorage.
 */
export const MOCK_DRIVER_PROFILE: DriverRentalProfile = {
  fullName: "Elena Santos Cruz",
  dateOfBirth: "1994-08-14",
  licenseNumberMasked: "N02-**-***842",
  licenseCountry: "Philippines (LTO)",
  licenseClass: "Non-Professional (B, B1 — Cars & SUVs up to 5,000kg)",
  licenseExpiry: "2029-08-14",
  verificationStatus: "verified",
  issueDate: "2019-08-14",
  pointsOrViolations: "Clean Record • Zero Demerit Points",
}

/**
 * Mock Customer Document Statuses
 */
export const MOCK_DOCUMENTS: CustomerDocument[] = [
  {
    id: "doc-driver-license",
    title: "Official Driver's License",
    category: "driver_license",
    description:
      "Valid, government-issued physical driver's license with clear front and back photocard details.",
    status: "approved",
    statusLabel: "Approved & Verified",
    fileName: "lto_license_cruz_verified.pdf",
    uploadedAt: "Sep 12, 2026",
    expiresAt: "Aug 14, 2029",
    requiredForRental: true,
  },
  {
    id: "doc-gov-passport",
    title: "Passport / Primary Government ID",
    category: "government_id",
    description:
      "Secondary identity document used for fraud protection and security deposit authorization.",
    status: "pending_review",
    statusLabel: "Verification in Progress",
    fileName: "passport_ph_cruz_scan.pdf",
    uploadedAt: "Sep 25, 2026",
    requiredForRental: true,
  },
  {
    id: "doc-billing-proof",
    title: "Proof of Billing / Residential Address",
    category: "address_proof",
    description:
      "Utility statement or banking document issued within the last 90 days matching your profile address.",
    status: "not_uploaded",
    statusLabel: "Optional for Standard Tiers",
    requiredForRental: false,
  },
]

/**
 * Mock Security & Active Sessions
 */
export const MOCK_SECURITY_SESSIONS: SecuritySession[] = [
  {
    id: "sess_curr_01",
    device: "Windows Desktop PC",
    browser: "Google Chrome 129",
    location: "Cagayan de Oro, Philippines",
    ipAddressMasked: "112.198.***.***",
    lastActive: "Active Now",
    isCurrent: true,
  },
  {
    id: "sess_mobile_02",
    device: "Apple iPhone 15 Pro",
    browser: "Mobile Safari 17.5",
    location: "Cebu City, Philippines",
    ipAddressMasked: "120.28.***.***",
    lastActive: "2 days ago",
    isCurrent: false,
  },
]
