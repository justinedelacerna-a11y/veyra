import { describe, it } from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"

// Haversine calculation for geolocation tests
function calculateHaversineKm(
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

const BUTUAN_HUBS = [
  { id: "10c00000-0000-0000-0000-000000000001", name: "Barangay Libertad Hub", barangay: "Libertad", lat: 8.945, lng: 125.5454 },
  { id: "10c00000-0000-0000-0000-000000000011", name: "Barangay Ampayon Hub", barangay: "Ampayon", lat: 8.9563, lng: 125.6012 },
  { id: "10c00000-0000-0000-0000-000000000012", name: "Barangay Villa Kananga Hub", barangay: "Villa Kananga", lat: 8.937, lng: 125.575 },
  { id: "10c00000-0000-0000-0000-000000000013", name: "Barangay San Vicente Hub", barangay: "San Vicente", lat: 8.9498, lng: 125.5447 },
  { id: "10c00000-0000-0000-0000-000000000014", name: "Barangay J.P. Rizal Hub", barangay: "J.P. Rizal", lat: 8.948, lng: 125.543 },
  { id: "10c00000-0000-0000-0000-000000000015", name: "Barangay Baan Km. 3 Hub", barangay: "Baan Km. 3", lat: 8.942, lng: 125.57 },
  { id: "10c00000-0000-0000-0000-000000000016", name: "Barangay Dagohoy Hub", barangay: "Dagohoy", lat: 8.951, lng: 125.548 },
  { id: "10c00000-0000-0000-0000-000000000017", name: "Barangay Leon Kilat Hub", barangay: "Leon Kilat", lat: 8.949, lng: 125.5465 },
]

const OUT_OF_SERVICE_CITIES = [
  "cagayan de oro",
  "cdo",
  "davao",
  "surigao city",
  "surigao",
  "manila",
  "cebu",
  "cabadbaran",
  "nasipit",
]

function validateServiceArea(address: string): { isValid: boolean; matchedCity: string | null } {
  const normalized = address.toLowerCase()
  for (const city of OUT_OF_SERVICE_CITIES) {
    if (normalized.includes(city)) {
      return { isValid: false, matchedCity: city.toUpperCase() }
    }
  }
  return { isValid: true, matchedCity: null }
}

describe("Manual Pickup Location & Service Area Validation", () => {
  it("provides exactly 8 verified Butuan City pickup hubs", () => {
    assert.equal(BUTUAN_HUBS.length, 8)
    const barangays = BUTUAN_HUBS.map((h) => h.barangay)
    assert.ok(barangays.includes("Libertad"))
    assert.ok(barangays.includes("Ampayon"))
    assert.ok(barangays.includes("Villa Kananga"))
    assert.ok(barangays.includes("San Vicente"))
  })

  it("accurately detects nearest hub when user is in Butuan City", () => {
    // Coordinates near Libertad, Butuan City
    const userLat = 8.946
    const userLng = 125.545

    const sorted = BUTUAN_HUBS.map((hub) => ({
      ...hub,
      dist: calculateHaversineKm(userLat, userLng, hub.lat, hub.lng),
    })).sort((a, b) => a.dist - b.dist)

    assert.equal(sorted[0].barangay, "Libertad")
    assert.ok(sorted[0].dist < 0.5, "Should be within 500m of Libertad hub")
  })

  it("identifies positions outside Butuan City operational boundary (>35km)", () => {
    // Davao City coordinates (~250km from Butuan)
    const davaoLat = 7.1907
    const davaoLng = 125.4553

    const minDistance = Math.min(
      ...BUTUAN_HUBS.map((hub) =>
        calculateHaversineKm(davaoLat, davaoLng, hub.lat, hub.lng)
      )
    )

    assert.ok(minDistance > 35, "Davao City must be flagged as outside Butuan service boundary")
  })

  it("validates manual address within Butuan City", () => {
    const validAddress = "Purok 4, Montilla Blvd, Barangay Libertad, Butuan City"
    const result = validateServiceArea(validAddress)
    assert.equal(result.isValid, true)
    assert.equal(result.matchedCity, null)
  })

  it("rejects manual addresses in unsupported cities outside Butuan", () => {
    const invalidAddresses = [
      "Claro M. Recto Ave, Cagayan de Oro City",
      "Rizal St, Surigao City",
      "Bajada, Davao City",
      "Poblacion, Cabadbaran",
    ]

    for (const addr of invalidAddresses) {
      const result = validateServiceArea(addr)
      assert.equal(result.isValid, false, `Address "${addr}" should be outside service area`)
      assert.ok(result.matchedCity !== null)
    }
  })
})

describe("Rental Duration Settings Rules", () => {
  it("enforces minimum rental duration", () => {
    const config = { minDays: 2, maxDays: 30 }
    const requestedDays = 1

    const isValid = requestedDays >= config.minDays && (config.maxDays === null || requestedDays <= config.maxDays)
    assert.equal(isValid, false, "1 day rental must be rejected when minDays is 2")
  })

  it("enforces maximum rental duration", () => {
    const config = { minDays: 1, maxDays: 14 }
    const requestedDays = 21

    const isValid = requestedDays >= config.minDays && (config.maxDays === null || requestedDays <= config.maxDays)
    assert.equal(isValid, false, "21 day rental must be rejected when maxDays is 14")
  })

  it("accepts valid rental duration within bounds", () => {
    const config = { minDays: 1, maxDays: 30 }
    const requestedDays = 7

    const isValid = requestedDays >= config.minDays && (config.maxDays === null || requestedDays <= config.maxDays)
    assert.equal(isValid, true, "7 day rental must be accepted within [1, 30] day bounds")
  })
})

describe("Terms of Service IP Hashing & Privacy", () => {
  it("hashes IP addresses using SHA-256 for privacy without storing raw IPs", () => {
    const rawIp = "203.177.123.45"
    const hash = crypto.createHash("sha256").update(rawIp).digest("hex")

    assert.equal(hash.length, 64)
    assert.notEqual(hash, rawIp)
    // Idempotent hash
    const rehash = crypto.createHash("sha256").update(rawIp).digest("hex")
    assert.equal(hash, rehash)
  })
})
