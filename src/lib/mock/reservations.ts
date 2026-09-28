import { CustomerReservation } from "@/features/account/types"
import { MOCK_VEHICLES } from "./vehicles"
import { MOCK_LOCATIONS } from "./locations"
import { MOCK_BOOKING_EXTRAS } from "@/features/booking/data/extras"
import { calculateBookingPricing } from "@/features/booking/lib/pricing"

const camry = MOCK_VEHICLES.find((v) => v.id === "veh-camry-hev") || MOCK_VEHICLES[0]
const patrol = MOCK_VEHICLES.find((v) => v.id === "veh-patrol-nismo") || MOCK_VEHICLES[1]
const taycan = MOCK_VEHICLES.find((v) => v.id === "veh-taycan-4s") || MOCK_VEHICLES[2]
const bmw = MOCK_VEHICLES.find((v) => v.id === "veh-bmw-530i") || MOCK_VEHICLES[3]

const cgyAirport = MOCK_LOCATIONS.find((l) => l.id === "loc-cgy-airport") || MOCK_LOCATIONS[0]
const cgyDowntown = MOCK_LOCATIONS.find((l) => l.id === "loc-cgy-downtown") || MOCK_LOCATIONS[1]
const dvoAirport = MOCK_LOCATIONS.find((l) => l.id === "loc-dvo-airport") || MOCK_LOCATIONS[2]
const cebAirport = MOCK_LOCATIONS.find((l) => l.id === "loc-ceb-airport") || MOCK_LOCATIONS[3]

export const MOCK_RESERVATIONS: CustomerReservation[] = [
  {
    id: "VYR-8492-CDO",
    vehicleId: camry.id,
    vehicle: camry,
    status: "upcoming",
    statusLabel: "Confirmed • Upcoming",
    createdAt: "Sep 24, 2026",
    pickupLocationId: cgyAirport.id,
    pickupLocationName: cgyAirport.name,
    pickupAddress: cgyAirport.address,
    pickupDate: "2026-10-15",
    pickupTime: "10:00 AM",
    returnLocationId: cgyAirport.id,
    returnLocationName: cgyAirport.name,
    returnAddress: cgyAirport.address,
    returnDate: "2026-10-18",
    returnTime: "05:00 PM",
    rentalDays: 3,
    pricing: calculateBookingPricing(camry, 3, ["extra-zero-excess", "extra-gps-wifi"]),
    selectedExtras: [
      MOCK_BOOKING_EXTRAS.find((e) => e.id === "extra-zero-excess")!,
      MOCK_BOOKING_EXTRAS.find((e) => e.id === "extra-gps-wifi")!,
    ].filter(Boolean),
    driver: {
      fullName: "Elena Santos Cruz",
      email: "elena.cruz@example.com",
      phone: "+63 917 555 0192",
      licenseNumberMasked: "N02-**-***842",
      licenseCountry: "Philippines (LTO)",
    },
    timeline: [
      {
        step: "booked",
        title: "Reservation Placed",
        date: "Sep 24, 2026 • 2:15 PM",
        completed: true,
        current: false,
        description: "Initial booking quote and vehicle slot held.",
      },
      {
        step: "confirmed",
        title: "Booking Confirmed",
        date: "Sep 24, 2026 • 2:16 PM",
        completed: true,
        current: false,
        description: "Vehicle assignment locked in fleet inventory.",
      },
      {
        step: "pickup",
        title: "Pickup & Key Handover",
        date: "Scheduled Oct 15, 2026 • 10:00 AM",
        completed: false,
        current: true,
        description: "Valet Bay 3 at Laguindingan International Airport.",
      },
      {
        step: "active",
        title: "Active Rental",
        date: "Oct 15 – Oct 18, 2026",
        completed: false,
        current: false,
        description: "24/7 concierge assistance and unlimited mileage active.",
      },
      {
        step: "return",
        title: "Return & Inspection",
        date: "Scheduled Oct 18, 2026 • 05:00 PM",
        completed: false,
        current: false,
        description: "Vehicle walkaround and security hold release.",
      },
      {
        step: "completed",
        title: "Rental Completed",
        date: "Pending return",
        completed: false,
        current: false,
        description: "Digital receipt and loyalty miles credited.",
      },
    ],
    paymentMethod: "card",
    paymentStatus: "authorized",
    cancellationPolicy: "Free cancellation with full refund up to 48 hours prior to scheduled pickup time.",
    handoverChecklist: [
      "Physical Original Driver's License (Physical card required; digital copies cannot be accepted)",
      "Credit Card under driver's name for refundable security hold (₱12,000)",
      "Booking confirmation voucher (digital QR on mobile is sufficient)",
      "Arrive at Laguindingan Airport Valet Bay 3 with matching flight arrival or notify concierge of delays",
    ],
    notes: "Preferred child seat sanitized and pre-configured. Non-smoking vehicle guarantee.",
  },
  {
    id: "VYR-7310-DVO",
    vehicleId: patrol.id,
    vehicle: patrol,
    status: "active",
    statusLabel: "Active Rental In-Progress",
    createdAt: "Sep 20, 2026",
    pickupLocationId: dvoAirport.id,
    pickupLocationName: dvoAirport.name,
    pickupAddress: dvoAirport.address,
    pickupDate: "2026-09-27",
    pickupTime: "09:00 AM",
    returnLocationId: dvoAirport.id,
    returnLocationName: dvoAirport.name,
    returnAddress: dvoAirport.address,
    returnDate: "2026-10-01",
    returnTime: "06:00 PM",
    rentalDays: 4,
    pricing: calculateBookingPricing(patrol, 4, ["extra-zero-excess", "extra-add-driver"]),
    selectedExtras: [
      MOCK_BOOKING_EXTRAS.find((e) => e.id === "extra-zero-excess")!,
      MOCK_BOOKING_EXTRAS.find((e) => e.id === "extra-add-driver")!,
    ].filter(Boolean),
    driver: {
      fullName: "Elena Santos Cruz",
      email: "elena.cruz@example.com",
      phone: "+63 917 555 0192",
      licenseNumberMasked: "N02-**-***842",
      licenseCountry: "Philippines (LTO)",
    },
    timeline: [
      {
        step: "booked",
        title: "Reservation Placed",
        date: "Sep 20, 2026 • 11:30 AM",
        completed: true,
        current: false,
        description: "Initial booking quote and vehicle slot held.",
      },
      {
        step: "confirmed",
        title: "Booking Confirmed",
        date: "Sep 20, 2026 • 11:32 AM",
        completed: true,
        current: false,
        description: "Vehicle assignment locked in fleet inventory.",
      },
      {
        step: "pickup",
        title: "Pickup & Key Handover",
        date: "Completed Sep 27, 2026 • 09:12 AM",
        completed: true,
        current: false,
        description: "Physical walkaround completed at Davao Airport Bay A.",
      },
      {
        step: "active",
        title: "Active Rental",
        date: "Current Status",
        completed: false,
        current: true,
        description: "In-progress road travel across Davao del Sur and Samal.",
      },
      {
        step: "return",
        title: "Return & Inspection",
        date: "Scheduled Oct 01, 2026 • 06:00 PM",
        completed: false,
        current: false,
        description: "Return to Terminal 1 Commercial Parking Bay A.",
      },
      {
        step: "completed",
        title: "Rental Completed",
        date: "Pending return",
        completed: false,
        current: false,
        description: "Final invoice and security hold release.",
      },
    ],
    paymentMethod: "card",
    paymentStatus: "captured",
    cancellationPolicy: "Non-refundable once vehicle handover walkaround is signed and vehicle departs.",
    handoverChecklist: [
      "Physical Original Driver's License verified during pickup",
      "Refundable security deposit pre-authorized (₱25,000)",
      "Multi-point digital inspection report acknowledged on tablet",
    ],
  },
  {
    id: "VYR-5198-CEB",
    vehicleId: taycan.id,
    vehicle: taycan,
    status: "completed",
    statusLabel: "Completed Trip",
    createdAt: "Aug 05, 2026",
    pickupLocationId: cebAirport.id,
    pickupLocationName: cebAirport.name,
    pickupAddress: cebAirport.address,
    pickupDate: "2026-08-12",
    pickupTime: "08:00 AM",
    returnLocationId: cebAirport.id,
    returnLocationName: cebAirport.name,
    returnAddress: cebAirport.address,
    returnDate: "2026-08-15",
    returnTime: "12:00 PM",
    rentalDays: 3,
    pricing: calculateBookingPricing(taycan, 3, ["extra-zero-excess"]),
    selectedExtras: [
      MOCK_BOOKING_EXTRAS.find((e) => e.id === "extra-zero-excess")!,
    ].filter(Boolean),
    driver: {
      fullName: "Elena Santos Cruz",
      email: "elena.cruz@example.com",
      phone: "+63 917 555 0192",
      licenseNumberMasked: "N02-**-***842",
      licenseCountry: "Philippines (LTO)",
    },
    timeline: [
      {
        step: "booked",
        title: "Reservation Placed",
        date: "Aug 05, 2026",
        completed: true,
        current: false,
        description: "Held slot for Porsche Taycan 4S.",
      },
      {
        step: "confirmed",
        title: "Booking Confirmed",
        date: "Aug 05, 2026",
        completed: true,
        current: false,
        description: "Exclusive EV charging concierge provisioned.",
      },
      {
        step: "pickup",
        title: "Pickup & Key Handover",
        date: "Aug 12, 2026 • 08:05 AM",
        completed: true,
        current: false,
        description: "Handover completed at Mactan-Cebu Valet.",
      },
      {
        step: "active",
        title: "Active Rental",
        date: "Aug 12 – Aug 15, 2026",
        completed: true,
        current: false,
        description: "Zero incidents reported across 420 km driven.",
      },
      {
        step: "return",
        title: "Return & Inspection",
        date: "Aug 15, 2026 • 11:45 AM",
        completed: true,
        current: false,
        description: "Pass inspection. 100% battery return credit applied.",
      },
      {
        step: "completed",
        title: "Rental Completed",
        date: "Aug 15, 2026 • 12:00 PM",
        completed: true,
        current: false,
        description: "Security hold released. Receipt delivered via email.",
      },
    ],
    paymentMethod: "card",
    paymentStatus: "captured",
    cancellationPolicy: "Standard completed rental.",
    handoverChecklist: [
      "Physical Original Driver's License verified",
      "Security hold released back to card ending in 4242",
    ],
  },
  {
    id: "VYR-3021-CDO",
    vehicleId: bmw.id,
    vehicle: bmw,
    status: "cancelled",
    statusLabel: "Cancelled by Customer",
    createdAt: "Jun 28, 2026",
    pickupLocationId: cgyDowntown.id,
    pickupLocationName: cgyDowntown.name,
    pickupAddress: cgyDowntown.address,
    pickupDate: "2026-07-04",
    pickupTime: "11:00 AM",
    returnLocationId: cgyDowntown.id,
    returnLocationName: cgyDowntown.name,
    returnAddress: cgyDowntown.address,
    returnDate: "2026-07-07",
    returnTime: "02:00 PM",
    rentalDays: 3,
    pricing: calculateBookingPricing(bmw, 3, []),
    selectedExtras: [],
    driver: {
      fullName: "Elena Santos Cruz",
      email: "elena.cruz@example.com",
      phone: "+63 917 555 0192",
      licenseNumberMasked: "N02-**-***842",
      licenseCountry: "Philippines (LTO)",
    },
    timeline: [
      {
        step: "booked",
        title: "Reservation Placed",
        date: "Jun 28, 2026",
        completed: true,
        current: false,
        description: "Initial booking quote and vehicle slot held.",
      },
      {
        step: "confirmed",
        title: "Booking Confirmed",
        date: "Jun 28, 2026",
        completed: true,
        current: false,
        description: "Vehicle assignment locked.",
      },
      {
        step: "return",
        title: "Cancelled by Customer",
        date: "Jul 01, 2026",
        completed: true,
        current: false,
        description: "Cancelled > 48h prior to pickup. 100% refund processed.",
      },
    ],
    paymentMethod: "card",
    paymentStatus: "refunded",
    cancellationPolicy: "Cancelled within free cancellation window. No fees charged.",
    handoverChecklist: [],
    notes: "Customer flight itinerary rescheduled.",
  },
]

export function getMockReservations(): CustomerReservation[] {
  return MOCK_RESERVATIONS
}

export function getMockReservationById(id: string): CustomerReservation | undefined {
  return MOCK_RESERVATIONS.find((r) => r.id.toLowerCase() === id.toLowerCase())
}

export function getUpcomingReservation(): CustomerReservation | undefined {
  return (
    MOCK_RESERVATIONS.find((r) => r.status === "active") ||
    MOCK_RESERVATIONS.find((r) => r.status === "upcoming")
  )
}
