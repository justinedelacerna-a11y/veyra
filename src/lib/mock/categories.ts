import { CategoryCardData } from "@/types"

/**
 * Mock Vehicle Categories for Veyra
 * NOTE: Prototype mock data for category discovery.
 */
export const MOCK_CATEGORIES: CategoryCardData[] = [
  {
    id: "sedan",
    name: "Executive Sedans",
    tagline: "Efficiency & Refinement",
    description: "Smooth handling and executive interior comfort tailored for business commutes and highway cruising.",
    startingPrice: 2800,
    vehicleCount: 14,
  },
  {
    id: "suv",
    name: "Luxury SUVs",
    tagline: "Capability & Elevated View",
    description: "Commanding seating position, all-terrain confidence, and ample luggage volume for family road trips.",
    startingPrice: 4500,
    vehicleCount: 18,
  },
  {
    id: "electric",
    name: "Electric & Hybrids",
    tagline: "Instant Torque & Zero Tailpipe",
    description: "Cutting-edge electric performance pre-charged to at least 85% with complimentary airport charging access.",
    startingPrice: 5200,
    vehicleCount: 9,
  },
  {
    id: "van",
    name: "Group & Travel Vans",
    tagline: "Spacious Multi-Passenger",
    description: "Premium seating for 7 to 10 travelers with dual climate controls and deep cargo capacity.",
    startingPrice: 4200,
    vehicleCount: 8,
  },
  {
    id: "luxury",
    name: "Prestige & Luxury",
    tagline: "Uncompromised Distinction",
    description: "World-class craftsmanship, whisper-quiet cabins, and flagship touring performance.",
    startingPrice: 5800,
    vehicleCount: 6,
  },
]
