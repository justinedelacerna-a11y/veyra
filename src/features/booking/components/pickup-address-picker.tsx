"use client"

import * as React from "react"
import { useBooking } from "../context/booking-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  RiMapPinLine,
  RiNavigationLine,
  RiCompassDiscoverLine,
  RiCheckDoubleLine,
  RiAlertLine,
  RiInformationLine,
  RiPhoneLine,
  RiBuildingLine,
  RiRoadMapLine,
  RiCheckboxCircleLine,
  RiCompassLine,
} from "@remixicon/react"
import { ButuanMap } from "@/features/locations/components/butuan-map"
import type { SelectedLocationData } from "@/features/locations/components/butuan-map-view"
import {
  BUTUAN_BARANGAYS,
  findNearestVeyraHub,
  validatePickupLocation,
} from "@/features/locations/data/butuan-city-data"

interface HubCoordinate {
  id: string
  name: string
  barangay: string
  lat: number
  lng: number
  address: string
}

const BUTUAN_HUBS_COORDINATES: HubCoordinate[] = [
  {
    id: "10c00000-0000-0000-0000-000000000001",
    name: "Barangay Libertad Hub",
    barangay: "Libertad",
    lat: 8.945,
    lng: 125.5454,
    address: "National Highway, Brgy. Libertad, Butuan City, Agusan del Norte",
  },
  {
    id: "10c00000-0000-0000-0000-000000000011",
    name: "Barangay Ampayon Hub",
    barangay: "Ampayon",
    lat: 8.9563,
    lng: 125.6012,
    address: "Surigao-Agusan Highway, Brgy. Ampayon, Butuan City, Agusan del Norte",
  },
  {
    id: "10c00000-0000-0000-0000-000000000012",
    name: "Barangay Villa Kananga Hub",
    barangay: "Villa Kananga",
    lat: 8.937,
    lng: 125.575,
    address: "Montilla Boulevard, Brgy. Villa Kananga, Butuan City, Agusan del Norte",
  },
  {
    id: "10c00000-0000-0000-0000-000000000013",
    name: "Barangay San Vicente Hub",
    barangay: "San Vicente",
    lat: 8.9498,
    lng: 125.5447,
    address: "J.C. Aquino Avenue, Brgy. San Vicente, Butuan City, Agusan del Norte",
  },
  {
    id: "10c00000-0000-0000-0000-000000000014",
    name: "Barangay J.P. Rizal Hub",
    barangay: "J.P. Rizal",
    lat: 8.948,
    lng: 125.543,
    address: "Poblacion Commercial Core, Brgy. J.P. Rizal, Butuan City, Agusan del Norte",
  },
  {
    id: "10c00000-0000-0000-0000-000000000015",
    name: "Barangay Baan Km. 3 Hub",
    barangay: "Baan Km. 3",
    lat: 8.942,
    lng: 125.57,
    address: "Baan Km. 3, Butuan City, Agusan del Norte",
  },
  {
    id: "10c00000-0000-0000-0000-000000000016",
    name: "Barangay Dagohoy Hub",
    barangay: "Dagohoy",
    lat: 8.951,
    lng: 125.548,
    address: "Downtown District, Brgy. Dagohoy, Butuan City, Agusan del Norte",
  },
  {
    id: "10c00000-0000-0000-0000-000000000017",
    name: "Barangay Leon Kilat Hub",
    barangay: "Leon Kilat",
    lat: 8.949,
    lng: 125.5465,
    address: "Poblacion District, Brgy. Leon Kilat, Butuan City, Agusan del Norte",
  },
]


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

export function PickupAddressPicker() {
  const {
    draft,
    updateDraft,
    availableLocations,
    pickupHub,
    returnHub,
  } = useBooking()

  const [isDetectingLocation, setIsDetectingLocation] = React.useState(false)
  const [geoNotice, setGeoNotice] = React.useState<{
    type: "success" | "warning" | "error" | "info"
    message: string
  } | null>(null)

  const [customAddressMode, setCustomAddressMode] = React.useState(
    Boolean(draft.pickupStreetAddress || draft.pickupLandmark)
  )

  // Validate manual address against supported Butuan City service boundary
  const addressValidation = React.useMemo(() => {
    const res = validatePickupLocation({
      barangay: draft.pickupBarangay,
      streetAddress: draft.pickupStreetAddress,
    })
    return {
      isValid: res.isValid,
      outOfServiceMatch: res.reason || null,
    }
  }, [draft.pickupBarangay, draft.pickupStreetAddress])

  // Optional Geolocation detection (strictly convenience, never mandatory)
  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoNotice({
        type: "info",
        message:
          "Browser location detection is not supported on this device. Please select your pickup hub manually.",
      })
      return
    }

    setIsDetectingLocation(true)
    setGeoNotice(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingLocation(false)
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        // Calculate distances to all 8 Butuan hubs
        const hubDistances = BUTUAN_HUBS_COORDINATES.map((hub) => ({
          ...hub,
          distanceKm: calculateHaversineKm(userLat, userLng, hub.lat, hub.lng),
        })).sort((a, b) => a.distanceKm - b.distanceKm)

        const nearest = hubDistances[0]

        // Butuan City operational service perimeter is ~35km from center
        if (nearest.distanceKm <= 35) {
          updateDraft({ pickupLocationId: nearest.id })
          setGeoNotice({
            type: "success",
            message: `Nearest hub detected: ${nearest.name} (~${nearest.distanceKm.toFixed(1)} km from your device). Hub selected automatically.`,
          })
        } else {
          setGeoNotice({
            type: "warning",
            message: `Your detected position is ~${nearest.distanceKm.toFixed(0)} km away, outside Veyra's Butuan City service area. Veyra operates exclusively in Butuan City, Agusan del Norte. We have maintained your selection at ${pickupHub.name}.`,
          })
        }
      },
      (error) => {
        setIsDetectingLocation(false)
        let msg =
          "Location access was not provided. You can select your pickup barangay hub manually below."
        if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please select your pickup hub manually."
        }
        setGeoNotice({ type: "info", message: msg })
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }

  const [showInteractiveMap, setShowInteractiveMap] = React.useState(false)

  const handleMapLocationSelected = (loc: SelectedLocationData) => {
    if (!loc.isInsideServiceArea) {
      setGeoNotice({
        type: "warning",
        message: `Selected location (${loc.address}) is outside Veyra's Butuan City service boundary. Delivery and pickup can only be fulfilled within Butuan City.`,
      })
      return
    }

    updateDraft({
      pickupLocationId: loc.nearestHubId,
      pickupBarangay: loc.barangay,
      pickupStreetAddress: loc.address,
      pickupLandmark: loc.landmark || `Near ${loc.nearestHubName}`,
    })
    setCustomAddressMode(true)
    setGeoNotice({
      type: "success",
      message: `Pickup confirmed in Barangay ${loc.barangay} (~${loc.distanceToHubKm.toFixed(1)} km from ${loc.nearestHubName}). Additional Delivery Fee: ₱0 (Complimentary Valet Delivery).`,
    })
  }

  // Pre-fill contact number if empty and driver phone exists
  React.useEffect(() => {
    if (!draft.pickupContactPhone && draft.driver?.phone) {
      updateDraft({ pickupContactPhone: draft.driver.phone })
    }
  }, [draft.driver?.phone, draft.pickupContactPhone, updateDraft])

  return (
    <div className="space-y-4 pt-4 border-t border-border/60">
      {/* Header with Title and Optional Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <RiRoadMapLine className="size-3.5 text-primary" />
            <span>Butuan City Pickup Hub & Address</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Veyra operates exclusively across 8 verified barangay hubs in Butuan City, Agusan del Norte.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle Interactive Map Button */}
          <Button
            type="button"
            variant={showInteractiveMap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInteractiveMap(!showInteractiveMap)}
            className="h-8 text-xs gap-1.5 shrink-0 border-primary/30 transition-all"
            title="Explore Butuan City on full interactive map to drop a pin"
          >
            <RiCompassLine className="size-3.5" />
            <span>{showInteractiveMap ? "Hide City Map" : "Pin on Map"}</span>
          </Button>

          {/* Optional Browser Location Detection Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="h-8 text-xs gap-1.5 shrink-0 border-primary/30 hover:border-primary hover:bg-primary/5 text-foreground transition-all"
            title="Optional convenience: Detect closest Butuan City hub without needing permission"
          >
            <RiNavigationLine
              className={`size-3.5 text-primary ${isDetectingLocation ? "animate-spin" : ""}`}
            />
            <span>{isDetectingLocation ? "Locating..." : "Find Nearest Hub"}</span>
          </Button>
        </div>
      </div>

      {/* Interactive Map Section (when toggled on) */}
      {showInteractiveMap && (
        <div className="rounded-xl border border-border/80 overflow-hidden shadow-md animate-in fade-in duration-200 space-y-2 p-2 bg-card">
          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <RiMapPinLine className="size-3.5 text-amber-500" />
              <span>Click or search any point in Butuan City to drop a pickup pin</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              Official hubs, roads, landmarks & barangays
            </span>
          </div>
          <ButuanMap
            mode="picker"
            allowPinDrop={true}
            onSelectLocation={handleMapLocationSelected}
            className="h-[380px] sm:h-[450px]"
          />
        </div>
      )}

      {/* Geolocation Notice Banner */}
      {geoNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl p-3 text-xs flex items-start gap-2.5 border transition-all ${
            geoNotice.type === "success"
              ? "bg-primary/10 border-primary/30 text-foreground"
              : geoNotice.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
              : "bg-muted/50 border-border text-muted-foreground"
          }`}
        >
          {geoNotice.type === "success" ? (
            <RiCheckboxCircleLine className="size-4 text-primary shrink-0 mt-0.5" />
          ) : geoNotice.type === "warning" ? (
            <RiAlertLine className="size-4 text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <RiInformationLine className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-[11px] leading-relaxed">
            {geoNotice.message}
          </div>
          <button
            type="button"
            onClick={() => setGeoNotice(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Hub Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Pickup Barangay Hub or Any Butuan City Barangay */}
        <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2">
          <label
            htmlFor="booking-pickup-loc-select"
            className="text-xs font-semibold text-foreground flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <RiMapPinLine className="size-3.5 text-primary" />
              <span>Pickup Station / Barangay</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-primary">
              All 86 Barangays
            </span>
          </label>
          <select
            id="booking-pickup-loc-select"
            value={
              draft.pickupBarangay &&
              !availableLocations.some(
                (l) => l.barangay?.toLowerCase() === draft.pickupBarangay?.toLowerCase()
              )
                ? `brgy:${draft.pickupBarangay}`
                : draft.pickupLocationId
            }
            onChange={(e) => {
              const val = e.target.value
              if (val.startsWith("brgy:")) {
                const bName = val.replace("brgy:", "")
                const bg = BUTUAN_BARANGAYS.find((b) => b.name === bName)
                if (bg) {
                  const nearest = findNearestVeyraHub(bg.lat, bg.lng)
                  updateDraft({
                    pickupLocationId: nearest.hub.id,
                    pickupBarangay: bg.name,
                    pickupStreetAddress: draft.pickupStreetAddress || `Barangay ${bg.name}, Butuan City`,
                  })
                  setCustomAddressMode(true)
                  setGeoNotice({
                    type: "info",
                    message: `Barangay ${bg.name} selected. Handover will be dispatched via ${nearest.hub.name} (Complimentary Butuan delivery). You can specify your street address or landmark below.`,
                  })
                }
              } else {
                const loc = availableLocations.find((l) => l.id === val)
                updateDraft({
                  pickupLocationId: val,
                  pickupBarangay: loc?.barangay || undefined,
                })
              }
            }}
            className="w-full h-10 rounded-lg border border-input bg-background/90 px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <optgroup label="Official Veyra Hubs (8 Stations)">
              {availableLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  ★ Barangay {loc.barangay || loc.name} (Official Station)
                </option>
              ))}
            </optgroup>
            <optgroup label="Valet Delivery Across All Butuan City (86 Barangays)">
              {BUTUAN_BARANGAYS.map((bg) => (
                <option key={bg.name} value={`brgy:${bg.name}`}>
                  Barangay {bg.name} ({bg.district})
                </option>
              ))}
            </optgroup>
          </select>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="font-semibold text-foreground">
              {draft.pickupBarangay &&
              !availableLocations.some(
                (l) => l.barangay?.toLowerCase() === draft.pickupBarangay?.toLowerCase()
              )
                ? "Handover Area:"
                : "Station:"}
            </span>
            <span>
              {draft.pickupBarangay &&
              !availableLocations.some(
                (l) => l.barangay?.toLowerCase() === draft.pickupBarangay?.toLowerCase()
              )
                ? `Barangay ${draft.pickupBarangay}, Butuan City (Dispatched via ${pickupHub.name})`
                : pickupHub.address || `Brgy. ${pickupHub.barangay}, Butuan City`}
            </span>
          </p>
        </div>

        {/* Return Barangay Hub */}
        <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2">
          <label
            htmlFor="booking-return-loc-select"
            className="text-xs font-semibold text-foreground flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <RiCompassDiscoverLine className="size-3.5 text-muted-foreground" />
              <span>Return Barangay Hub</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Flexible Return
            </span>
          </label>
          <select
            id="booking-return-loc-select"
            value={draft.returnLocationId}
            onChange={(e) => updateDraft({ returnLocationId: e.target.value })}
            className="w-full h-10 rounded-lg border border-input bg-background/90 px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            {availableLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                Barangay {loc.barangay || loc.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="font-semibold text-foreground">Station:</span>
            <span>{returnHub.address || `Brgy. ${returnHub.barangay}, Butuan City`}</span>
          </p>
        </div>
      </div>

      {/* Manual Pickup Address Toggle */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiBuildingLine className="size-4 text-primary shrink-0" />
            <div>
              <span className="text-xs font-semibold text-foreground block">
                Custom Pickup / Delivery Address
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Need valet delivery to your home, office, hotel, or landmark in Butuan City?
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCustomAddressMode(!customAddressMode)}
            className="text-xs font-semibold text-primary hover:underline px-2 py-1"
          >
            {customAddressMode ? "Use Hub Only" : "+ Specify Address"}
          </button>
        </div>

        {customAddressMode && (
          <div className="space-y-3 pt-3 border-t border-border/60">
            {/* Barangay Selection within custom address mode */}
            <div className="space-y-1.5">
              <label
                htmlFor="booking-custom-barangay"
                className="text-xs font-medium text-foreground flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <RiRoadMapLine className="size-3.5 text-primary" />
                  <span>Pickup Barangay</span>
                </span>
                <span className="text-[10px] text-primary font-medium">
                  All 86 Butuan City Barangays Supported
                </span>
              </label>
              <select
                id="booking-custom-barangay"
                value={draft.pickupBarangay || ""}
                onChange={(e) => {
                  const bName = e.target.value
                  const bg = BUTUAN_BARANGAYS.find((b) => b.name === bName)
                  if (bg) {
                    const nearest = findNearestVeyraHub(bg.lat, bg.lng)
                    updateDraft({
                      pickupLocationId: nearest.hub.id,
                      pickupBarangay: bg.name,
                    })
                  } else {
                    updateDraft({ pickupBarangay: undefined })
                  }
                }}
                className="w-full h-10 rounded-lg border border-input bg-background/90 px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <option value="">Select a Butuan City Barangay...</option>
                {BUTUAN_BARANGAYS.map((bg) => (
                  <option key={bg.name} value={bg.name}>
                    Barangay {bg.name} ({bg.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Street / Complete Address Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="booking-street-address"
                className="text-xs font-medium text-foreground flex items-center justify-between"
              >
                <span>Street, Building, or Unit Address</span>
                <span className="text-[10px] text-muted-foreground">
                  Must be within Butuan City, Agusan del Norte
                </span>
              </label>
              <Input
                id="booking-street-address"
                placeholder="e.g., Door 3, Montilla Blvd., Purok 4"
                value={draft.pickupStreetAddress || ""}
                onChange={(e) =>
                  updateDraft({ pickupStreetAddress: e.target.value })
                }
                className="h-10 text-xs"
              />

              {/* Service Area Boundary Validation Feedback */}
              {!addressValidation.isValid && (
                <div
                  role="alert"
                  className="rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-destructive flex items-start gap-2 text-xs"
                >
                  <RiAlertLine className="size-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px]">
                    <span className="font-semibold block">
                      Outside Supported Service Area: {addressValidation.outOfServiceMatch}
                    </span>
                    <span>
                      Veyra operates exclusively within Butuan City, Agusan del Norte.
                      Vehicle pickup or delivery cannot be provided outside Butuan City.
                      Please specify an address in Butuan City or choose from our 8 verified barangay hubs.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Landmark & Contact Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="booking-landmark"
                  className="text-xs font-medium text-foreground flex items-center gap-1"
                >
                  <RiMapPinLine className="size-3 text-muted-foreground" />
                  <span>Nearby Landmark / Notes</span>
                </label>
                <Input
                  id="booking-landmark"
                  placeholder="e.g., Near Robinsons Place North Gate"
                  value={draft.pickupLandmark || ""}
                  onChange={(e) =>
                    updateDraft({ pickupLandmark: e.target.value })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-contact-phone"
                  className="text-xs font-medium text-foreground flex items-center gap-1"
                >
                  <RiPhoneLine className="size-3 text-muted-foreground" />
                  <span>Handover Contact Number</span>
                </label>
                <Input
                  id="booking-contact-phone"
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={draft.pickupContactPhone || ""}
                  onChange={(e) =>
                    updateDraft({ pickupContactPhone: e.target.value })
                  }
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Valet Delivery Fee transparency: complimentary for Butuan City */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-[11px] text-emerald-950 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <RiCheckDoubleLine className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Citywide Valet Delivery Fee</span>
              </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                Complimentary (₱0.00)
              </span>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
              <RiCheckDoubleLine className="size-3.5 text-primary shrink-0" />
              <span>
                Our concierge will contact this number 30 minutes prior to delivery at your specified Butuan City address.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
