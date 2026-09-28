import { Vehicle } from "@/types"
import { BookingPricingSummary, ExtraOption } from "@/features/booking/types"

export type CustomerReservationStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled"

export interface ReservationTimelineStep {
  step: "booked" | "confirmed" | "pickup" | "active" | "return" | "completed"
  title: string
  date: string
  completed: boolean
  current: boolean
  description: string
}

export interface CustomerReservation {
  id: string
  vehicleId: string
  vehicle: Vehicle
  status: CustomerReservationStatus
  statusLabel: string
  createdAt: string
  pickupLocationId: string
  pickupLocationName: string
  pickupAddress: string
  pickupDate: string
  pickupTime: string
  returnLocationId: string
  returnLocationName: string
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
  paymentStatus: "authorized" | "captured" | "refunded" | "cancelled"
  cancellationPolicy: string
  handoverChecklist: string[]
  notes?: string
}

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
  category: "driver_license" | "government_id" | "address_proof"
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
