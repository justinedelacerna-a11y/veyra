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
  ExtraOption,
  LiveQuoteResult,
} from "../types"
import { calculateBookingPricing } from "../lib/pricing"
import type { Vehicle, LocationHub } from "@/types"

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

/**
 * Detect whether an ID refers to a real database UUID.
 * Real DB IDs are standard UUID v4 format.
 */
function isRealUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
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

    if (typeof window !== "undefined") {
      try {
        const legacyData = sessionStorage.getItem(LEGACY_STORAGE_KEY)
        if (legacyData) {
          sessionStorage.removeItem(LEGACY_STORAGE_KEY)
        }

        const saved = sessionStorage.getItem(STORAGE_KEY) || legacyData
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, unknown>
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
        // Fallback on storage errors
      }
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const defaultReturn = new Date(today)
    defaultReturn.setDate(defaultReturn.getDate() + 4)

    const formatDate = (d: Date) => d.toISOString().split("T")[0]

    const vehicleId =
      searchParams.get("vehicleId") ||
      persistedContext?.vehicleId ||
      ""

    const pickupLocationId =
      searchParams.get("pickup") ||
      persistedContext?.pickupLocationId ||
      ""

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
      persistedContext?.selectedExtras || []

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

  // --- Live vehicle state ---
  const [liveVehicle, setLiveVehicle] = React.useState<Vehicle | null>(null)
  const [vehicleLoading, setVehicleLoading] = React.useState(false)

  React.useEffect(() => {
    const vid = draft.vehicleId
    if (!isRealUuid(vid)) {
      queueMicrotask(() => setLiveVehicle(null))
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setVehicleLoading(true)
    })

    fetch(`/api/vehicles/${vid}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: { vehicle?: Vehicle }) => {
        if (!cancelled && data.vehicle) {
          setLiveVehicle(data.vehicle)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[booking-context] Failed to load live vehicle:", err)
          setLiveVehicle(null)
        }
      })
      .finally(() => {
        if (!cancelled) setVehicleLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [draft.vehicleId])

  // --- Live locations state ---
  const [liveLocations, setLiveLocations] = React.useState<LocationHub[]>([])

  React.useEffect(() => {
    let cancelled = false

    fetch("/api/locations")
      .then((res) => res.json())
      .then((data: { locations?: LocationHub[] }) => {
        if (!cancelled && data.locations && data.locations.length > 0) {
          setLiveLocations(data.locations)

          // If draft doesn't have a pickup location or invalid, sync to first active hub
          setDraft((prev) => {
            const hasPickup = data.locations!.some((l) => l.id === prev.pickupLocationId)
            if (!hasPickup) {
              return {
                ...prev,
                pickupLocationId: data.locations![0].id,
                returnLocationId: prev.returnLocationId ? prev.returnLocationId : data.locations![0].id,
              }
            }
            return prev
          })
        }
      })
      .catch((err) => {
        console.error("[booking-context] error loading live locations:", err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // --- Live extras state ---
  const [liveExtras, setLiveExtras] = React.useState<ExtraOption[]>([])

  React.useEffect(() => {
    let cancelled = false

    fetch("/api/extras")
      .then((res) => res.json())
      .then((data: { extras?: ExtraOption[] }) => {
        if (!cancelled && data.extras && data.extras.length > 0) {
          setLiveExtras(data.extras)
        }
      })
      .catch((err) => {
        console.error("[booking-context] error loading live extras:", err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Resolve locations from live Supabase data
  const locations = liveLocations

  const pickupHub = React.useMemo((): LocationHub => {
    const found = locations.find((l) => l.id === draft.pickupLocationId)
    return (
      found ||
      locations[0] || {
        id: draft.pickupLocationId || "10c00000-0000-0000-0000-000000000001",
        name: "Barangay Libertad Hub",
        barangay: "Libertad",
        city: "Butuan City",
        province: "Agusan del Norte",
        type: "City Center" as const,
        address: "National Highway, Brgy. Libertad, Butuan City, Agusan del Norte",
        operatingHours: "08:00 - 20:00 Daily",
        pickupAvailable: true,
      }
    )
  }, [draft.pickupLocationId, locations])

  const returnHub = React.useMemo((): LocationHub => {
    const found = locations.find((l) => l.id === draft.returnLocationId)
    return found || pickupHub
  }, [draft.returnLocationId, locations, pickupHub])

  // Resolve active vehicle - NEVER falls back to MOCK_VEHICLES
  const vehicle = React.useMemo((): Vehicle => {
    const vid = draft.vehicleId
    if (liveVehicle) return liveVehicle
    if (vehicleLoading) {
      return {
        id: vid,
        make: "Loading...",
        model: "Vehicle Details",
        year: new Date().getFullYear(),
        category: "sedan",
        transmission: "Automatic",
        fuelType: "Petrol",
        seats: 0,
        luggage: 0,
        dailyRate: 0,
        currency: "₱",
        features: [],
        available: true,
      }
    }
    // Controlled empty/unavailable state - NEVER falls back to MOCK_VEHICLES
    return {
      id: vid || "unselected",
      make: vid ? "Vehicle Unavailable" : "No Vehicle Selected",
      model: vid ? "Please choose another model" : "Please select from our fleet",
      year: new Date().getFullYear(),
      category: "sedan",
      transmission: "Automatic",
      fuelType: "Petrol",
      seats: 4,
      luggage: 2,
      dailyRate: 0,
      currency: "₱",
      features: [],
      available: false,
    }
  }, [draft.vehicleId, liveVehicle, vehicleLoading])

  // --- Live Quote Calculation ---
  const [liveQuote, setLiveQuote] = React.useState<LiveQuoteResult | null>(null)
  const [quoteLoading, setQuoteLoading] = React.useState(false)
  const [quoteError, setQuoteError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const vid = draft.vehicleId
    if (!isRealUuid(vid) || !pickupHub.id || !returnHub.id) {
      queueMicrotask(() => setLiveQuote(null))
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setQuoteLoading(true)
        setQuoteError(null)
      }
    })

    const pickupIso = `${draft.pickupDate}T${draft.pickupTime}:00Z`
    const returnIso = `${draft.returnDate}T${draft.returnTime}:00Z`

    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: vid,
        pickupLocationId: pickupHub.id,
        returnLocationId: returnHub.id,
        pickupAt: pickupIso,
        returnAt: returnIso,
        selectedExtras: draft.selectedExtras,
      }),
    })
      .then((res) => res.json())
      .then((data: { success: boolean; quote?: LiveQuoteResult; message?: string }) => {
        if (cancelled) return
        if (data.success && data.quote) {
          setLiveQuote(data.quote)
          setQuoteError(null)
        } else {
          setQuoteError(data.message || "Unable to calculate quote for selected dates.")
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setQuoteError(err instanceof Error ? err.message : "Failed to load live quote.")
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    draft.vehicleId,
    pickupHub.id,
    returnHub.id,
    draft.pickupDate,
    draft.pickupTime,
    draft.returnDate,
    draft.returnTime,
    draft.selectedExtras,
  ])

  // Sync safe context to sessionStorage
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

  // Calculate rental duration in whole days
  const rentalDays = React.useMemo(() => {
    if (liveQuote) return liveQuote.rentalDays
    try {
      const start = new Date(`${draft.pickupDate}T${draft.pickupTime}`)
      const end = new Date(`${draft.returnDate}T${draft.returnTime}`)
      const diffMs = end.getTime() - start.getTime()
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return days > 0 ? days : 1
    } catch {
      return 3
    }
  }, [liveQuote, draft.pickupDate, draft.pickupTime, draft.returnDate, draft.returnTime])

  // Pricing: ALWAYS use live quote pricing when available!
  const pricing = React.useMemo(() => {
    if (liveQuote?.pricing) {
      return liveQuote.pricing
    }
    return calculateBookingPricing(vehicle, rentalDays, draft.selectedExtras, liveExtras)
  }, [liveQuote, vehicle, rentalDays, draft.selectedExtras, liveExtras])

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

  // Update driver details field
  const updateDriver = React.useCallback(
    (field: keyof DriverDetails, value: string) => {
      setDraft((prev) => ({
        ...prev,
        driver: { ...prev.driver, [field]: value },
      }))
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

  // Complete booking: Creates live reservation in Supabase when vehicleId is real UUID
  const completeBooking = React.useCallback(async (): Promise<string> => {
    const vid = draft.vehicleId

    if (isRealUuid(vid)) {
      setStatus("submitting")

      const pickupIso = `${draft.pickupDate}T${draft.pickupTime}:00Z`
      const returnIso = `${draft.returnDate}T${draft.returnTime}:00Z`

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vid,
          pickupLocationId: pickupHub.id,
          returnLocationId: returnHub.id,
          pickupAt: pickupIso,
          returnAt: returnIso,
          selectedExtras: draft.selectedExtras,
          quoteId: liveQuote?.quoteId,
          driver: draft.driver,
          paymentMethod: draft.paymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setStatus("error")
        throw new Error(data.message || "Failed to create reservation.")
      }

      const reference = data.reference
      const reservationId = data.reservationId
      updateDraft({ bookingReference: reference })

      // For online payment methods (Card, E-Wallet), create checkout session
      if (draft.paymentMethod === "card" || draft.paymentMethod === "e-wallet") {
        try {
          const checkoutRes = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reservationId,
              paymentMethod: draft.paymentMethod,
            }),
          })
          const checkoutData = await checkoutRes.json()
          if (checkoutRes.ok && checkoutData.success && checkoutData.checkoutUrl) {
            if (typeof window !== "undefined") {
              window.location.href = checkoutData.checkoutUrl
              return reference
            }
          }
        } catch (err) {
          console.error("[booking-context] Checkout session creation failed:", err)
        }
      }

      setStatus("confirmed")
      return reference
    }

    // Legacy mock slug fallback
    const reference =
      draft.bookingReference ||
      `VYR-DEMO-${Math.floor(1000 + Math.random() * 9000)}`
    updateDraft({ bookingReference: reference })
    setStatus("confirmed")
    return reference
  }, [draft, pickupHub.id, returnHub.id, liveQuote?.quoteId, updateDraft])

  // Reset booking
  const resetBooking = React.useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(LEGACY_STORAGE_KEY)
    }
    setDraft(initialDraft())
    setDriverErrors({})
    setStatus("idle")
    setLiveVehicle(null)
    setLiveQuote(null)
  }, [initialDraft])

  const contextValue: BookingContextValue = {
    draft,
    vehicle,
    pickupLocationName: pickupHub.barangay
      ? `Barangay ${pickupHub.barangay}, Butuan City, Agusan del Norte`
      : `${pickupHub.name}, Butuan City, Agusan del Norte`,
    returnLocationName: returnHub.barangay
      ? `Barangay ${returnHub.barangay}, Butuan City, Agusan del Norte`
      : `${returnHub.name}, Butuan City, Agusan del Norte`,
    pickupHub,
    returnHub,
    availableLocations: locations,
    rentalDays,
    pricing,
    driverErrors,
    status,
    currentStep,
    liveQuote,
    quoteLoading,
    quoteError,
    availableExtras: liveExtras,
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
