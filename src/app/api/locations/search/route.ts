import { NextRequest, NextResponse } from "next/server"
import {
  BUTUAN_BARANGAYS,
  BUTUAN_LANDMARKS,
  VEYRA_PICKUP_HUBS,
  findNearestVeyraHub,
  isWithinButuanServiceArea,
} from "@/features/locations/data/butuan-city-data"

export interface SearchLocationResult {
  id: string
  name: string
  displayName: string
  type: "hub" | "landmark" | "barangay" | "osm_place"
  barangay?: string
  lat: number
  lng: number
  isInsideServiceArea: boolean
  nearestHubName: string
  nearestHubDistanceKm: number
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get("q") || "").trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const queryLower = query.toLowerCase()
  const results: SearchLocationResult[] = []

  // 1. Match official Veyra Hubs
  for (const hub of VEYRA_PICKUP_HUBS) {
    if (
      hub.name.toLowerCase().includes(queryLower) ||
      hub.barangay.toLowerCase().includes(queryLower) ||
      hub.address.toLowerCase().includes(queryLower)
    ) {
      results.push({
        id: `hub-${hub.id}`,
        name: hub.name,
        displayName: `${hub.name} (Official Veyra Hub, Brgy. ${hub.barangay})`,
        type: "hub",
        barangay: hub.barangay,
        lat: hub.lat,
        lng: hub.lng,
        isInsideServiceArea: true,
        nearestHubName: hub.name,
        nearestHubDistanceKm: 0,
      })
    }
  }

  // 2. Match verified Butuan City Landmarks
  for (const lm of BUTUAN_LANDMARKS) {
    if (
      lm.name.toLowerCase().includes(queryLower) ||
      lm.barangay.toLowerCase().includes(queryLower) ||
      lm.address.toLowerCase().includes(queryLower) ||
      lm.category.toLowerCase().includes(queryLower)
    ) {
      const nearest = findNearestVeyraHub(lm.lat, lm.lng)
      results.push({
        id: lm.id,
        name: lm.name,
        displayName: `${lm.name}, ${lm.address}`,
        type: "landmark",
        barangay: lm.barangay,
        lat: lm.lat,
        lng: lm.lng,
        isInsideServiceArea: true,
        nearestHubName: nearest.hub.name,
        nearestHubDistanceKm: nearest.distanceKm,
      })
    }
  }

  // 3. Match verified Butuan City Barangays
  for (const bg of BUTUAN_BARANGAYS) {
    if (
      bg.name.toLowerCase().includes(queryLower) ||
      `barangay ${bg.name.toLowerCase()}`.includes(queryLower) ||
      `brgy ${bg.name.toLowerCase()}`.includes(queryLower)
    ) {
      const nearest = findNearestVeyraHub(bg.lat, bg.lng)
      const serviceCheck = isWithinButuanServiceArea(bg.lat, bg.lng)
      results.push({
        id: `brgy-${bg.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: `Barangay ${bg.name}`,
        displayName: `Barangay ${bg.name}, Butuan City (${bg.district})`,
        type: "barangay",
        barangay: bg.name,
        lat: bg.lat,
        lng: bg.lng,
        isInsideServiceArea: serviceCheck.isSupported,
        nearestHubName: nearest.hub.name,
        nearestHubDistanceKm: nearest.distanceKm,
      })
    }
  }

  // 4. Query OpenStreetMap Nominatim for street-level or additional place queries
  // Limit to bounded Butuan City box to prevent irrelevant worldwide matches
  try {
    const osmUrl = new URL("https://nominatim.openstreetmap.org/search")
    osmUrl.searchParams.set("q", `${query}, Butuan City, Philippines`)
    osmUrl.searchParams.set("format", "json")
    osmUrl.searchParams.set("addressdetails", "1")
    osmUrl.searchParams.set("limit", "5")
    // Bounded envelope for Butuan City: [min_lon, min_lat, max_lon, max_lat] -> [125.40, 8.78, 125.75, 9.08]
    osmUrl.searchParams.set("viewbox", "125.40,9.08,125.75,8.78")
    osmUrl.searchParams.set("bounded", "0") // prioritize within viewbox
    osmUrl.searchParams.set("countrycodes", "ph")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)

    const response = await fetch(osmUrl.toString(), {
      headers: {
        "User-Agent": "VeyraCarRental/1.0 (+https://veyra.rentals; support@veyra.rentals)",
        Accept: "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.ok) {
      const osmData = (await response.json()) as Array<{
        place_id: number
        display_name: string
        lat: string
        lon: string
        name?: string
        address?: {
          suburb?: string
          quarter?: string
          neighbourhood?: string
          road?: string
          city?: string
          state?: string
        }
      }>

      for (const item of osmData) {
        const lat = parseFloat(item.lat)
        const lng = parseFloat(item.lon)
        if (isNaN(lat) || isNaN(lng)) continue

        const serviceCheck = isWithinButuanServiceArea(lat, lng)
        const nearest = findNearestVeyraHub(lat, lng)

        // Avoid exact coordinate duplicate
        const isDuplicate = results.some(
          (r) => Math.abs(r.lat - lat) < 0.001 && Math.abs(r.lng - lng) < 0.001
        )

        if (!isDuplicate) {
          const resolvedBarangay =
            item.address?.suburb ||
            item.address?.quarter ||
            item.address?.neighbourhood ||
            undefined

          results.push({
            id: `osm-${item.place_id}`,
            name: item.name || item.display_name.split(",")[0],
            displayName: item.display_name,
            type: "osm_place",
            barangay: resolvedBarangay,
            lat,
            lng,
            isInsideServiceArea: serviceCheck.isSupported,
            nearestHubName: nearest.hub.name,
            nearestHubDistanceKm: nearest.distanceKm,
          })
        }
      }
    }
  } catch {
    // Graceful degradation if Nominatim is unreachable, times out, or offline
  }

  // Deduplicate and cap results
  const uniqueResults = results.slice(0, 15)

  return NextResponse.json({
    query,
    count: uniqueResults.length,
    results: uniqueResults,
  })
}
