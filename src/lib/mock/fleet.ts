import { FleetVehicle } from "@/features/admin/types"
import { MOCK_VEHICLES } from "./vehicles"

/**
 * Mock Fleet Vehicles for Admin Operations
 * Reflects the 10 affordable fleet vehicles stationed in Butuan City.
 */
const BUTUAN_BRANCH = "Veyra Butuan City Hub"
const BUTUAN_BRANCH_ID = "b0000000-0000-0000-0000-000000000001"

export const MOCK_FLEET_VEHICLES: FleetVehicle[] = [
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-wigo")!,
    plateNumber: "DEV-WIG-01",
    vin: "DEV17TOYOTAWIG001",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 8200,
    fuelLevel: 100,
    lastInspectionDate: "Mar 01, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 15000,
    condition: "excellent",
    acquisitionDate: "Jan 2024",
    internalNotes: "Compact hatchback stationed at Barangay Libertad Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-mirage")!,
    plateNumber: "DEV-MRG-02",
    vin: "DEV17MITSMIR002",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 12500,
    fuelLevel: 100,
    lastInspectionDate: "Mar 01, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 20000,
    condition: "excellent",
    acquisitionDate: "Feb 2024",
    internalNotes: "Economical city hatchback stationed at Barangay Villa Kananga Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-vios")!,
    plateNumber: "DEV-VIO-03",
    vin: "DEV17TOYOTAVIO003",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 14100,
    fuelLevel: 100,
    lastInspectionDate: "Mar 05, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 25000,
    condition: "excellent",
    acquisitionDate: "Jan 2024",
    internalNotes: "Reliable sedan stationed at Barangay San Vicente Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-city")!,
    plateNumber: "DEV-CTY-04",
    vin: "DEV17HONDACITY004",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 11200,
    fuelLevel: 100,
    lastInspectionDate: "Mar 02, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 20000,
    condition: "excellent",
    acquisitionDate: "Feb 2024",
    internalNotes: "Comfortable sedan stationed at Barangay Libertad Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-avanza")!,
    plateNumber: "DEV-AVZ-05",
    vin: "DEV17TOYOTAAVZ005",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 16800,
    fuelLevel: 100,
    lastInspectionDate: "Mar 01, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 25000,
    condition: "excellent",
    acquisitionDate: "Mar 2024",
    internalNotes: "7-seater MPV stationed at Barangay Ampayon Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-livina")!,
    plateNumber: "DEV-LIV-06",
    vin: "DEV17NISSANLIV006",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 15200,
    fuelLevel: 100,
    lastInspectionDate: "Mar 04, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 25000,
    condition: "excellent",
    acquisitionDate: "Mar 2024",
    internalNotes: "7-seater MPV stationed at Barangay J.P. Rizal Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-xpander")!,
    plateNumber: "DEV-XPD-07",
    vin: "DEV17MITSXPD007",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 13900,
    fuelLevel: 100,
    lastInspectionDate: "Mar 01, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 25000,
    condition: "excellent",
    acquisitionDate: "Feb 2024",
    internalNotes: "Spacious 7-seater MPV stationed at Barangay Baan Km. 3 Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-innova")!,
    plateNumber: "DEV-INV-08",
    vin: "DEV17TOYOTAINV008",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 21000,
    fuelLevel: 100,
    lastInspectionDate: "Mar 01, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 30000,
    condition: "excellent",
    acquisitionDate: "Jan 2024",
    internalNotes: "Dependable diesel 7-seater MPV stationed at Barangay Dagohoy Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-hilux")!,
    plateNumber: "DEV-HLX-09",
    vin: "DEV17TOYOTAHLX009",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 19500,
    fuelLevel: 100,
    lastInspectionDate: "Mar 01, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 30000,
    condition: "excellent",
    acquisitionDate: "Feb 2024",
    internalNotes: "Utility pickup truck stationed at Barangay Leon Kilat Hub.",
  },
  {
    ...MOCK_VEHICLES.find((v) => v.id === "veh-montero")!,
    plateNumber: "DEV-MNT-10",
    vin: "DEV17MITSMON010",
    branch: BUTUAN_BRANCH,
    branchId: BUTUAN_BRANCH_ID,
    fleetStatus: "available",
    odometer: 18400,
    fuelLevel: 100,
    lastInspectionDate: "Mar 01, 2026",
    nextMaintenanceDue: "Sep 2026",
    nextMaintenanceOdometer: 30000,
    condition: "excellent",
    acquisitionDate: "Jan 2024",
    internalNotes: "Midsize 7-seater SUV stationed at Barangay Villa Kananga Hub.",
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
