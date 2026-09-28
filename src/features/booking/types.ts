import { Vehicle } from "@/types"

export type BookingStep =
  | "vehicle"
  | "options"
  | "driver"
  | "review"
  | "payment"
  | "confirmation"

export interface ExtraOption {
  id: string
  name: string
  tagline: string
  description: string
  dailyRate: number
  category: "protection" | "convenience" | "equipment" | "mileage"
  badge?: string
}

export interface DriverDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  licenseNumber: string
  licenseCountry: string
  specialRequests?: string
}

export interface DriverFormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  birthDate?: string
  licenseNumber?: string
  licenseCountry?: string
}

export interface BookingPricingSummary {
  dailyRate: number
  rentalDays: number
  baseRental: number
  extrasSubtotal: number
  airportConcessionFee: number
  mandatoryLiabilityCoverage: number
  localTaxes: number
  subtotal: number
  discount: number
  totalRentalPrice: number
  refundableSecurityDeposit: number
  currency: string
}

/**
 * Safe Browser-Persistable Booking Context
 * Strictly non-sensitive navigation, itinerary, and vehicle preferences.
 * SENSITIVE DRIVER DATA OR PAYMENT CREDENTIALS MUST NEVER BE ADDED HERE.
 */
export interface PersistedBookingContext {
  vehicleId: string
  pickupLocationId: string
  returnLocationId: string
  pickupDate: string
  pickupTime: string
  returnDate: string
  returnTime: string
  selectedExtras: string[]
  paymentMethod?: "card" | "e-wallet" | "counter"
  agreedToTerms?: boolean
  agreedToCancellation?: boolean
  bookingReference?: string
}

/**
 * Full Booking Draft (Runtime In-Memory State)
 * Combines safe itinerary selections with runtime-only driver credentials.
 */
export interface BookingDraft extends PersistedBookingContext {
  driver: DriverDetails
  paymentMethod: "card" | "e-wallet" | "counter"
  agreedToTerms: boolean
  agreedToCancellation: boolean
}

export type BookingStatus =
  | "idle"
  | "initializing"
  | "editing"
  | "validating"
  | "submitting"
  | "confirmed"
  | "error"

export interface BookingContextValue {
  draft: BookingDraft
  vehicle: Vehicle
  pickupLocationName: string
  returnLocationName: string
  rentalDays: number
  pricing: BookingPricingSummary
  driverErrors: DriverFormErrors
  status: BookingStatus
  currentStep: BookingStep
  updateDraft: (updates: Partial<BookingDraft>) => void
  toggleExtra: (extraId: string) => void
  updateDriver: (field: keyof DriverDetails, value: string) => void
  validateDriverStep: () => boolean
  validatePaymentStep: () => boolean
  completeBooking: () => string
  resetBooking: () => void
}
