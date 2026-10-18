import { NextRequest, NextResponse } from "next/server"
import {
  BUTUAN_BARANGAYS,
  BUTUAN_LANDMARKS,
  calculateHaversineDistance,
  findNearestVeyraHub,
  isWithinButuanServiceArea,
} from "@/features/locations/data/butuan-city-data"

export interface ReverseLocationResponse {
  lat: number
  lng: number
  address: string
  barangay: string
  landmark?: string
  isInsideServiceArea: boolean
  nearestHub: {
    id: string
    name: string
    barangay: string
    distanceKm: number
  }
  warningMessage?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const latStr = searchParams.get("lat")
  const lngStr = searchParams.get("lng")

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { error: "Coordinates 'lat' and 'lng' parameters are required." },
      { status: 400 }
    )
  }

  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Invalid coordinate values." },
      { status: 400 }
    )
  }

  // 1. Service area validation
  const serviceCheck = isWithinButuanServiceArea(lat, lng)
  const nearest = findNearestVeyraHub(lat, lng)

  // 2. Find nearest known Butuan barangay as authoritative baseline
  let closestBarangay = BUTUAN_BARANGAYS[0]
  let minBarangayDist = calculateHaversineDistance(
    lat,
    lng,
    closestBarangay.lat,
    closestBarangay.lng
  )

  for (let i = 1; i < BUTUAN_BARANGAYS.length; i++) {
    const b = BUTUAN_BARANGAYS[i]
    const d = calculateHaversineDistance(lat, lng, b.lat, b.lng)
    if (d < minBarangayDist) {
      minBarangayDist = d
      closestBarangay = b
    }
  }

  // 3. Find closest known landmark within 2km
  let nearestLandmark: string | undefined = undefined
  let minLandmarkDist = 2.0
  for (const lm of BUTUAN_LANDMARKS) {
    const d = calculateHaversineDistance(lat, lng, lm.lat, lm.lng)
    if (d < minLandmarkDist) {
      minLandmarkDist = d
      nearestLandmark = lm.name
    }
  }

  let resolvedAddress = `Barangay ${closestBarangay.name}, Butuan City, Agusan del Norte`
  let resolvedBarangay = closestBarangay.name

  // 4. Attempt real reverse geocoding using OpenStreetMap Nominatim
  try {
    const osmRevUrl = new URL("https://nominatim.openstreetmap.org/reverse")
    osmRevUrl.searchParams.set("format", "json")
    osmRevUrl.searchParams.set("lat", lat.toString())
    osmRevUrl.searchParams.set("lon", lng.toString())
    osmRevUrl.searchParams.set("zoom", "18")
    osmRevUrl.searchParams.set("addressdetails", "1")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const res = await fetch(osmRevUrl.toString(), {
      headers: {
        "User-Agent": "VeyraCarRental/1.0 (+https://veyra.rentals; support@veyra.rentals)",
        Accept: "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (res.ok) {
      const data = (await res.json()) as {
        display_name?: string
        address?: {
          road?: string
          suburb?: string
          quarter?: string
          neighbourhood?: string
          city?: string
          county?: string
          state?: string
        }
      }

      if (data.display_name) {
        resolvedAddress = data.display_name
      }

      // Check if suburb or neighbourhood matches a barangay
      const osmBarangay =
        data.address?.suburb ||
        data.address?.quarter ||
        data.address?.neighbourhood

      if (osmBarangay) {
        // Look for matching Butuan barangay name
        const match = BUTUAN_BARANGAYS.find(
          (b) =>
            b.name.toLowerCase() === osmBarangay.toLowerCase() ||
            osmBarangay.toLowerCase().includes(b.name.toLowerCase())
        )
        if (match) {
          resolvedBarangay = match.name
        }
      }
    }
  } catch {
    // Graceful fallback to resolved nearest barangay and baseline
  }

  const payload: ReverseLocationResponse = {
    lat,
    lng,
    address: resolvedAddress,
    barangay: resolvedBarangay,
    landmark: nearestLandmark,
    isInsideServiceArea: serviceCheck.isSupported,
    nearestHub: {
      id: nearest.hub.id,
      name: nearest.hub.name,
      barangay: nearest.hub.barangay,
      distanceKm: nearest.distanceKm,
    },
    warningMessage: serviceCheck.isSupported ? undefined : serviceCheck.reason,
  }

  return NextResponse.json(payload)
}
