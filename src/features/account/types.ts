import { Vehicle } from "@/types"
import { BookingPricingSummary, ExtraOption } from "@/features/booking/types"

export type CustomerReservationStatus =
  | "pending_approval"
  | "upcoming"
  | "active"
  | "return_inspection"
  | "completed"
  | "cancelled"
  | "no_show"
  | "disputed"

export interface ReservationTimelineStep {
  step:
    | "submitted"
    | "payment"
    | "approval"
    | "confirmed"
    | "pickup"
    | "active"
    | "return"
    | "completed"
    | "cancelled"
    | "rejected"
    | "booked"
  title: string
  date: string
  completed: boolean
  current: boolean
  failed?: boolean
  description: string
}

export interface CustomerReservation {
  id: string
  uuid?: string
  vehicleId: string
  vehicle: Vehicle
  status: CustomerReservationStatus
  dbStatus?: string
  statusLabel: string
  createdAt: string
  approvedAt?: string
  rejectionReason?: string
  actualPickupAt?: string
  actualReturnAt?: string
  pickupLocationId: string
  pickupLocationName: string
  pickupBarangay?: string
  pickupAddress: string
  pickupStreetAddress?: string
  pickupLandmark?: string
  pickupContactPhone?: string
  pickupDate: string
  pickupTime: string
  returnLocationId: string
  returnLocationName: string
  returnBarangay?: string
  returnAddress: string
  returnDate: string
  returnTime: string
  rentalDays: number
  pricing: BookingPricingSummary
  selectedExtras: ExtraOption[]
  driver: {
    fullName: string
    email: string
    phone: string
    licenseNumberMasked: string
    licenseCountry: string
  }
  timeline: ReservationTimelineStep[]
  paymentMethod: "card" | "e-wallet" | "counter"
  paymentStatus: "pending" | "authorized" | "captured" | "refunded" | "cancelled" | "failed"
  cancellationPolicy: string
  handoverChecklist: string[]
  notes?: string
}

export type KycVerificationStatus =
  | "not_submitted"
  | "pending_review"
  | "pending"
  | "unverified"
  | "verified"
  | "rejected"
  | "requires_resubmission"

export interface CustomerProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  memberSince: string
  tier: string
  membershipNumber: string
  preferredHubId: string
  preferredHubName: string
  totalRentals: number
  verificationStatus?: KycVerificationStatus
  rejectionReason?: string
}

export interface CustomerKycSummary {
  status: KycVerificationStatus
  statusLabel: string
  submittedAt?: string
  reviewedAt?: string
  reviewerName?: string
  rejectionReason?: string
  hasDriverLicense: boolean
  hasGovernmentId: boolean
  requiredDocumentsUploaded: boolean
  documents: CustomerDocument[]
}

export interface DriverRentalProfile {
  fullName: string
  dateOfBirth: string
  licenseNumberMasked: string
  licenseCountry: string
  licenseClass: string
  licenseExpiry: string
  verificationStatus: "verified" | "pending" | "needs_update"
  issueDate: string
  pointsOrViolations: string
}

export type DocumentStatus =
  | "not_uploaded"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired"

export interface CustomerDocument {
  id: string
  title: string
  category: "driver_license" | "government_id" | "address_proof" | "passport"
  description: string
  status: DocumentStatus
  statusLabel: string
  fileName?: string
  uploadedAt?: string
  expiresAt?: string
  rejectionReason?: string
  requiredForRental: boolean
}

export interface SecuritySession {
  id: string
  device: string
  browser: string
  location: string
  ipAddressMasked: string
  lastActive: string
  isCurrent: boolean
}
