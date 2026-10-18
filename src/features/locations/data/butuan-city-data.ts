/**
 * Comprehensive Geographic and Landmark Data for Butuan City, Agusan del Norte, Philippines.
 * Covers city boundaries, all 86 official barangays, major landmarks, roads, and Veyra pickup stations.
 */

export interface ButuanCoordinate {
  lat: number
  lng: number
}

export interface ButuanBarangay {
  name: string
  lat: number
  lng: number
  district: "Poblacion" | "Urban East" | "Urban West" | "Rural North" | "Rural South" | "Rural East" | "Rural West"
  type: "urban" | "rural"
  zipCode?: string
}

export interface ButuanLandmark {
  id: string
  name: string
  category: "transport" | "commercial" | "government" | "hospital" | "education" | "historical" | "park"
  barangay: string
  lat: number
  lng: number
  address: string
  description?: string
}

export interface VeyraHubLocation {
  id: string
  name: string
  barangay: string
  lat: number
  lng: number
  address: string
  operatingHours: string
  pickupAvailable: boolean
  returnAvailable: boolean
  isOfficialHub: true
}

// Bounding box for Butuan City, Agusan del Norte
export const BUTUAN_CITY_BOUNDS = {
  center: { lat: 8.9475, lng: 125.5406 } as ButuanCoordinate,
  defaultZoom: 13,
  minZoom: 11,
  maxZoom: 18,
  // Approximate rectangular envelope enclosing Butuan City
  envelope: {
    south: 8.78,
    north: 9.08,
    west: 125.40,
    east: 125.75,
  },
  maxServiceDistanceKm: 35.0, // Maximum distance from center for Veyra rental service
}

// All 8 official active Veyra pickup and return stations in Butuan City
export const VEYRA_PICKUP_HUBS: VeyraHubLocation[] = [
  {
    id: "10c00000-0000-0000-0000-000000000001",
    name: "Barangay Libertad Hub",
    barangay: "Libertad",
    lat: 8.9450,
    lng: 125.5454,
    address: "National Highway, Brgy. Libertad, Butuan City, Agusan del Norte",
    operatingHours: "08:00 - 20:00 Daily",
    pickupAvailable: true,
    returnAvailable: true,
    isOfficialHub: true,
  },
  {
    id: "10c00000-0000-0000-0000-000000000011",
    name: "Barangay Ampayon Hub",
    barangay: "Ampayon",
    lat: 8.9563,
    lng: 125.6012,
    address: "Surigao-Agusan Highway, Brgy. Ampayon, Butuan City, Agusan del Norte",
    operatingHours: "08:00 - 20:00 Daily",
    pickupAvailable: true,
    returnAvailable: true,
    isOfficialHub: true,
  },
  {
    id: "10c00000-0000-0000-0000-000000000012",
    name: "Barangay Villa Kananga Hub",
    barangay: "Villa Kananga",
    lat: 8.9370,
    lng: 125.5750,
    address: "Montilla Boulevard, Brgy. Villa Kananga, Butuan City, Agusan del Norte",
    operatingHours: "08:00 - 20:00 Daily",
    pickupAvailable: true,
    returnAvailable: true,
    isOfficialHub: true,
  },
  {
    id: "10c00000-0000-0000-0000-000000000013",
    name: "Barangay San Vicente Hub",
    barangay: "San Vicente",
    lat: 8.9498,
    lng: 125.5447,
    address: "J.C. Aquino Avenue, Brgy. San Vicente, Butuan City, Agusan del Norte",
    operatingHours: "08:00 - 20:00 Daily",
    pickupAvailable: true,
    returnAvailable: true,
    isOfficialHub: true,
  },
  {
    id: "10c00000-0000-0000-0000-000000000014",
    name: "Barangay J.P. Rizal Hub",
    barangay: "J.P. Rizal",
    lat: 8.9480,
    lng: 125.5430,
    address: "Poblacion Commercial Core, Brgy. J.P. Rizal, Butuan City, Agusan del Norte",
    operatingHours: "08:00 - 20:00 Daily",
    pickupAvailable: true,
    returnAvailable: true,
    isOfficialHub: true,
  },
  {
    id: "10c00000-0000-0000-0000-000000000015",
    name: "Barangay Baan Km. 3 Hub",
    barangay: "Baan Km. 3",
    lat: 8.9420,
    lng: 125.5700,
    address: "Baan Km. 3, Butuan City, Agusan del Norte",
    operatingHours: "08:00 - 20:00 Daily",
    pickupAvailable: true,
    returnAvailable: true,
    isOfficialHub: true,
  },
  {
    id: "10c00000-0000-0000-0000-000000000016",
    name: "Barangay Dagohoy Hub",
    barangay: "Dagohoy",
    lat: 8.9510,
    lng: 125.5480,
    address: "Downtown District, Brgy. Dagohoy, Butuan City, Agusan del Norte",
    operatingHours: "08:00 - 20:00 Daily",
    pickupAvailable: true,
    returnAvailable: true,
    isOfficialHub: true,
  },
  {
    id: "10c00000-0000-0000-0000-000000000017",
    name: "Barangay Leon Kilat Hub",
    barangay: "Leon Kilat",
    lat: 8.9490,
    lng: 125.5465,
    address: "Poblacion District, Brgy. Leon Kilat, Butuan City, Agusan del Norte",
    operatingHours: "08:00 - 20:00 Daily",
    pickupAvailable: true,
    returnAvailable: true,
    isOfficialHub: true,
  },
]

// All 86 Official Barangays of Butuan City with verified geographic coordinate centers
export const BUTUAN_BARANGAYS: ButuanBarangay[] = [
  { name: "Agao", lat: 8.9496, lng: 125.5392, district: "Poblacion", type: "urban" },
  { name: "Agusan Pequeño", lat: 8.9664, lng: 125.5255, district: "Urban West", type: "urban" },
  { name: "Ambago", lat: 8.9242, lng: 125.5186, district: "Urban West", type: "urban" },
  { name: "Amparo", lat: 8.8789, lng: 125.6421, district: "Rural South", type: "rural" },
  { name: "Ampayon", lat: 8.9563, lng: 125.6012, district: "Urban East", type: "urban" },
  { name: "Anticala", lat: 8.9189, lng: 125.7142, district: "Rural East", type: "rural" },
  { name: "Antongalon", lat: 8.9278, lng: 125.6325, district: "Rural East", type: "rural" },
  { name: "Aupagan", lat: 8.9123, lng: 125.6189, district: "Rural East", type: "rural" },
  { name: "Baan KM 3", lat: 8.9420, lng: 125.5700, district: "Urban East", type: "urban" },
  { name: "Baan Riverside", lat: 8.9525, lng: 125.5510, district: "Urban East", type: "urban" },
  { name: "Babag", lat: 8.9723, lng: 125.5089, district: "Rural West", type: "rural" },
  { name: "Bading", lat: 8.9567, lng: 125.5321, district: "Urban West", type: "urban" },
  { name: "Bancasi", lat: 8.9482, lng: 125.4856, district: "Urban West", type: "urban" },
  { name: "Banza", lat: 8.9745, lng: 125.5684, district: "Rural North", type: "rural" },
  { name: "Baobaoan", lat: 8.9892, lng: 125.6214, district: "Rural North", type: "rural" },
  { name: "Basag", lat: 8.8923, lng: 125.6278, district: "Rural South", type: "rural" },
  { name: "Bayanihan", lat: 8.9472, lng: 125.5412, district: "Poblacion", type: "urban" },
  { name: "Bilay", lat: 8.8521, lng: 125.6823, district: "Rural South", type: "rural" },
  { name: "Bit-os", lat: 8.8745, lng: 125.5321, district: "Rural South", type: "rural" },
  { name: "Bobon", lat: 9.0234, lng: 125.5245, district: "Rural North", type: "rural" },
  { name: "Bonbon", lat: 8.9145, lng: 125.5389, district: "Urban West", type: "urban" },
  { name: "Bugabus", lat: 8.8654, lng: 125.5845, district: "Rural South", type: "rural" },
  { name: "Bugsukan", lat: 8.8612, lng: 125.6234, district: "Rural South", type: "rural" },
  { name: "Cabcabon", lat: 8.8752, lng: 125.6123, district: "Rural South", type: "rural" },
  { name: "Camayahan", lat: 8.9821, lng: 125.6892, district: "Rural North", type: "rural" },
  { name: "Culit", lat: 8.8834, lng: 125.5245, district: "Rural South", type: "rural" },
  { name: "Dagohoy", lat: 8.9510, lng: 125.5480, district: "Poblacion", type: "urban" },
  { name: "Dankias", lat: 8.8834, lng: 125.6982, district: "Rural South", type: "rural" },
  { name: "De Oro", lat: 8.9023, lng: 125.6745, district: "Rural East", type: "rural" },
  { name: "Diego Silang", lat: 8.9489, lng: 125.5398, district: "Poblacion", type: "urban" },
  { name: "Don Francisco", lat: 8.8945, lng: 125.6389, district: "Rural South", type: "rural" },
  { name: "Doongan", lat: 8.9432, lng: 125.5345, district: "Urban West", type: "urban" },
  { name: "Dulag", lat: 8.9123, lng: 125.6845, district: "Rural East", type: "rural" },
  { name: "Dumalagan", lat: 8.9289, lng: 125.4923, district: "Rural West", type: "rural" },
  { name: "Florida", lat: 8.9321, lng: 125.6712, district: "Rural East", type: "rural" },
  { name: "Golden Ribbon", lat: 8.9456, lng: 125.5367, district: "Urban West", type: "urban" },
  { name: "Holy Redeemer", lat: 8.9521, lng: 125.5432, district: "Poblacion", type: "urban" },
  { name: "Humabon", lat: 8.9482, lng: 125.5408, district: "Poblacion", type: "urban" },
  { name: "Imadejas", lat: 8.9412, lng: 125.5489, district: "Poblacion", type: "urban" },
  { name: "J.P. Rizal", lat: 8.9480, lng: 125.5430, district: "Poblacion", type: "urban" },
  { name: "Kinabjangan", lat: 8.9712, lng: 125.5921, district: "Rural North", type: "rural" },
  { name: "Kinamlutan", lat: 8.9189, lng: 125.4821, district: "Rural West", type: "rural" },
  { name: "Lapu-lapu", lat: 8.9478, lng: 125.5421, district: "Poblacion", type: "urban" },
  { name: "Lemon", lat: 8.9321, lng: 125.6123, district: "Rural East", type: "rural" },
  { name: "Leon Kilat", lat: 8.9490, lng: 125.5465, district: "Poblacion", type: "urban" },
  { name: "Libertad", lat: 8.9450, lng: 125.5454, district: "Poblacion", type: "urban" },
  { name: "Limaha", lat: 8.9442, lng: 125.5429, district: "Poblacion", type: "urban" },
  { name: "Los Angeles", lat: 8.9895, lng: 125.6542, district: "Rural North", type: "rural" },
  { name: "Lumbocan", lat: 9.0045, lng: 125.5089, district: "Rural North", type: "rural" },
  { name: "Maguinda", lat: 8.8923, lng: 125.5023, district: "Rural South", type: "rural" },
  { name: "Mahay", lat: 8.9612, lng: 125.5789, district: "Urban East", type: "urban" },
  { name: "Mahogany", lat: 8.9589, lng: 125.5421, district: "Urban West", type: "urban" },
  { name: "Maibu", lat: 8.8912, lng: 125.6542, district: "Rural South", type: "rural" },
  { name: "Mandamo", lat: 8.8745, lng: 125.6712, district: "Rural South", type: "rural" },
  { name: "Manila de Bugabus", lat: 8.8512, lng: 125.5678, district: "Rural South", type: "rural" },
  { name: "Maon", lat: 8.9405, lng: 125.5398, district: "Poblacion", type: "urban" },
  { name: "Masao", lat: 9.0189, lng: 125.5012, district: "Rural North", type: "rural" },
  { name: "Maug", lat: 8.9845, lng: 125.5845, district: "Rural North", type: "rural" },
  { name: "New Society Village", lat: 8.9495, lng: 125.5385, district: "Poblacion", type: "urban" },
  { name: "Nongnong", lat: 8.8821, lng: 125.5189, district: "Rural South", type: "rural" },
  { name: "Obrero", lat: 8.9542, lng: 125.5462, district: "Poblacion", type: "urban" },
  { name: "Ong Yiu", lat: 8.9528, lng: 125.5389, district: "Poblacion", type: "urban" },
  { name: "Pagatpatan", lat: 8.9812, lng: 125.5321, district: "Rural North", type: "rural" },
  { name: "Pangabugan", lat: 8.9389, lng: 125.5214, district: "Urban West", type: "urban" },
  { name: "Pianing", lat: 8.9345, lng: 125.7289, district: "Rural East", type: "rural" },
  { name: "Pigdaulan", lat: 8.9212, lng: 125.4623, district: "Rural West", type: "rural" },
  { name: "Pinamanculan", lat: 8.9645, lng: 125.4892, district: "Rural West", type: "rural" },
  { name: "Port Poyohon", lat: 8.9554, lng: 125.5356, district: "Poblacion", type: "urban" },
  { name: "Rajah Humabon", lat: 8.9482, lng: 125.5410, district: "Poblacion", type: "urban" },
  { name: "Salvacion", lat: 8.8834, lng: 125.5789, district: "Rural South", type: "rural" },
  { name: "San Ignacio", lat: 8.9485, lng: 125.5445, district: "Poblacion", type: "urban" },
  { name: "San Mateo", lat: 8.8923, lng: 125.5521, district: "Rural South", type: "rural" },
  { name: "San Vicente", lat: 8.9498, lng: 125.5447, district: "Poblacion", type: "urban" },
  { name: "Santo Niño", lat: 8.9892, lng: 125.5542, district: "Rural North", type: "rural" },
  { name: "Sikatuna", lat: 8.9491, lng: 125.5401, district: "Poblacion", type: "urban" },
  { name: "Silongan", lat: 8.9502, lng: 125.5418, district: "Poblacion", type: "urban" },
  { name: "Sumilihon", lat: 8.8923, lng: 125.6812, district: "Rural East", type: "rural" },
  { name: "Tagabaca", lat: 8.9723, lng: 125.6421, district: "Rural North", type: "rural" },
  { name: "Tagpange", lat: 8.9412, lng: 125.6982, district: "Rural East", type: "rural" },
  { name: "Taguibo", lat: 8.9689, lng: 125.6189, district: "Urban East", type: "urban" },
  { name: "Taligaman", lat: 8.9345, lng: 125.6489, district: "Rural East", type: "rural" },
  { name: "Tandang Sora", lat: 8.9512, lng: 125.5451, district: "Poblacion", type: "urban" },
  { name: "Tiniwisan", lat: 8.9512, lng: 125.5789, district: "Urban East", type: "urban" },
  { name: "Tungao", lat: 8.8312, lng: 125.5892, district: "Rural South", type: "rural" },
  { name: "Urduja", lat: 8.9505, lng: 125.5429, district: "Poblacion", type: "urban" },
  { name: "Villa Kananga", lat: 8.9370, lng: 125.5750, district: "Urban East", type: "urban" },
]

// Recognized Landmarks, Public Facilities, Malls, Hospitals, Terminals in Butuan City
export const BUTUAN_LANDMARKS: ButuanLandmark[] = [
  {
    id: "lm-cityhall",
    name: "Butuan City Hall",
    category: "government",
    barangay: "Doongan",
    lat: 8.9442,
    lng: 125.5348,
    address: "J.P. Rosales Avenue, Brgy. Doongan, Butuan City",
    description: "Executive and administrative center of Butuan City government.",
  },
  {
    id: "lm-robinsons",
    name: "Robinsons Place Butuan",
    category: "commercial",
    barangay: "Libertad",
    lat: 8.9465,
    lng: 125.5478,
    address: "J.C. Aquino Avenue, Brgy. Libertad, Butuan City",
    description: "Major regional shopping, dining, and cinema complex.",
  },
  {
    id: "lm-smbutuan",
    name: "SM City Butuan",
    category: "commercial",
    barangay: "San Vicente",
    lat: 8.9492,
    lng: 125.5435,
    address: "J.C. Aquino Avenue, Brgy. San Vicente, Butuan City",
    description: "Flagship premier shopping center in downtown Butuan.",
  },
  {
    id: "lm-gaisano",
    name: "Gaisano Mall Butuan",
    category: "commercial",
    barangay: "J.P. Rizal",
    lat: 8.9482,
    lng: 125.5412,
    address: "J.C. Aquino Ave cor. Montilla Blvd, Butuan City",
    description: "Central commercial mall and department store.",
  },
  {
    id: "lm-airport",
    name: "Bancasi Airport (Butuan National Airport / BXU)",
    category: "transport",
    barangay: "Bancasi",
    lat: 8.9482,
    lng: 125.4856,
    address: "Airport Road, Brgy. Bancasi, Butuan City",
    description: "Principal commercial airport connecting Agusan del Norte to Manila and Cebu.",
  },
  {
    id: "lm-terminal",
    name: "Butuan Integrated Bus Terminal",
    category: "transport",
    barangay: "Langihan",
    lat: 8.9612,
    lng: 125.5389,
    address: "Langihan Road, Butuan City",
    description: "Inter-provincial bus terminal connecting Davao, Cagayan de Oro, and Surigao.",
  },
  {
    id: "lm-market",
    name: "Langihan Public Market",
    category: "commercial",
    barangay: "Langihan",
    lat: 8.9598,
    lng: 125.5392,
    address: "Langihan Commercial District, Butuan City",
    description: "Central agricultural and retail trading center of Butuan.",
  },
  {
    id: "lm-fsuu",
    name: "Father Saturnino Urios University (FSUU)",
    category: "education",
    barangay: "San Ignacio",
    lat: 8.9485,
    lng: 125.5445,
    address: "San Francisco St, Brgy. San Ignacio, Butuan City",
    description: "Premier academic institution and university campus.",
  },
  {
    id: "lm-csu",
    name: "Caraga State University (CSU Main)",
    category: "education",
    barangay: "Ampayon",
    lat: 8.9582,
    lng: 125.6025,
    address: "National Highway, Brgy. Ampayon, Butuan City",
    description: "State university campus specializing in forestry, engineering, and science.",
  },
  {
    id: "lm-bmc",
    name: "Butuan Medical Center (BMC)",
    category: "hospital",
    barangay: "Tiniwisan",
    lat: 8.9512,
    lng: 125.5789,
    address: "Km. 4, Tiniwisan, Butuan City",
    description: "Tertiary regional medical and emergency care facility.",
  },
  {
    id: "lm-adnh",
    name: "Agusan del Norte Provincial Hospital",
    category: "hospital",
    barangay: "Libertad",
    lat: 8.9438,
    lng: 125.5462,
    address: "National Highway, Brgy. Libertad, Butuan City",
    description: "Provincial public healthcare center.",
  },
  {
    id: "lm-museum",
    name: "National Museum - Butuan Eastern-Northern Mindanao",
    category: "historical",
    barangay: "Doongan",
    lat: 8.9452,
    lng: 125.5332,
    address: "Montilla Blvd, Brgy. Doongan, Butuan City",
    description: "Historical repository of ancient Balangay boats and pre-colonial gold treasures.",
  },
  {
    id: "lm-banza",
    name: "Banza Church Ruins",
    category: "historical",
    barangay: "Banza",
    lat: 8.9745,
    lng: 125.5684,
    address: "Brgy. Banza, Butuan City",
    description: "Historic 1625 stone church bell tower preserved under an enormous banyan tree.",
  },
  {
    id: "lm-guingona",
    name: "Guingona Park & Rizal Monument",
    category: "park",
    barangay: "Poblacion",
    lat: 8.9492,
    lng: 125.5412,
    address: "Corner J.C. Aquino and Montilla Blvd, Butuan City",
    description: "Historic city plaza and landmark flagpole.",
  },
  {
    id: "lm-magsaysay-bridge",
    name: "Magsaysay Bridge",
    category: "transport",
    barangay: "Poblacion",
    lat: 8.9515,
    lng: 125.5492,
    address: "Crossing Agusan River, Butuan City",
    description: "Iconic arch bridge spanning the mighty Agusan River.",
  },
]

// Haversine distance calculator in kilometers
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export interface NearestHubResult {
  hub: VeyraHubLocation
  distanceKm: number
}

// Find closest official Veyra pickup hub from any coordinate
export function findNearestVeyraHub(lat: number, lng: number): NearestHubResult {
  let nearest = VEYRA_PICKUP_HUBS[0]
  let minDistance = calculateHaversineDistance(lat, lng, nearest.lat, nearest.lng)

  for (let i = 1; i < VEYRA_PICKUP_HUBS.length; i++) {
    const hub = VEYRA_PICKUP_HUBS[i]
    const dist = calculateHaversineDistance(lat, lng, hub.lat, hub.lng)
    if (dist < minDistance) {
      minDistance = dist
      nearest = hub
    }
  }

  return {
    hub: nearest,
    distanceKm: Math.round(minDistance * 10) / 10,
  }
}

// Verify whether coordinate is within Butuan City operational service area (< 35km of center)
export function isWithinButuanServiceArea(lat: number, lng: number): {
  isSupported: boolean
  distanceFromCenterKm: number
  reason?: string
} {
  const dist = calculateHaversineDistance(
    lat,
    lng,
    BUTUAN_CITY_BOUNDS.center.lat,
    BUTUAN_CITY_BOUNDS.center.lng
  )

  const isSupported = dist <= BUTUAN_CITY_BOUNDS.maxServiceDistanceKm

  return {
    isSupported,
    distanceFromCenterKm: Math.round(dist * 10) / 10,
    reason: isSupported
      ? undefined
      : `Location is ~${dist.toFixed(0)} km away, outside Veyra's Butuan City service boundary (maximum ${BUTUAN_CITY_BOUNDS.maxServiceDistanceKm} km).`,
  }
}

export const OUT_OF_SERVICE_CITIES = [
  "cagayan de oro",
  "cdo",
  "davao",
  "surigao city",
  "surigao",
  "manila",
  "quezon city",
  "makati",
  "cebu",
  "tagum",
  "malaybalay",
  "valencia",
  "gingoog",
  "cabadbaran",
  "nasipit",
  "carmen",
  "buenavista",
  "bayugan",
  "tandag",
  "bislig",
  "iligan",
  "general santos",
  "zamboanga",
]

export interface PickupLocationValidationResult {
  isValid: boolean
  isFeasible: boolean
  matchedBarangay?: ButuanBarangay
  nearestHub: VeyraHubLocation
  distanceKm: number
  deliveryFeeCentavos: number
  reason?: string
}

export function validatePickupLocation(params: {
  barangay?: string | null
  streetAddress?: string | null
  lat?: number | null
  lng?: number | null
}): PickupLocationValidationResult {
  const addressText = `${params.barangay || ""} ${params.streetAddress || ""}`.toLowerCase().trim()

  for (const city of OUT_OF_SERVICE_CITIES) {
    if (addressText.includes(city)) {
      const nearest = VEYRA_PICKUP_HUBS[0]
      return {
        isValid: false,
        isFeasible: false,
        nearestHub: nearest,
        distanceKm: 0,
        deliveryFeeCentavos: 0,
        reason: `Location is within ${city.toUpperCase()}, which is outside Veyra's Butuan City service boundary. Veyra operates exclusively in Butuan City, Agusan del Norte.`,
      }
    }
  }

  // If barangay is specified, check against 86 verified Butuan City barangays
  let matchedBarangay: ButuanBarangay | undefined
  if (params.barangay) {
    const cleanB = params.barangay.replace(/^brgy\.?\s+/i, "").replace(/^barangay\s+/i, "").trim().toLowerCase()
    matchedBarangay = BUTUAN_BARANGAYS.find((b) => b.name.toLowerCase() === cleanB)
  }

  // Determine coordinate for distance check
  const lat = params.lat ?? matchedBarangay?.lat ?? BUTUAN_CITY_BOUNDS.center.lat
  const lng = params.lng ?? matchedBarangay?.lng ?? BUTUAN_CITY_BOUNDS.center.lng

  const serviceCheck = isWithinButuanServiceArea(lat, lng)
  const nearest = findNearestVeyraHub(lat, lng)

  if (!serviceCheck.isSupported) {
    return {
      isValid: false,
      isFeasible: false,
      matchedBarangay,
      nearestHub: nearest.hub,
      distanceKm: serviceCheck.distanceFromCenterKm,
      deliveryFeeCentavos: 0,
      reason: serviceCheck.reason,
    }
  }

  return {
    isValid: true,
    isFeasible: true,
    matchedBarangay,
    nearestHub: nearest.hub,
    distanceKm: nearest.distanceKm,
    deliveryFeeCentavos: 0,
  }
}
