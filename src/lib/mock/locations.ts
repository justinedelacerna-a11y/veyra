import { LocationHub } from "@/types"

/**
 * Mock Location Hubs for Veyra
 * NOTE: These represent prototype sample branch data and will later be connected to Supabase.
 */
export const MOCK_LOCATIONS: LocationHub[] = [
  {
    id: "loc-cgy-airport",
    name: "Laguindingan International Airport (CGY)",
    city: "Cagayan de Oro",
    type: "Airport Terminal",
    address: "Arrivals Level 1 • Valet Bay 3, Laguindingan",
    operatingHours: "24/7 Continuous Handover",
    pickupAvailable: true,
  },
  {
    id: "loc-cgy-downtown",
    name: "CDO Uptown & Downtown Hub",
    city: "Cagayan de Oro",
    type: "City Center",
    address: "Pueblo Business Park, Masterson Avenue",
    operatingHours: "7:00 AM – 9:00 PM Daily",
    pickupAvailable: true,
  },
  {
    id: "loc-dvo-airport",
    name: "Davao International Airport (DVO)",
    city: "Davao City",
    type: "Airport Terminal",
    address: "Terminal 1 Commercial Parking Bay A",
    operatingHours: "24/7 Continuous Handover",
    pickupAvailable: true,
  },
  {
    id: "loc-ceb-airport",
    name: "Mactan-Cebu International Airport (CEB)",
    city: "Cebu",
    type: "Airport Terminal",
    address: "Terminal 2 International / Domestic Valet",
    operatingHours: "24/7 Continuous Handover",
    pickupAvailable: true,
  },
  {
    id: "loc-ceb-itpark",
    name: "Cebu IT Park Hub",
    city: "Cebu City",
    type: "City Center",
    address: "Asia Premier Residences Ground concourse",
    operatingHours: "6:00 AM – 10:00 PM Daily",
    pickupAvailable: true,
  },
  {
    id: "loc-iligan-central",
    name: "Iligan City Commercial Hub",
    city: "Iligan",
    type: "City Center",
    address: "Tibanga Highway Commercial Center",
    operatingHours: "8:00 AM – 8:00 PM Daily",
    pickupAvailable: true,
  },
]
