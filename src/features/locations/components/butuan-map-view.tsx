"use client"

import * as React from "react"
import type L from "leaflet"
import {
  BUTUAN_BARANGAYS,
  BUTUAN_CITY_BOUNDS,
  BUTUAN_LANDMARKS,
  VEYRA_PICKUP_HUBS,
  findNearestVeyraHub,
  isWithinButuanServiceArea,
  type VeyraHubLocation,
  type ButuanLandmark,
} from "@/features/locations/data/butuan-city-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import {
  RiMapPinLine,
  RiNavigationLine,
  RiSearchLine,
  RiRestartLine,
  RiCompassLine,
  RiCheckLine,
  RiAlertLine,
  RiCloseLine,
  RiCarLine,
  RiEyeLine,
  RiEyeOffLine,
} from "@remixicon/react"

export interface SelectedLocationData {
  address: string
  barangay: string
  landmark?: string
  lat: number
  lng: number
  nearestHubId: string
  nearestHubName: string
  distanceToHubKm: number
  isInsideServiceArea: boolean
  warningReason?: string
}

export interface ButuanMapViewProps {
  hubs?: VeyraHubLocation[]
  mode?: "explore" | "picker" | "admin"
  initialSelectedHubId?: string
  allowPinDrop?: boolean
  onSelectLocation?: (data: SelectedLocationData) => void
  onSelectHub?: (hub: VeyraHubLocation) => void
  className?: string
}

interface SearchSuggestion {
  id: string
  name: string
  displayName: string
  lat: number
  lng: number
  type: "hub" | "landmark" | "barangay" | "osm"
  barangay?: string
}

export default function ButuanMapView({
  hubs = VEYRA_PICKUP_HUBS,
  mode = "explore",
  initialSelectedHubId,
  allowPinDrop = true,
  onSelectLocation,
  onSelectHub,
  className = "h-[540px] sm:h-[620px]",
}: ButuanMapViewProps) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = React.useRef<L.Map | null>(null)
  const leafletRef = React.useRef<typeof L | null>(null)

  // Layer groups and markers refs
  const hubsLayerGroupRef = React.useRef<L.LayerGroup | null>(null)
  const landmarksLayerGroupRef = React.useRef<L.LayerGroup | null>(null)
  const pinMarkerRef = React.useRef<L.Marker | null>(null)
  const barangayHighlightCircleRef = React.useRef<L.Circle | null>(null)
  const tileLayerRef = React.useRef<L.TileLayer | null>(null)
  const onSelectHubRef = React.useRef(onSelectHub)
  React.useEffect(() => {
    onSelectHubRef.current = onSelectHub
  }, [onSelectHub])

  // State
  const [showHubs, setShowHubs] = React.useState(true)
  const [showLandmarks, setShowLandmarks] = React.useState(true)
  const [tileMode, setTileMode] = React.useState<"streets" | "satellite">("streets")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [selectedBarangay, setSelectedBarangay] = React.useState<string>("")
  const [selectedPin, setSelectedPin] = React.useState<SelectedLocationData | null>(null)
  const [isResolvingAddress, setIsResolvingAddress] = React.useState(false)
  const [selectedHub, setSelectedHub] = React.useState<VeyraHubLocation | null>(null)
  const [isLocatingUser, setIsLocatingUser] = React.useState(false)
  const [geoError, setGeoError] = React.useState<string | null>(null)

  // Handle dropping a manual pin at coordinates
  const handleMapPinDrop = React.useCallback(
    async (
      lat: number,
      lng: number,
      knownLandmark?: string,
      presetAddress?: string,
      presetBarangay?: string
    ) => {
      const map = mapInstanceRef.current
      const L = leafletRef.current
      if (!map || !L) return

      // Position marker
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([lat, lng])
      } else {
        const pinIconHtml = `
          <div class="relative flex items-center justify-center -translate-y-4">
            <div class="flex items-center justify-center size-8 rounded-full bg-red-600 text-white shadow-xl ring-2 ring-white">
              <svg class="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
        `
        const pinIcon = L.divIcon({
          html: pinIconHtml,
          className: "veyra-drop-pin",
          iconSize: [32, 40],
          iconAnchor: [16, 40],
        })
        const newMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(map)
        pinMarkerRef.current = newMarker
      }

      // Determine nearest hub and check service boundary
      const nearest = findNearestVeyraHub(lat, lng)
      const serviceCheck = isWithinButuanServiceArea(lat, lng)

      let address =
        presetAddress ||
        `Butuan City, Agusan del Norte (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      let barangay = presetBarangay || "Libertad"
      const landmark = knownLandmark

      setSelectedPin({
        lat,
        lng,
        address,
        barangay,
        landmark,
        nearestHubId: nearest.hub.id,
        nearestHubName: nearest.hub.name,
        distanceToHubKm: nearest.distanceKm,
        isInsideServiceArea: serviceCheck.isSupported,
        warningReason: serviceCheck.reason,
      })

      // If address not preset, call reverse geocode API
      if (!presetAddress) {
        setIsResolvingAddress(true)
        try {
          const res = await fetch(`/api/locations/reverse?lat=${lat}&lng=${lng}`)
          if (res.ok) {
            const revData = await res.json()
            address = revData.address || address
            barangay = revData.barangay || barangay

            setSelectedPin({
              lat,
              lng,
              address,
              barangay,
              landmark: revData.landmark || landmark,
              nearestHubId: revData.nearestHub?.id || nearest.hub.id,
              nearestHubName: revData.nearestHub?.name || nearest.hub.name,
              distanceToHubKm: revData.nearestHub?.distanceKm ?? nearest.distanceKm,
              isInsideServiceArea: revData.isInsideServiceArea,
              warningReason: revData.warningMessage,
            })
          }
        } catch {
          // Fallback already assigned
        } finally {
          setIsResolvingAddress(false)
        }
      }
    },
    []
  )

  // Render Hub Markers with custom HTML SVGs
  const renderHubMarkers = React.useCallback(
    (
      L: typeof import("leaflet"),
      layer: L.LayerGroup,
      hubList: VeyraHubLocation[]
    ) => {
      layer.clearLayers()

      hubList.forEach((hub) => {
        const hubIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute -inset-1.5 rounded-full bg-amber-500/30 animate-pulse"></div>
            <div class="relative flex items-center justify-center size-9 rounded-full bg-amber-500 text-slate-950 font-bold shadow-lg ring-2 ring-white">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.9 2 11v5c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-semibold text-amber-400 shadow-md pointer-events-none">
              ${hub.barangay}
            </div>
          </div>
        `

        const hubIcon = L.divIcon({
          html: hubIconHtml,
          className: "veyra-hub-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        })

        const marker = L.marker([hub.lat, hub.lng], { icon: hubIcon })

        const popupContent = document.createElement("div")
        popupContent.className = "p-2 min-w-[220px] font-sans"
        popupContent.innerHTML = `
          <div class="space-y-2">
            <div class="flex items-center gap-1.5">
              <span class="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-900">
                Official Veyra Hub
              </span>
              <span class="text-[10px] text-emerald-600 font-semibold">Active Station</span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 leading-snug">${hub.name}</h4>
              <p class="text-xs text-slate-600 mt-0.5">${hub.address}</p>
            </div>
            <div class="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Hours:</span>
              <span class="font-medium text-slate-700">${hub.operatingHours}</span>
            </div>
          </div>
        `

        const actionBtn = document.createElement("button")
        actionBtn.type = "button"
        actionBtn.className =
          "mt-2.5 w-full py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        actionBtn.innerHTML = `<span>Select Station</span>`
        actionBtn.onclick = () => {
          setSelectedHub(hub)
          if (onSelectHubRef.current) onSelectHubRef.current(hub)
          marker.closePopup()
        }
        popupContent.appendChild(actionBtn)

        marker.bindPopup(popupContent)
        marker.on("click", () => {
          setSelectedHub(hub)
        })

        marker.addTo(layer)
      })
    },
    []
  )

  // Render Landmark Markers
  const renderLandmarkMarkers = React.useCallback(
    (
      L: typeof import("leaflet"),
      layer: L.LayerGroup,
      landmarks: ButuanLandmark[]
    ) => {
      layer.clearLayers()

      landmarks.forEach((lm) => {
        let iconColor = "bg-blue-600"
        if (lm.category === "transport") iconColor = "bg-sky-600"
        if (lm.category === "hospital") iconColor = "bg-rose-600"
        if (lm.category === "commercial") iconColor = "bg-emerald-600"
        if (lm.category === "education") iconColor = "bg-indigo-600"
        if (lm.category === "historical") iconColor = "bg-purple-600"

        const lmIconHtml = `
          <div class="flex items-center justify-center size-6 rounded-full ${iconColor} text-white shadow-sm ring-1 ring-white">
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        `

        const icon = L.divIcon({
          html: lmIconHtml,
          className: "veyra-lm-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([lm.lat, lm.lng], { icon })
        marker.bindTooltip(
          `<div class="font-sans text-xs"><strong>${lm.name}</strong><br/><span class="text-slate-500">${lm.address}</span></div>`,
          { direction: "top", offset: [0, -10] }
        )

        marker.on("click", () => {
          handleMapPinDrop(lm.lat, lm.lng, lm.name, lm.address, lm.barangay)
        })

        marker.addTo(layer)
      })
    },
    [handleMapPinDrop]
  )

  // Initialize Leaflet Map
  React.useEffect(() => {
    let isMounted = true

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return
      if (mapInstanceRef.current) return

      const L = await import("leaflet")
      leafletRef.current = L

      if (!isMounted || !mapContainerRef.current) return

      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [BUTUAN_CITY_BOUNDS.center.lat, BUTUAN_CITY_BOUNDS.center.lng],
        zoom: BUTUAN_CITY_BOUNDS.defaultZoom,
        minZoom: BUTUAN_CITY_BOUNDS.minZoom,
        maxZoom: BUTUAN_CITY_BOUNDS.maxZoom,
        zoomControl: false,
      })

      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Add base tile layer (Carto Voyager)
      const streetTiles = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      )
      streetTiles.addTo(map)
      tileLayerRef.current = streetTiles

      // Create LayerGroups
      const hubsLayer = L.layerGroup().addTo(map)
      const landmarksLayer = L.layerGroup().addTo(map)
      hubsLayerGroupRef.current = hubsLayer
      landmarksLayerGroupRef.current = landmarksLayer

      mapInstanceRef.current = map

      // Render Hubs
      renderHubMarkers(L, hubsLayer, hubs)

      // Render Landmarks
      renderLandmarkMarkers(L, landmarksLayer, BUTUAN_LANDMARKS)

      // Map Click Handler for Dropping Pin
      if (allowPinDrop) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          handleMapPinDrop(e.latlng.lat, e.latlng.lng)
        })
      }

      // Check if an initial hub was requested
      if (initialSelectedHubId) {
        const found = hubs.find((h) => h.id === initialSelectedHubId)
        if (found) {
          map.setView([found.lat, found.lng], 15)
          setSelectedHub(found)
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [
    allowPinDrop,
    hubs,
    initialSelectedHubId,
    renderHubMarkers,
    renderLandmarkMarkers,
    handleMapPinDrop,
  ])

  // Toggle Tile Layer (Streets vs Satellite)
  React.useEffect(() => {
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (!map || !L) return

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    if (tileMode === "satellite") {
      const satLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 18,
        }
      )
      satLayer.addTo(map)
      tileLayerRef.current = satLayer
    } else {
      const streetLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      )
      streetLayer.addTo(map)
      tileLayerRef.current = streetLayer
    }
  }, [tileMode])

  // Toggle Hubs visibility
  React.useEffect(() => {
    const map = mapInstanceRef.current
    const group = hubsLayerGroupRef.current
    if (!map || !group) return

    if (showHubs) {
      if (!map.hasLayer(group)) {
        map.addLayer(group)
      }
    } else {
      if (map.hasLayer(group)) {
        map.removeLayer(group)
      }
    }
  }, [showHubs])

  // Toggle Landmarks visibility
  React.useEffect(() => {
    const map = mapInstanceRef.current
    const group = landmarksLayerGroupRef.current
    if (!map || !group) return

    if (showLandmarks) {
      if (!map.hasLayer(group)) {
        map.addLayer(group)
      }
    } else {
      if (map.hasLayer(group)) {
        map.removeLayer(group)
      }
    }
  }, [showLandmarks])

  // Handle Search Input
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)

    if (val.trim().length < 2) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(val)}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.results || [])
      }
    } catch {
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  // Handle Select Suggestion
  const handleSelectSuggestion = (item: SearchSuggestion) => {
    setSearchQuery(item.name)
    setSuggestions([])

    const map = mapInstanceRef.current
    if (map) {
      map.flyTo([item.lat, item.lng], 16, { duration: 1.2 })
      handleMapPinDrop(item.lat, item.lng, item.name, item.displayName, item.barangay)
    }
  }

  // Handle Barangay Dropdown
  const handleBarangaySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bgName = e.target.value
    setSelectedBarangay(bgName)
    if (!bgName) return

    const bg = BUTUAN_BARANGAYS.find((b) => b.name === bgName)
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (!bg || !map || !L) return

    map.flyTo([bg.lat, bg.lng], 15, { duration: 1.2 })

    // Highlight area with circle ring
    if (barangayHighlightCircleRef.current) {
      map.removeLayer(barangayHighlightCircleRef.current)
    }

    const circle = L.circle([bg.lat, bg.lng], {
      color: "#f59e0b",
      fillColor: "#fbbf24",
      fillOpacity: 0.15,
      radius: 650,
      weight: 2,
    }).addTo(map)

    barangayHighlightCircleRef.current = circle

    handleMapPinDrop(
      bg.lat,
      bg.lng,
      undefined,
      `Barangay ${bg.name}, Butuan City, Agusan del Norte`,
      bg.name
    )
  }

  // Reset Map View to Full City
  const handleResetView = () => {
    const map = mapInstanceRef.current
    if (!map) return
    map.flyTo([BUTUAN_CITY_BOUNDS.center.lat, BUTUAN_CITY_BOUNDS.center.lng], BUTUAN_CITY_BOUNDS.defaultZoom, {
      duration: 1.0,
    })
    setSelectedBarangay("")
    if (barangayHighlightCircleRef.current) {
      map.removeLayer(barangayHighlightCircleRef.current)
      barangayHighlightCircleRef.current = null
    }
  }

  // Geolocation (Explicit User Action)
  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.")
      return
    }

    setIsLocatingUser(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const map = mapInstanceRef.current
        if (map) {
          map.flyTo([lat, lng], 16, { duration: 1.2 })
          handleMapPinDrop(lat, lng)
        }
      },
      (err) => {
        setIsLocatingUser(false)
        setGeoError(err.message || "Unable to determine your location.")
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border bg-card shadow-sm ${className}`}>
      {/* ── Top Floating Search & Filter Bar ─────────────────────────────── */}
      <div className="absolute top-3 inset-x-3 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto">
        {/* Search Input */}
        <div className="relative flex-1">
          {isSearching ? (
            <RiCompassLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-amber-500 animate-spin" />
          ) : (
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          )}
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search Butuan City places, roads, landmarks, or barangays..."
            className="pl-9 pr-8 h-10 bg-card/95 backdrop-blur-md shadow-md border-border/80 text-xs sm:text-sm font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setSuggestions([])
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <RiCloseLine className="size-4" />
            </button>
          )}

          {/* Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-11 mt-1 max-h-60 overflow-y-auto rounded-xl border bg-card/95 backdrop-blur-md shadow-xl py-1 divide-y divide-border/40 z-[1050]">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-3 py-2 text-left hover:bg-muted/70 flex items-start gap-2.5 transition-colors"
                >
                  <RiMapPinLine className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.displayName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Barangay Quick Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedBarangay}
            onChange={handleBarangaySelect}
            className="h-10 px-3 rounded-lg border border-border/80 bg-card/95 backdrop-blur-md shadow-md text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Filter by Butuan City Barangay"
          >
            <option value="">Jump to Barangay (86)...</option>
            {BUTUAN_BARANGAYS.map((b) => (
              <option key={b.name} value={b.name}>
                Brgy. {b.name} ({b.type})
              </option>
            ))}
          </select>

          {/* Reset View Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetView}
            className="h-10 px-3 bg-card/95 backdrop-blur-md shadow-md gap-1.5 shrink-0"
            title="Reset Map to Full Butuan City View"
          >
            <RiRestartLine className="size-4" />
            <span className="hidden sm:inline text-xs font-semibold">City Extent</span>
          </Button>

          {/* User Location Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFindMyLocation}
            disabled={isLocatingUser}
            className="h-10 px-3 bg-card/95 backdrop-blur-md shadow-md gap-1.5 shrink-0"
            title="Locate My Position in Butuan"
          >
            <RiNavigationLine className={`size-4 ${isLocatingUser ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline text-xs font-semibold">My GPS</span>
          </Button>
        </div>
      </div>

      {/* ── Layer Toggles & Mode Indicator (Left Floating) ───────────────── */}
      <div className="absolute top-16 sm:top-16 left-3 z-[990] flex flex-col gap-1.5 pointer-events-auto">
        {/* Mode Tag */}
        <div className="px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-amber-400 backdrop-blur-sm self-start">
          {mode === "admin" ? "Admin Hub Ops" : mode === "picker" ? "Drop Pin Mode" : "City Explorer"}
        </div>

        {/* Toggle Hubs */}
        <button
          type="button"
          onClick={() => setShowHubs(!showHubs)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-md text-xs font-medium backdrop-blur-md transition-colors ${
            showHubs
              ? "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300"
              : "bg-card/90 border-border text-muted-foreground"
          }`}
        >
          {showHubs ? <RiEyeLine className="size-3.5" /> : <RiEyeOffLine className="size-3.5" />}
          <span>Veyra Hubs ({hubs.length})</span>
        </button>

        {/* Toggle Landmarks */}
        <button
          type="button"
          onClick={() => setShowLandmarks(!showLandmarks)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-md text-xs font-medium backdrop-blur-md transition-colors ${
            showLandmarks
              ? "bg-primary/15 border-primary/50 text-primary"
              : "bg-card/90 border-border text-muted-foreground"
          }`}
        >
          {showLandmarks ? <RiEyeLine className="size-3.5" /> : <RiEyeOffLine className="size-3.5" />}
          <span>Landmarks</span>
        </button>

        {/* Toggle Street vs Satellite */}
        <button
          type="button"
          onClick={() => setTileMode(tileMode === "streets" ? "satellite" : "streets")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card/90 shadow-md text-xs font-medium text-foreground backdrop-blur-md hover:bg-card transition-colors"
        >
          <RiCompassLine className="size-3.5" />
          <span>{tileMode === "streets" ? "Satellite" : "Street Map"}</span>
        </button>
      </div>

      {/* Geolocation Notice Banner */}
      {geoError && (
        <div className="absolute top-28 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-md z-[995] rounded-xl bg-destructive/90 text-destructive-foreground p-3 shadow-lg flex items-center justify-between text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <RiAlertLine className="size-4 shrink-0" />
            <span>{geoError}</span>
          </div>
          <button type="button" onClick={() => setGeoError(null)} className="ml-2 hover:opacity-80">
            <RiCloseLine className="size-4" />
          </button>
        </div>
      )}

      {/* ── Leaflet Container ───────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[400px]" />

      {/* ── Bottom Selected Location / Pin Information Drawer ───────────── */}
      {selectedPin && (
        <div className="absolute bottom-3 inset-x-3 sm:left-3 sm:right-auto sm:w-96 z-[990] rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl p-4 space-y-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={selectedPin.isInsideServiceArea ? "success" : "error"}
                  label={
                    selectedPin.isInsideServiceArea
                      ? "Within Butuan Service Area"
                      : "Outside Service Area"
                  }
                  size="sm"
                />
                {isResolvingAddress && (
                  <span className="text-[10px] text-muted-foreground animate-pulse">
                    Resolving street...
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-foreground line-clamp-2">
                {selectedPin.address}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPin(null)}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Close location card"
            >
              <RiCloseLine className="size-4" />
            </button>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/50">
            <div>
              <span className="text-muted-foreground">Barangay:</span>
              <p className="font-semibold text-foreground">{selectedPin.barangay}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Nearest Station:</span>
              <p className="font-semibold text-foreground truncate">
                {selectedPin.nearestHubName}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Estimated Distance:</span>
              <p className="font-semibold text-foreground">
                ~{selectedPin.distanceToHubKm.toFixed(1)} km to hub
              </p>
            </div>
            {selectedPin.landmark && (
              <div>
                <span className="text-muted-foreground">Nearby Landmark:</span>
                <p className="font-semibold text-foreground truncate">{selectedPin.landmark}</p>
              </div>
            )}
          </div>

          {/* Service Area Warning if outside */}
          {!selectedPin.isInsideServiceArea && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 flex items-start gap-2 text-xs text-destructive">
              <RiAlertLine className="size-4 shrink-0 mt-0.5" />
              <span>
                {selectedPin.warningReason ||
                  "This point is outside Veyra's Butuan City service boundary. Vehicle delivery and pickup cannot be fulfilled here."}
              </span>
            </div>
          )}

          {/* Confirmation Action */}
          {allowPinDrop && onSelectLocation && (
            <Button
              type="button"
              size="sm"
              disabled={!selectedPin.isInsideServiceArea}
              onClick={() => {
                onSelectLocation(selectedPin)
              }}
              className="w-full gap-2 text-xs font-semibold"
            >
              <RiCheckLine className="size-4" />
              <span>Use This Address for Pickup</span>
            </Button>
          )}
        </div>
      )}

      {/* ── Hub Selection Info (if clicked an official hub) ─────────────── */}
      {!selectedPin && selectedHub && (
        <div className="absolute bottom-3 inset-x-3 sm:left-3 sm:right-auto sm:w-80 z-[990] rounded-xl border border-amber-500/40 bg-card/95 backdrop-blur-md shadow-2xl p-4 space-y-2 pointer-events-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Official Pickup Hub
              </span>
              <h4 className="font-heading text-sm font-bold text-foreground">
                {selectedHub.name}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedHub(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <RiCloseLine className="size-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{selectedHub.address}</p>
          <div className="text-[11px] text-muted-foreground">
            Operating: <span className="text-foreground font-medium">{selectedHub.operatingHours}</span>
          </div>

          {onSelectHub && (
            <Button
              type="button"
              size="sm"
              onClick={() => onSelectHub(selectedHub)}
              className="w-full gap-1.5 text-xs font-semibold mt-1"
            >
              <RiCarLine className="size-3.5" />
              <span>Reserve at this Hub</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
