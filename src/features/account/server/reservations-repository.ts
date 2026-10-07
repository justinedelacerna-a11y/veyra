import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { CustomerReservation, CustomerReservationStatus } from "../types"
import type { Vehicle } from "@/types"

interface DbVehicle {
  id: string
  make: string
  model: string
  year: number
  category?: string
  transmission: string
  fuel_type: string
  seats: number
  luggage_capacity: number
  daily_rate: number
  currency: string
}

interface DbLocation {
  id: string
  name: string
  barangay?: string | null
  city: string
  address: string
}

interface DbReservationExtra {
  id: string
  extra_id: string
  extra_name: string
  daily_rate: number
  total: number
}

interface DbReservationDriver {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  license_number: string
  license_country: string
}

interface DbReservationRow {
  id: string
  reference: string
  vehicle_id: string
  pickup_location_id: string
  return_location_id: string
  pickup_at: string
  return_at: string
  rental_days: number
  status: string
  payment_status: string
  payment_method: string | null
  total_amount: number
  deposit_amount: number
  currency: string
  created_at: string
  vehicle: DbVehicle | null
  pickup_location: DbLocation | null
  return_location: DbLocation | null
  reservation_extras: DbReservationExtra[] | null
  reservation_drivers: DbReservationDriver[] | null
}

function mapStatusToCustomerStatus(dbStatus: string): {
  status: CustomerReservationStatus
  label: string
} {
  switch (dbStatus) {
    case "active":
      return { status: "active", label: "Trip In Progress" }
    case "return_inspection":
      return { status: "return_inspection", label: "Return Inspection" }
    case "completed":
      return { status: "completed", label: "Completed Trip" }
    case "cancelled":
      return { status: "cancelled", label: "Cancelled" }
    case "held":
      return { status: "upcoming", label: "Inventory Held (Pending Checkout)" }
    case "payment_pending":
      return { status: "upcoming", label: "Payment Processing" }
    case "payment_failed":
      return { status: "cancelled", label: "Payment Failed" }
    case "expired":
      return { status: "cancelled", label: "Hold Expired" }
    case "no_show":
      return { status: "no_show", label: "No-Show" }
    case "disputed":
      return { status: "disputed", label: "Under Review" }
    case "pickup_ready":
      return { status: "upcoming", label: "Ready for Pickup" }
    case "confirmed":
    default:
      return { status: "upcoming", label: "Confirmed • Upcoming" }
  }
}

/**
 * Fetch customer's real reservations from Supabase.
 *
 * Uses createClient() which automatically passes the Clerk JWT.
 * Postgres RLS enforces `customer_id = veyra_private.current_customer_id()`.
 * Customers can ONLY read their own reservations.
 */
export async function getCustomerReservations(): Promise<CustomerReservation[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        id,
        reference,
        vehicle_id,
        pickup_location_id,
        return_location_id,
        pickup_at,
        return_at,
        rental_days,
        status,
        payment_status,
        payment_method,
        total_amount,
        deposit_amount,
        currency,
        created_at,
        vehicle:vehicles!reservations_vehicle_id_fkey(
          id, make, model, year, transmission, fuel_type, seats, luggage_capacity, daily_rate, currency
        ),
        pickup_location:locations!reservations_pickup_location_id_fkey(
          id, name, barangay, city, address
        ),
        return_location:locations!reservations_return_location_id_fkey(
          id, name, barangay, city, address
        ),
        reservation_extras(id, extra_id, extra_name, daily_rate, total),
        reservation_drivers(first_name, last_name, email, phone, license_number, license_country)
      `
      )
      .order("created_at", { ascending: false })

    if (error || !data) {
      console.error("[reservations-repository] query error:", error?.message)
      return []
    }

    const rows = data as unknown as DbReservationRow[]

    return rows.map((row) => {
      const { status, label } = mapStatusToCustomerStatus(row.status)
      const pickupDateObj = new Date(row.pickup_at)
      const returnDateObj = new Date(row.return_at)

      const vehicle: Vehicle = {
        id: row.vehicle?.id || row.vehicle_id,
        make: row.vehicle?.make || "Veyra",
        model: row.vehicle?.model || "Fleet Vehicle",
        year: row.vehicle?.year || new Date().getFullYear(),
        category: (row.vehicle?.category || "sedan") as Vehicle["category"],
        transmission: (row.vehicle?.transmission || "Automatic") as Vehicle["transmission"],
        fuelType: (row.vehicle?.fuel_type || "Petrol") as Vehicle["fuelType"],
        seats: row.vehicle?.seats || 5,
        luggage: row.vehicle?.luggage_capacity || 3,
        dailyRate: Number(row.vehicle?.daily_rate || 0) / 100,
        currency: "₱",
        features: [],
        available: true,
        images: [],
      }

      const primaryDriver = row.reservation_drivers?.[0]
      const driverFullName = primaryDriver
        ? `${primaryDriver.first_name} ${primaryDriver.last_name}`
        : "Verified Customer"

      const maskedLicense = primaryDriver?.license_number
        ? primaryDriver.license_number.length > 4
          ? `${primaryDriver.license_number.slice(0, 3)}-**-***`
          : primaryDriver.license_number
        : "N02-**-***"

      const totalCentavos = Number(row.total_amount)
      const depositCentavos = Number(row.deposit_amount)
      const dailyRateCentavos = Number(row.vehicle?.daily_rate || 0)
      const baseRentalCentavos = dailyRateCentavos * row.rental_days
      const extrasCentavos = totalCentavos - baseRentalCentavos

      const paymentMethodMap: Record<string, "card" | "e-wallet" | "counter"> = {
        card: "card",
        e_wallet: "e-wallet",
        counter: "counter",
      }

      const paymentStatusMap: Record<string, "pending" | "authorized" | "captured" | "refunded" | "cancelled" | "failed"> = {
        pending: "pending",
        authorized: "authorized",
        captured: "captured",
        refunded: "refunded",
        failed: "failed",
      }

      return {
        id: row.reference,
        uuid: row.id,
        vehicleId: row.vehicle_id,
        vehicle,
        status,
        statusLabel: label,
        createdAt: new Date(row.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        pickupLocationId: row.pickup_location_id,
        pickupLocationName: row.pickup_location?.name || "Barangay Libertad Hub",
        pickupBarangay: row.pickup_location?.barangay || "Libertad",
        pickupAddress: row.pickup_location?.address || "National Highway, Brgy. Libertad, Butuan City, Agusan del Norte",
        pickupDate: pickupDateObj.toISOString().split("T")[0],
        pickupTime: pickupDateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        returnLocationId: row.return_location_id,
        returnLocationName: row.return_location?.name || "Barangay Libertad Hub",
        returnBarangay: row.return_location?.barangay || "Libertad",
        returnAddress: row.return_location?.address || "National Highway, Brgy. Libertad, Butuan City, Agusan del Norte",
        returnDate: returnDateObj.toISOString().split("T")[0],
        returnTime: returnDateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        rentalDays: row.rental_days,
        pricing: {
          dailyRate: dailyRateCentavos / 100,
          rentalDays: row.rental_days,
          baseRental: baseRentalCentavos / 100,
          extrasSubtotal: extrasCentavos > 0 ? extrasCentavos / 100 : 0,
          airportConcessionFee: 0,
          mandatoryLiabilityCoverage: 0,
          localTaxes: 0,
          subtotal: totalCentavos / 100,
          discount: 0,
          totalRentalPrice: totalCentavos / 100,
          refundableSecurityDeposit: depositCentavos / 100,
          currency: "₱",
        },
        selectedExtras: (row.reservation_extras || []).map((ext) => ({
          id: ext.extra_id,
          name: ext.extra_name,
          tagline: "Included Option",
          description: ext.extra_name,
          dailyRate: Number(ext.daily_rate) / 100,
          category: "convenience" as const,
        })),
        driver: {
          fullName: driverFullName,
          email: primaryDriver?.email || "",
          phone: primaryDriver?.phone || "",
          licenseNumberMasked: maskedLicense,
          licenseCountry: primaryDriver?.license_country === "PH" ? "Philippines (LTO)" : "International",
        },
        timeline: [
          {
            step: "booked",
            title: "Reservation Placed",
            date: new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            completed: true,
            current: row.status === "held" || row.status === "quote_created",
            description: "Initial booking quote and vehicle slot held.",
          },
          {
            step: "confirmed",
            title: "Booking Confirmed",
            date: "Vehicle Slot Reserved",
            completed: row.status !== "held" && row.status !== "quote_created",
            current: row.status === "confirmed",
            description: "Vehicle assignment locked in fleet inventory.",
          },
          {
            step: "pickup",
            title: "Pickup & Key Handover",
            date: `${pickupDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${row.pickup_location?.name || "Butuan City Operations Hub"}`,
            completed: row.status === "active" || row.status === "completed",
            current: row.status === "pickup_ready",
            description: "Handover at Butuan City Operations Hub.",
          },
          {
            step: "active",
            title: "Active Rental",
            date: `${row.rental_days} Days Mobility`,
            completed: row.status === "completed",
            current: row.status === "active",
            description: "24/7 dedicated fleet logistics concierge.",
          },
          {
            step: "return",
            title: "Return & Inspection",
            date: returnDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            completed: row.status === "completed",
            current: row.status === "return_inspection",
            description: "Vehicle inspection and security hold release.",
          },
          {
            step: "completed",
            title: "Rental Completed",
            date: "Closed",
            completed: row.status === "completed",
            current: false,
            description: "Rental receipt finalized.",
          },
        ],
        paymentMethod: paymentMethodMap[row.payment_method || "card"] || "card",
        paymentStatus: paymentStatusMap[row.payment_status] || "authorized",
        cancellationPolicy: "Free cancellation with full refund up to 24 hours prior to scheduled handover time.",
        handoverChecklist: [
          "Present original driver's license at valet counter",
          "Digital handover sign-off via customer portal",
          "Cabin walkaround and key release",
        ],
      }
    })
  } catch (err) {
    console.error("[reservations-repository] unexpected error:", err)
    return []
  }
}

/**
 * Fetch a single customer reservation by its reference code (e.g. VYR-2026-XXXX) or database UUID.
 * Postgres RLS enforces `customer_id = veyra_private.current_customer_id()`.
 */
export async function getCustomerReservationById(
  idOrReference: string
): Promise<CustomerReservation | null> {
  const all = await getCustomerReservations()
  const target = idOrReference.trim().toLowerCase()
  return (
    all.find(
      (r) =>
        r.id.toLowerCase() === target ||
        (r.uuid && r.uuid.toLowerCase() === target)
    ) || null
  )
}

