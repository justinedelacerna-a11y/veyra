import { Vehicle } from "@/types"
import { CustomerProfile } from "@/features/account/types"

// ─── Reservation State Machine ────────────────────────────────────────────────

export type AdminReservationStatus =
  | "draft"
  | "quote_created"
  | "held"
  | "payment_pending"
  | "confirmed"
  | "pickup_ready"
  | "active"
  | "return_inspection"
  | "completed"
  | "cancelled"
  | "no_show"
  | "disputed"
  | "expired"
  | "payment_failed"

export interface AdminReservationStatusConfig {
  label: string
  badgeVariant: "success" | "warning" | "error" | "info" | "neutral" | "pending"
  description: string
}

export const RESERVATION_STATUS_CONFIG: Record<AdminReservationStatus, AdminReservationStatusConfig> = {
  draft: { label: "Draft", badgeVariant: "neutral", description: "Reservation started but not submitted." },
  quote_created: { label: "Quote Created", badgeVariant: "neutral", description: "Authoritative price quote generated." },
  held: { label: "Held", badgeVariant: "pending", description: "Vehicle slot held, awaiting payment." },
  payment_pending: { label: "Payment Pending", badgeVariant: "warning", description: "Awaiting payment confirmation." },
  confirmed: { label: "Confirmed", badgeVariant: "success", description: "Payment received or deferred hold confirmed." },
  pickup_ready: { label: "Pickup Ready", badgeVariant: "info", description: "Vehicle prepped and staged at hub." },
  active: { label: "Active Rental", badgeVariant: "success", description: "Vehicle is currently on rental." },
  return_inspection: { label: "Return Inspection", badgeVariant: "pending", description: "Vehicle returned; inspection in progress." },
  completed: { label: "Completed", badgeVariant: "neutral", description: "Rental closed, deposit released." },
  cancelled: { label: "Cancelled", badgeVariant: "error", description: "Reservation was cancelled." },
  no_show: { label: "No-Show", badgeVariant: "error", description: "Customer did not appear for pickup." },
  disputed: { label: "Disputed", badgeVariant: "warning", description: "Reservation under dispute review." },
  expired: { label: "Expired", badgeVariant: "neutral", description: "Hold period expired without payment." },
  payment_failed: { label: "Payment Failed", badgeVariant: "error", description: "Payment attempt was unsuccessful." },
}

// ─── Fleet Operational Status ─────────────────────────────────────────────────

export type FleetVehicleStatus =
  | "available"
  | "reserved"
  | "rented"
  | "inspection"
  | "maintenance"
  | "inactive"
  | "retired"

export interface FleetVehicle extends Vehicle {
  plateNumber: string
  vin: string
  branch: string
  branchId: string
  fleetStatus: FleetVehicleStatus
  odometer: number
  fuelLevel: number
  lastInspectionDate: string
  nextMaintenanceDue: string
  nextMaintenanceOdometer?: number
  currentReservationId?: string
  condition: "excellent" | "good" | "fair" | "poor"
  internalNotes?: string
  acquisitionDate: string
}

// ─── Admin Reservation ────────────────────────────────────────────────────────

export interface AdminReservation {
  id: string
  reference?: string
  status: AdminReservationStatus
  customerId: string
  customerName: string
  customerEmail: string
  vehicleId: string
  vehicleName: string
  vehiclePlate: string
  branch: string
  pickupLocationId: string
  pickupLocationName: string
  pickupBarangay?: string
  pickupDate: string
  pickupTime: string
  returnLocationId: string
  returnLocationName: string
  returnBarangay?: string
  returnDate: string
  returnTime: string
  rentalDays: number
  totalAmount: number
  depositAmount: number
  currency: string
  paymentStatus: "pending" | "authorized" | "captured" | "refunded" | "failed"
  paymentMethod: string
  extras: string[]
  createdAt: string
  updatedAt: string
  assignedVehicleId?: string
  internalNotes?: string
}

// ─── Payment Record ───────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded" | "partially_refunded"

export interface PaymentRecord {
  id: string
  reservationId: string
  customerId: string
  customerName: string
  amount: number
  currency: string
  status: PaymentStatus
  method: "card" | "e-wallet" | "counter" | "bank_transfer"
  provider: string
  transactionRef: string
  createdAt: string
  updatedAt: string
  refundedAmount?: number
  refundReason?: string
  notes?: string
}

// ─── Maintenance Record ───────────────────────────────────────────────────────

export type MaintenanceStatus = "scheduled" | "due" | "in_progress" | "completed" | "overdue"
export type MaintenancePriority = "low" | "normal" | "high" | "urgent"
export type MaintenanceType = "routine_service" | "brake_service" | "tire_replacement" | "oil_change" | "battery_check" | "ac_service" | "electrical" | "bodywork" | "recall"

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  vehicleName: string
  vehiclePlate: string
  branch: string
  type: MaintenanceType
  typeLabel: string
  status: MaintenanceStatus
  priority: MaintenancePriority
  scheduledDate: string
  completedDate?: string
  odometer: number
  estimatedCost: number
  actualCost?: number
  currency: string
  provider?: string
  notes?: string
  createdAt: string
}

// ─── Inspection Record ────────────────────────────────────────────────────────

export type InspectionType = "pickup" | "return"
export type InspectionDamageStatus = "no_damage" | "existing_noted" | "new_damage" | "needs_review" | "charge_proposed" | "resolved"

export interface InspectionCheckItem {
  area: string
  status: "pass" | "fail" | "noted"
  notes?: string
}

export interface InspectionRecord {
  id: string
  reservationId: string
  vehicleId: string
  vehicleName: string
  vehiclePlate: string
  customerId: string
  customerName: string
  type: InspectionType
  inspector: string
  date: string
  startOdometer: number
  endOdometer?: number
  fuelLevelStart: number
  fuelLevelEnd?: number
  damageStatus: InspectionDamageStatus
  checkItems: InspectionCheckItem[]
  notes?: string
  completed: boolean
}

// ─── Staff User ───────────────────────────────────────────────────────────────

export type StaffRole =
  | "branch_staff"
  | "branch_manager"
  | "fleet_manager"
  | "support"
  | "finance"
  | "admin"
  | "superadmin"

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  branch_staff: "Branch Staff",
  branch_manager: "Branch Manager",
  fleet_manager: "Fleet Manager",
  support: "Customer Support",
  finance: "Finance",
  admin: "Administrator",
  superadmin: "Superadmin",
}

export interface StaffUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: StaffRole
  branch?: string
  branchId?: string
  status: "active" | "inactive" | "suspended"
  lastActive: string
  joinedDate: string
  permissions: string[]
}

// ─── Audit Event ──────────────────────────────────────────────────────────────

export type AuditAction =
  | "reservation.created"
  | "reservation.confirmed"
  | "reservation.cancelled"
  | "reservation.status_changed"
  | "payment.captured"
  | "payment.refunded"
  | "vehicle.status_changed"
  | "vehicle.assigned"
  | "fleet.maintenance_scheduled"
  | "inspection.completed"
  | "customer.updated"
  | "user.role_changed"
  | "user.suspended"
  | "pricing.updated"
  | "settings.changed"
  | "vehicle.photo_uploaded"
  | "vehicle.photo_set_primary"
  | "vehicle.photo_deleted"
  | "vehicle.photos_reordered"

export interface AuditEvent {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actorRole: StaffRole
  action: AuditAction
  resource: string
  resourceId: string
  result: "success" | "failure"
  details: string
  ipAddress?: string
}

// ─── Admin Customer Record ────────────────────────────────────────────────────

export interface AdminCustomerRecord extends CustomerProfile {
  name?: string
  userId?: string
  driverLicenseNumber?: string
  driverLicenseExpiry?: string
  reservationCount: number
  activeReservationId?: string
  lastRentalDate?: string
  lastRentalVehicle?: string
  totalSpent: number
  currency: string
  documentStatus: "complete" | "pending" | "incomplete"
  verificationStatus: "verified" | "pending" | "rejected"
  status: "active" | "restricted" | "blocked"
  notes?: string
}

// ─── Admin Customer Document ──────────────────────────────────────────────────

export interface AdminCustomerDocument {
  id: string
  customerId: string
  type: "driver_license" | "government_id" | "address_proof" | "passport"
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  status: "pending_review" | "approved" | "rejected" | "expired"
  rejectionReason?: string
  expiresAt?: string
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}
