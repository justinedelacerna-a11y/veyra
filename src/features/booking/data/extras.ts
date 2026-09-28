import { ExtraOption } from "../types"

export const MOCK_BOOKING_EXTRAS: ExtraOption[] = [
  {
    id: "extra-zero-excess",
    name: "Full Protection Waiver",
    tagline: "Zero Excess Liability",
    description:
      "Eliminates out-of-pocket deductible for accidental vehicle body damage, tire rim scuffs, and windshield stone chips.",
    dailyRate: 850,
    category: "protection",
    badge: "Recommended",
  },
  {
    id: "extra-add-driver",
    name: "Additional Authorized Driver",
    tagline: "Split Driving Responsibilities",
    description:
      "Registers a second licensed driver on the rental contract with full coverage eligibility during long provincial journeys.",
    dailyRate: 500,
    category: "convenience",
  },
  {
    id: "extra-gps-wifi",
    name: "Portable Wi-Fi & GPS Concierge",
    tagline: "High-Speed Mobile Connectivity",
    description:
      "Dedicated 5G in-car mobile Wi-Fi hotspot with unlimited local data and pre-cached offline GPS navigation.",
    dailyRate: 350,
    category: "equipment",
  },
  {
    id: "extra-child-seat",
    name: "Certified Child Safety Seat",
    tagline: "ISOFIX Secure Mount",
    description:
      "ECE R44/04 certified safety seat suitable for infants and toddlers up to 36kg. Sanitized and pre-installed.",
    dailyRate: 300,
    category: "equipment",
  },
  {
    id: "extra-unlimited-km",
    name: "Unlimited Travel Mileage",
    tagline: "No Daily Distance Caps",
    description:
      "Waives the standard 300 km/day mileage threshold for cross-island road trips and scenic provincial itineraries.",
    dailyRate: 600,
    category: "mileage",
  },
]
