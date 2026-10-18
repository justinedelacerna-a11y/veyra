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
  cancellation_reason?: string | null
  rejection_reason?: string | null
  approved_at?: string | null
  approved_by?: string | null
  actual_pickup_at?: string | null
  actual_return_at?: string | null
  created_at: string
  pickup_barangay?: string | null
  pickup_street_address?: string | null
  pickup_landmark?: string | null
  pickup_contact_phone?: string | null
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
    case "pending_approval":
      return { status: "pending_approval", label: "Awaiting Admin Approval" }
    case "payment_pending":
      return { status: "pending_approval", label: "Payment Processing / In Review" }
    case "held":
      return { status: "pending_approval", label: "Hold Awaiting Staff Review" }
    case "confirmed":
      return { status: "upcoming", label: "Booking Confirmed • Vehicle Reserved" }
    case "pickup_ready":
      return { status: "upcoming", label: "Ready for Pickup & Handover" }
    case "active":
      return { status: "active", label: "Active Rental • Trip In Progress" }
    case "return_inspection":
      return { status: "return_inspection", label: "Return & Inspection" }
    case "completed":
      return { status: "completed", label: "Rental Completed" }
    case "cancelled":
      return { status: "cancelled", label: "Cancelled / Rejected" }
    case "payment_failed":
      return { status: "cancelled", label: "Payment Failed" }
    case "expired":
      return { status: "cancelled", label: "Hold Expired" }
    case "no_show":
      return { status: "no_show", label: "No-Show" }
    case "disputed":
      return { status: "disputed", label: "Under Review" }
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
    let { data, error } = await supabase
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
        cancellation_reason,
        rejection_reason,
        approved_at,
        approved_by,
        actual_pickup_at,
        actual_return_at,
        created_at,
        pickup_barangay,
        pickup_street_address,
        pickup_landmark,
        pickup_contact_phone,
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

    // Graceful backward compatibility if remote database has not yet applied the pickup_barangay column migration
    if (error && error.message?.includes("pickup_barangay")) {
      const fallback = await supabase
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
        cancellation_reason,
        rejection_reason,
        approved_at,
        approved_by,
        actual_pickup_at,
        actual_return_at,
        created_at,
        pickup_street_address,
        pickup_landmark,
        pickup_contact_phone,
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
      data = fallback.data as typeof data
      error = fallback.error
    }

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
        dbStatus: row.status,
        statusLabel: label,
        createdAt: new Date(row.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        approvedAt: row.approved_at || undefined,
        rejectionReason: row.rejection_reason || row.cancellation_reason || undefined,
        actualPickupAt: row.actual_pickup_at || undefined,
        actualReturnAt: row.actual_return_at || undefined,
        pickupLocationId: row.pickup_location_id,
        pickupLocationName: row.pickup_location?.name || "Barangay Libertad Hub",
        pickupBarangay: row.pickup_barangay || row.pickup_location?.barangay || "Libertad",
        pickupAddress: row.pickup_location?.address || "National Highway, Brgy. Libertad, Butuan City, Agusan del Norte",
        pickupStreetAddress: row.pickup_street_address || undefined,
        pickupLandmark: row.pickup_landmark || undefined,
        pickupContactPhone: row.pickup_contact_phone || undefined,
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
        timeline: (() => {
          const isCancelledOrRejected =
            row.status === "cancelled" ||
            row.status === "expired" ||
            row.status === "payment_failed"

          const isApproved =
            row.status === "confirmed" ||
            row.status === "pickup_ready" ||
            row.status === "active" ||
            row.status === "return_inspection" ||
            row.status === "completed"

          const isHandedOver =
            row.status === "active" ||
            row.status === "return_inspection" ||
            row.status === "completed"

          const isRentalCompleted = row.status === "completed"

          // 1. Payment status details
          const paymentCaptured = row.payment_status === "captured"
          const isCounter = row.payment_method === "counter"
          const paymentFailed = row.payment_status === "failed"

          let paymentTitle = "Payment"
          let paymentDate = "Pending"
          let paymentDesc = "Awaiting payment settlement."
          if (paymentCaptured) {
            paymentTitle = "Payment Completed"
            paymentDate = "Captured"
            paymentDesc = "Payment confirmed and recorded."
          } else if (isCounter) {
            paymentTitle = "Pay at Pickup"
            paymentDate = "At Handover"
            paymentDesc = "Payment to be collected upon vehicle handover."
          } else if (paymentFailed) {
            paymentTitle = "Payment Failed"
            paymentDate = "Declined"
            paymentDesc = "Payment attempt was unsuccessful."
          }

          // 2. Admin Review & Approval milestone
          let approvalTitle = "Awaiting Admin Approval"
          let approvalDate = "In Review"
          let approvalDesc = "Your reservation has been submitted and is awaiting staff approval."
          let approvalCompleted = false
          let approvalCurrent = false
          let approvalFailed = false

          if (isCancelledOrRejected) {
            approvalTitle = row.rejection_reason ? "Reservation Rejected" : "Reservation Cancelled"
            approvalDate = "Declined"
            approvalDesc =
              row.rejection_reason ||
              row.cancellation_reason ||
              "Your reservation was rejected or cancelled."
            approvalFailed = true
          } else if (isApproved) {
            approvalTitle = "Admin Approval"
            approvalDate = row.approved_at
              ? new Date(row.approved_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Approved"
            approvalDesc =
              "Your reservation has been approved. Your vehicle is reserved for the selected dates."
            approvalCompleted = true
          } else {
            approvalCurrent = true
          }

          return [
            {
              step: "submitted" as const,
              title: "Reservation Submitted",
              date: new Date(row.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              completed: true,
              current: false,
              description: `Booking request placed for ${row.rental_days} day${row.rental_days !== 1 ? "s" : ""}.`,
            },
            {
              step: "payment" as const,
              title: paymentTitle,
              date: paymentDate,
              completed: paymentCaptured || isCounter,
              current:
                !isCancelledOrRejected &&
                !paymentCaptured &&
                !isCounter &&
                row.status === "payment_pending",
              failed: paymentFailed,
              description: paymentDesc,
            },
            {
              step: "approval" as const,
              title: approvalTitle,
              date: approvalDate,
              completed: approvalCompleted,
              current: approvalCurrent,
              failed: approvalFailed,
              description: approvalDesc,
            },
            {
              step: "confirmed" as const,
              title: "Booking Confirmed",
              date: isApproved ? "Confirmed" : "Pending",
              completed: isApproved,
              current: !isCancelledOrRejected && row.status === "confirmed",
              description: isApproved
                ? "Vehicle assignment locked in fleet inventory."
                : "Vehicle will be locked once staff completes review.",
            },
            {
              step: "pickup" as const,
              title: "Pickup & Key Handover",
              date: row.actual_pickup_at
                ? new Date(row.actual_pickup_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : `${pickupDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${row.pickup_location?.name || "Butuan Operations Hub"}`,
              completed: isHandedOver,
              current: !isCancelledOrRejected && row.status === "pickup_ready",
              description: row.actual_pickup_at
                ? "Vehicle keys handed over to customer."
                : "Vehicle inspection and key handover at designated hub.",
            },
            {
              step: "active" as const,
              title: "Active Rental",
              date: row.actual_pickup_at ? "In Progress" : `${row.rental_days} Days Mobility`,
              completed: isRentalCompleted,
              current: !isCancelledOrRejected && row.status === "active",
              description:
                row.status === "active"
                  ? "Your rental is now active. The vehicle handover has been recorded."
                  : "24/7 dedicated fleet logistics concierge and support.",
            },
            {
              step: "return" as const,
              title: "Return & Inspection",
              date: row.actual_return_at
                ? new Date(row.actual_return_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : returnDateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  }),
              completed: isRentalCompleted,
              current: !isCancelledOrRejected && row.status === "return_inspection",
              description: "Vehicle return inspection and security hold release.",
            },
            {
              step: "completed" as const,
              title: "Rental Completed",
              date: isRentalCompleted ? "Closed" : "Pending",
              completed: isRentalCompleted,
              current: false,
              description: isRentalCompleted
                ? "Rental contract finalized and closed."
                : "Final contract closure following return inspection.",
            },
          ]
        })(),
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

