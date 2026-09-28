import { FleetVehicle } from "@/features/admin/types"
import { MOCK_VEHICLES } from "./vehicles"

/**
 * Mock Fleet Vehicles for Admin Operations
 * NOTE: This mock data is for frontend prototype use only.
 * Real fleet data will be stored in Supabase and managed server-side.
 */
export const MOCK_FLEET_VEHICLES: FleetVehicle[] = [
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-taycan-4s")!,
    plateNumber: "CGY-8841-EV",
    vin: "WP0AA2Y19NSA04221",
    branch: "Laguindingan Airport Hub",
    branchId: "loc-cgy-airport",
    fleetStatus: "reserved",
    odometer: 12450,
    fuelLevel: 94,
    lastInspectionDate: "Sep 22, 2026",
    nextMaintenanceDue: "Dec 2026",
    nextMaintenanceOdometer: 20000,
    currentReservationId: "VYR-8492-CDO",
    condition: "excellent",
    acquisitionDate: "Jan 2024",
    internalNotes: "EV charging cable kit stored in frunk. Customer pre-briefing required.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-prado-tx")!,
    plateNumber: "CGY-3312-SV",
    vin: "JTEBH3FJ7HK080421",
    branch: "CDO City Center Hub",
    branchId: "loc-cgy-downtown",
    fleetStatus: "available",
    odometer: 31800,
    fuelLevel: 88,
    lastInspectionDate: "Sep 18, 2026",
    nextMaintenanceDue: "Nov 2026",
    nextMaintenanceOdometer: 35000,
    condition: "good",
    acquisitionDate: "Mar 2023",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-camry-hev")!,
    plateNumber: "CGY-5503-HV",
    vin: "JTDBF3EH4G3004512",
    branch: "Laguindingan Airport Hub",
    branchId: "loc-cgy-airport",
    fleetStatus: "rented",
    odometer: 48200,
    fuelLevel: 72,
    lastInspectionDate: "Sep 10, 2026",
    nextMaintenanceDue: "Oct 2026",
    currentReservationId: "VYR-7310-DVO",
    condition: "good",
    acquisitionDate: "Jun 2022",
    internalNotes: "Scheduled for 50,000 km service October 2026.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-merc-e300")!,
    plateNumber: "DVO-9901-SD",
    vin: "WDD2130421A188441",
    branch: "Davao Airport Hub",
    branchId: "loc-dvo-airport",
    fleetStatus: "inspection",
    odometer: 22100,
    fuelLevel: 60,
    lastInspectionDate: "Sep 28, 2026",
    nextMaintenanceDue: "Jan 2027",
    condition: "good",
    acquisitionDate: "Oct 2023",
    internalNotes: "Return inspection in progress. Minor scuff on rear bumper being reviewed.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-alphard-exec")!,
    plateNumber: "CEB-7712-MV",
    vin: "JTNB11HK90J058721",
    branch: "Mactan-Cebu Airport Hub",
    branchId: "loc-ceb-airport",
    fleetStatus: "available",
    odometer: 67500,
    fuelLevel: 95,
    lastInspectionDate: "Sep 25, 2026",
    nextMaintenanceDue: "Dec 2026",
    condition: "good",
    acquisitionDate: "Jan 2021",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-patrol-nismo")!,
    plateNumber: "DVO-4481-NP",
    vin: "JN8AY2ND8J9702212",
    branch: "Davao Airport Hub",
    branchId: "loc-dvo-airport",
    fleetStatus: "rented",
    odometer: 38900,
    fuelLevel: 55,
    lastInspectionDate: "Sep 20, 2026",
    nextMaintenanceDue: "Feb 2027",
    currentReservationId: "VYR-7310-DVO",
    condition: "excellent",
    acquisitionDate: "Nov 2023",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-model-y")!,
    plateNumber: "CEB-2201-EV",
    vin: "5YJYGDEE5MF190881",
    branch: "Cebu IT Park Hub",
    branchId: "loc-ceb-itpark",
    fleetStatus: "maintenance",
    odometer: 19200,
    fuelLevel: 30,
    lastInspectionDate: "Sep 01, 2026",
    nextMaintenanceDue: "Oct 2026",
    condition: "fair",
    acquisitionDate: "Apr 2024",
    internalNotes: "AC compressor replacement in progress. ETA: Oct 5, 2026.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-bmw-530i")!,
    plateNumber: "CGY-6621-SE",
    vin: "WBAJA5C55JG901112",
    branch: "CDO City Center Hub",
    branchId: "loc-cgy-downtown",
    fleetStatus: "available",
    odometer: 55100,
    fuelLevel: 80,
    lastInspectionDate: "Sep 26, 2026",
    nextMaintenanceDue: "Nov 2026",
    condition: "good",
    acquisitionDate: "Feb 2022",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-hiace-grandia")!,
    plateNumber: "ILG-1109-VN",
    vin: "JTFHX92P900141221",
    branch: "Iligan City Hub",
    branchId: "loc-iligan-central",
    fleetStatus: "available",
    odometer: 92400,
    fuelLevel: 65,
    lastInspectionDate: "Sep 14, 2026",
    nextMaintenanceDue: "Oct 2026",
    condition: "fair",
    acquisitionDate: "Mar 2019",
    internalNotes: "Due for 95,000 km major service. Prioritize maintenance scheduling.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-civic-rs")!,
    plateNumber: "CEB-8804-RS",
    vin: "19XFC2F85ME401234",
    branch: "Mactan-Cebu Airport Hub",
    branchId: "loc-ceb-airport",
    fleetStatus: "available",
    odometer: 28700,
    fuelLevel: 100,
    lastInspectionDate: "Sep 27, 2026",
    nextMaintenanceDue: "Mar 2027",
    condition: "excellent",
    acquisitionDate: "Sep 2023",
  },
]

export function getFleetVehicleById(id: string): FleetVehicle | undefined {
  return MOCK_FLEET_VEHICLES.find((v) => v.id === id)
}

export function getFleetSummary() {
  const total = MOCK_FLEET_VEHICLES.length
  const available = MOCK_FLEET_VEHICLES.filter((v) => v.fleetStatus === "available").length
  const rented = MOCK_FLEET_VEHICLES.filter((v) => v.fleetStatus === "rented").length
  const maintenance = MOCK_FLEET_VEHICLES.filter(
    (v) => v.fleetStatus === "maintenance" || v.fleetStatus === "inspection"
  ).length
  const reserved = MOCK_FLEET_VEHICLES.filter((v) => v.fleetStatus === "reserved").length
  return { total, available, rented, maintenance, reserved }
}
