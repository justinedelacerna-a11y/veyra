"use client"

import * as React from "react"
import { useSearchParams, usePathname } from "next/navigation"
import {
  BookingContextValue,
  BookingDraft,
  PersistedBookingContext,
  BookingStep,
  BookingStatus,
  DriverDetails,
  DriverFormErrors,
} from "../types"
import { MOCK_VEHICLES } from "@/lib/mock/vehicles"
import { MOCK_LOCATIONS } from "@/lib/mock/locations"
import { calculateBookingPricing } from "../lib/pricing"

const STORAGE_KEY = "veyra_booking_context_v2"
const LEGACY_STORAGE_KEY = "veyra_booking_draft_v1"

const DEFAULT_DRIVER: DriverDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  licenseNumber: "",
  licenseCountry: "Philippines",
  specialRequests: "",
}

const BookingContext = React.createContext<BookingContextValue | undefined>(
  undefined
)

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Determine current step based on route pathname
  const currentStep = React.useMemo<BookingStep>(() => {
    if (pathname.includes("/booking/options")) return "options"
    if (pathname.includes("/booking/driver")) return "driver"
    if (pathname.includes("/booking/review")) return "review"
    if (pathname.includes("/booking/payment")) return "payment"
    if (pathname.includes("/booking/confirmation")) return "confirmation"
    return "vehicle"
  }, [pathname])

  // Initial draft setup from URL query params, safe persisted context, or defaults
  const initialDraft = React.useCallback((): BookingDraft => {
    let persistedContext: Partial<PersistedBookingContext> | null = null

    // Check sessionStorage if running on client
    if (typeof window !== "undefined") {
      try {
        // Backward compatibility: Purge legacy storage key containing sensitive fields
        const legacyData = sessionStorage.getItem(LEGACY_STORAGE_KEY)
        if (legacyData) {
          sessionStorage.removeItem(LEGACY_STORAGE_KEY)
        }

        const saved = sessionStorage.getItem(STORAGE_KEY) || legacyData
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, unknown>
          // Strictly extract ONLY non-sensitive navigation, itinerary, and preference fields
          persistedContext = {
            vehicleId:
              typeof parsed.vehicleId === "string" ? parsed.vehicleId : undefined,
            pickupLocationId:
              typeof parsed.pickupLocationId === "string"
                ? parsed.pickupLocationId
                : undefined,
            returnLocationId:
              typeof parsed.returnLocationId === "string"
                ? parsed.returnLocationId
                : undefined,
            pickupDate:
              typeof parsed.pickupDate === "string"
                ? parsed.pickupDate
                : undefined,
            pickupTime:
              typeof parsed.pickupTime === "string"
                ? parsed.pickupTime
                : undefined,
            returnDate:
              typeof parsed.returnDate === "string"
                ? parsed.returnDate
                : undefined,
            returnTime:
              typeof parsed.returnTime === "string"
                ? parsed.returnTime
                : undefined,
            selectedExtras: Array.isArray(parsed.selectedExtras)
              ? (parsed.selectedExtras as string[])
              : undefined,
            paymentMethod:
              parsed.paymentMethod === "card" ||
              parsed.paymentMethod === "e-wallet" ||
              parsed.paymentMethod === "counter"
                ? parsed.paymentMethod
                : undefined,
            agreedToTerms:
              typeof parsed.agreedToTerms === "boolean"
                ? parsed.agreedToTerms
                : undefined,
            agreedToCancellation:
              typeof parsed.agreedToCancellation === "boolean"
                ? parsed.agreedToCancellation
                : undefined,
            bookingReference:
              typeof parsed.bookingReference === "string"
                ? parsed.bookingReference
                : undefined,
          }
        }
      } catch {
        // Fallback to query or defaults on parse/quota errors
      }
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const defaultReturn = new Date(today)
    defaultReturn.setDate(defaultReturn.getDate() + 4)

    const formatDate = (d: Date) => d.toISOString().split("T")[0]

    // Priority: URL Query Parameters > Safe Persisted Context > Default Values
    const vehicleId =
      searchParams.get("vehicleId") ||
      persistedContext?.vehicleId ||
      MOCK_VEHICLES[0].id

    const pickupLocationId =
      searchParams.get("pickup") ||
      persistedContext?.pickupLocationId ||
      MOCK_LOCATIONS[0].id

    const returnLocationId =
      searchParams.get("returnLoc") ||
      persistedContext?.returnLocationId ||
      pickupLocationId

    const pickupDate =
      searchParams.get("from") ||
      persistedContext?.pickupDate ||
      formatDate(tomorrow)

    const pickupTime =
      searchParams.get("fromTime") ||
      persistedContext?.pickupTime ||
      "10:00"

    const returnDate =
      searchParams.get("to") ||
      persistedContext?.returnDate ||
      formatDate(defaultReturn)

    const returnTime =
      searchParams.get("toTime") ||
      persistedContext?.returnTime ||
      "10:00"

    const selectedExtras =
      persistedContext?.selectedExtras || ["extra-zero-excess"]

    const paymentMethod =
      persistedContext?.paymentMethod || "card"

    const agreedToTerms =
      persistedContext?.agreedToTerms || false

    const agreedToCancellation =
      persistedContext?.agreedToCancellation || false

    const bookingReference =
      persistedContext?.bookingReference

    return {
      vehicleId,
      pickupLocationId,
      returnLocationId,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      selectedExtras,
      // SENSITIVE DRIVER INFORMATION: ALWAYS initialized in runtime memory ONLY!
      driver: { ...DEFAULT_DRIVER },
      paymentMethod,
      agreedToTerms,
      agreedToCancellation,
      bookingReference,
    }
  }, [searchParams])

  const [draft, setDraft] = React.useState<BookingDraft>(initialDraft)
  const [driverErrors, setDriverErrors] = React.useState<DriverFormErrors>({})
  const [status, setStatus] = React.useState<BookingStatus>("idle")

  // Sync ONLY safe, non-sensitive booking context to sessionStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const safeContext: PersistedBookingContext = {
          vehicleId: draft.vehicleId,
          pickupLocationId: draft.pickupLocationId,
          returnLocationId: draft.returnLocationId,
          pickupDate: draft.pickupDate,
          pickupTime: draft.pickupTime,
          returnDate: draft.returnDate,
          returnTime: draft.returnTime,
          selectedExtras: draft.selectedExtras,
          paymentMethod: draft.paymentMethod,
          agreedToTerms: draft.agreedToTerms,
          agreedToCancellation: draft.agreedToCancellation,
          bookingReference: draft.bookingReference,
        }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeContext))
      } catch {
        // Ignore quota errors
      }
    }
  }, [draft])

  // Resolve active vehicle
  const vehicle = React.useMemo(() => {
    return (
      MOCK_VEHICLES.find((v) => v.id === draft.vehicleId) || MOCK_VEHICLES[0]
    )
  }, [draft.vehicleId])

  // Resolve locations
  const pickupHub = React.useMemo(() => {
    return (
      MOCK_LOCATIONS.find((l) => l.id === draft.pickupLocationId) ||
      MOCK_LOCATIONS[0]
    )
  }, [draft.pickupLocationId])

  const returnHub = React.useMemo(() => {
    return (
      MOCK_LOCATIONS.find((l) => l.id === draft.returnLocationId) || pickupHub
    )
  }, [draft.returnLocationId, pickupHub])

  // Calculate rental duration in whole days
  const rentalDays = React.useMemo(() => {
    try {
      const start = new Date(`${draft.pickupDate}T${draft.pickupTime}`)
      const end = new Date(`${draft.returnDate}T${draft.returnTime}`)
      const diffMs = end.getTime() - start.getTime()
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return days > 0 ? days : 1
    } catch {
      return 3
    }
  }, [draft.pickupDate, draft.pickupTime, draft.returnDate, draft.returnTime])

  // Centralized pricing calculation
  const pricing = React.useMemo(() => {
    return calculateBookingPricing(vehicle, rentalDays, draft.selectedExtras)
  }, [vehicle, rentalDays, draft.selectedExtras])

  // Update draft helper
  const updateDraft = React.useCallback((updates: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }, [])

  // Toggle extras
  const toggleExtra = React.useCallback((extraId: string) => {
    setDraft((prev) => {
      const exists = prev.selectedExtras.includes(extraId)
      const nextExtras = exists
        ? prev.selectedExtras.filter((id) => id !== extraId)
        : [...prev.selectedExtras, extraId]
      return { ...prev, selectedExtras: nextExtras }
    })
  }, [])

  // Update driver details field (runtime in-memory only)
  const updateDriver = React.useCallback(
    (field: keyof DriverDetails, value: string) => {
      setDraft((prev) => ({
        ...prev,
        driver: { ...prev.driver, [field]: value },
      }))
      // Clear field error on edit
      setDriverErrors((prev) => ({ ...prev, [field]: undefined }))
    },
    []
  )

  // Validation: Driver details step
  const validateDriverStep = React.useCallback((): boolean => {
    const errors: DriverFormErrors = {}
    const { driver } = draft

    if (!driver.firstName.trim() || driver.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters."
    }

    if (!driver.lastName.trim() || driver.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters."
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!driver.email.trim() || !emailRegex.test(driver.email.trim())) {
      errors.email = "Please provide a valid email address."
    }

    const phoneDigits = driver.phone.replace(/\D/g, "")
    if (!driver.phone.trim() || phoneDigits.length < 10) {
      errors.phone = "Please enter a valid phone number (at least 10 digits)."
    }

    if (!driver.birthDate) {
      errors.birthDate = "Date of birth is required for driver eligibility."
    } else {
      const birth = new Date(driver.birthDate)
      const now = new Date()
      const ageDiffMs = now.getTime() - birth.getTime()
      const age = Math.floor(ageDiffMs / (1000 * 60 * 60 * 24 * 365.25))
      if (age < 21) {
        errors.birthDate = "Driver must be at least 21 years old."
      }
    }

    if (!driver.licenseNumber.trim() || driver.licenseNumber.trim().length < 5) {
      errors.licenseNumber = "Valid driver license number is required."
    }

    if (!driver.licenseCountry.trim()) {
      errors.licenseCountry = "Issuing country is required."
    }

    setDriverErrors(errors)
    return Object.keys(errors).length === 0
  }, [draft])

  // Validation: Payment step
  const validatePaymentStep = React.useCallback((): boolean => {
    return draft.agreedToTerms && draft.agreedToCancellation
  }, [draft.agreedToTerms, draft.agreedToCancellation])

  // Complete booking demo
  const completeBooking = React.useCallback((): string => {
    const reference =
      draft.bookingReference ||
      `VYR-DEMO-${Math.floor(1000 + Math.random() * 9000)}`
    updateDraft({ bookingReference: reference })
    setStatus("confirmed")
    return reference
  }, [draft.bookingReference, updateDraft])

  // Reset booking: cleans storage and in-memory state
  const resetBooking = React.useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(LEGACY_STORAGE_KEY)
    }
    setDraft(initialDraft())
    setDriverErrors({})
    setStatus("idle")
  }, [initialDraft])

  const contextValue: BookingContextValue = {
    draft,
    vehicle,
    pickupLocationName: `${pickupHub.city} (${pickupHub.name})`,
    returnLocationName: `${returnHub.city} (${returnHub.name})`,
    rentalDays,
    pricing,
    driverErrors,
    status,
    currentStep,
    updateDraft,
    toggleExtra,
    updateDriver,
    validateDriverStep,
    validatePaymentStep,
    completeBooking,
    resetBooking,
  }

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking(): BookingContextValue {
  const context = React.useContext(BookingContext)
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider")
  }
  return context
}
