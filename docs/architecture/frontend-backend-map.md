# Veyra Frontend/Backend Integration Map

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document.
**Date:** September 2026

This document maps every frontend feature to its future backend data source. It is the roadmap for replacing mock data with real integrations.

---

## 1. Customer Frontend

### Homepage (`/`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Hero search widget | Client state | — (navigates to /search) |
| Location hub cards | `MOCK_LOCATIONS` | `locations` table via public API |
| Category cards | `MOCK_CATEGORY_CARDS` | `vehicle_classes` table + aggregated counts |
| Featured vehicles | `MOCK_VEHICLES` (filtered) | `vehicle_catalog` view with `fleet_status = available` |
| Trust pillars content | Hardcoded | — (static content, no backend needed) |
| "How It Works" content | Hardcoded | — (static content) |

---

### Vehicle Catalog (`/vehicles`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Vehicle list | `MOCK_VEHICLES` | `vehicle_catalog` view via GET `/api/vehicles` |
| Search filters | `MOCK_VEHICLES` (derived) | `vehicle_classes`, `extras` (metadata) |
| Sort/filter state | Client state (URL params) | URL params → server query |
| Availability indicator | `vehicle.available` boolean | Availability API call for given date range |
| Pricing display | `vehicle.dailyRate` | `vehicle_catalog.daily_rate` (from server) |

---

### Vehicle Detail (`/vehicles/[id]`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Vehicle specs | `MOCK_VEHICLES` lookup | `vehicle_catalog` view via GET `/api/vehicles/[id]` |
| Photos / gallery | Placeholder images | `vehicle_photos` → signed URL or public CDN |
| Rating & trip count | `vehicle.rating`, `vehicle.tripsCount` | Aggregated from `inspections` or a stats table |
| Similar vehicles | `MOCK_VEHICLES` filtered | Recommended vehicles API (same class) |
| Availability check | `vehicle.available` | GET `/api/vehicles/[id]/availability?from=&to=` |

---

### Search Results (`/search`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Available vehicles | `MOCK_VEHICLES` | POST `/api/search/availability` |
| Search criteria | URL params | URL params → server-side availability query |
| Location context | `MOCK_LOCATIONS` lookup | `locations` table lookup |
| Pricing in results | `vehicle.dailyRate` | Server-computed for date range |

---

### Booking Flow (`/booking/*`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Vehicle details (step 1) | `MOCK_VEHICLES` lookup | GET `/api/vehicles/[id]` |
| Location names | `MOCK_LOCATIONS` lookup | `locations` table |
| Extras catalog | `MOCK_BOOKING_EXTRAS` | GET `/api/extras` |
| Pricing calculation | `calculateBookingPricing()` | POST `/api/quotes` (server computes) |
| Quote display | Client-computed | Server quote returned and displayed |
| Driver form submission | sessionStorage | — (driver details in booking request) |
| Payment initiation | Mock `completeBooking()` | POST `/api/reservations` + payment intent |
| Booking confirmation | Generated mock reference | Real reservation record + webhook confirmation |

---

### Customer Account (`/account/*`)

#### Profile (`/account/profile`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Customer name, email | `MOCK_CUSTOMER_PROFILE` | `customers` table + Clerk email |
| Member since, tier | `MOCK_CUSTOMER_PROFILE` | `customers.created_at`, `customers.membership_tier` |
| Preferred hub | `MOCK_CUSTOMER_PROFILE` | `customers.preferred_hub_id` → `locations` |
| Total rentals | `MOCK_CUSTOMER_PROFILE` | Aggregated from `reservations` |

#### Reservations (`/account/reservations`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Reservation list | `MOCK_CUSTOMER_RESERVATIONS` | GET `/api/account/reservations` (auth required) |
| Reservation status | Mock status | `reservations.status` |
| Pricing breakdown | Mock pricing | Stored `quotes` + `reservation_extras` |
| Timeline | Mock timeline | Computed from reservation status history |

#### Reservation Detail (`/account/reservations/[id]`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Full reservation detail | `MOCK_CUSTOMER_RESERVATIONS` | GET `/api/account/reservations/[id]` |
| Driver details | Mock driver | `reservation_drivers` |
| Extras | Mock extras | `reservation_extras` |
| Payment status | Mock payment | `payments` |

#### Driver Profile (`/account/driver`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| License details | `MOCK_DRIVER_PROFILE` | `reservation_drivers` (primary) |
| Verification status | Mock status | `customers.verification_status` |

#### Documents (`/account/documents`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Document list | `MOCK_CUSTOMER_DOCUMENTS` | GET `/api/account/documents` |
| Document status | Mock status | `customer_documents.status` |
| Upload action | Mock upload | POST `/api/documents/upload` (server-validated) |
| View document | Not implemented | GET `/api/documents/[id]/view` → signed URL |

#### Security (`/account/security`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Active sessions | `MOCK_SECURITY_SESSIONS` | Clerk session management API |
| Revoke session | Not implemented | Clerk: `revokeSession()` |
| Change password | Not implemented | Clerk: `updatePassword()` |

---

## 2. Admin Dashboard (`/admin/*`)

### Operations Overview (`/admin`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Summary metrics | `MOCK_ADMIN_RESERVATIONS` (derived) | Aggregation queries on `reservations`, `payments` |
| Active reservations list | `MOCK_ADMIN_RESERVATIONS` | GET `/api/admin/reservations?status=active` |
| Status badges | Mock statuses | `reservations.status` |

---

### Reservations (`/admin/reservations`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Reservation list | `MOCK_ADMIN_RESERVATIONS` | GET `/api/admin/reservations` (paginated) |
| Filters (status, branch, date) | Client filtering | Server-side query params |
| Status transitions | Not implemented | POST `/api/admin/reservations/[id]/transition` |

### Reservation Detail (`/admin/reservations/[id]`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Full reservation | `MOCK_ADMIN_RESERVATIONS` lookup | GET `/api/admin/reservations/[id]` |
| Assign vehicle | Not implemented | POST `/api/admin/reservations/[id]/assign` |
| Cancel reservation | Not implemented | POST `/api/admin/reservations/[id]/cancel` |

---

### Fleet (`/admin/fleet`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Fleet vehicle list | `MOCK_FLEET_VEHICLES` | GET `/api/admin/fleet` (branch-scoped) |
| Vehicle status | `fleetStatus` mock | `vehicles.fleet_status` |
| Odometer, fuel | Mock values | `vehicles.odometer_km`, `vehicles.fuel_level_pct` |

---

### Payments (`/admin/payments`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Payment records | `MOCK_PAYMENTS` | GET `/api/admin/payments` (finance role) |
| Refund action | Not implemented | POST `/api/admin/payments/[id]/refund` |

---

### Inspections (`/admin/inspections`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Inspection list | `MOCK_INSPECTIONS` | GET `/api/admin/inspections` (branch-scoped) |
| Create inspection | Not implemented | POST `/api/admin/inspections` |

---

### Maintenance (`/admin/maintenance`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Maintenance records | `MOCK_MAINTENANCE` | GET `/api/admin/maintenance` |
| Create record | Not implemented | POST `/api/admin/maintenance` |
| Update status | Not implemented | PATCH `/api/admin/maintenance/[id]` |

---

### Customers (`/admin/customers`)

| Frontend Element | Current Source | Future Backend Source |
|---|---|---|
| Customer list | `MOCK_CUSTOMERS` | GET `/api/admin/customers` |
| Customer detail | `MOCK_CUSTOMERS` lookup | GET `/api/admin/customers/[id]` |
| Document review | Not implemented | GET `/api/admin/customers/[id]/documents` |

---

## 3. Authentication Integration Map

| Frontend State | Current Mock State | Future Clerk Integration |
|---|---|---|
| "Signed in" nav | Always signed out UI | `useAuth()` / `<Show when="signed-in">` |
| Sign in | Not implemented | `<SignInButton />` or custom flow |
| Sign up | Not implemented | `<SignUpButton />` or custom flow |
| User button | Not implemented | `<UserButton />` |
| Protected route | Not enforced | Clerk `middleware.ts` → redirect to sign-in |
| Account pages | Always accessible | Protected by middleware |
| Admin pages | Always accessible | Protected by role check in middleware |

---

## 4. Repository Abstraction Strategy

To enable seamless mock → real migration:

```typescript
// Current:
import { MOCK_VEHICLES } from '@/lib/mock/vehicles'
const vehicle = MOCK_VEHICLES.find(v => v.id === id)

// Future pattern — repository interface:
// src/lib/repositories/vehicle-repository.ts
interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>
  findAvailable(criteria: AvailabilityCriteria): Promise<Vehicle[]>
  // ...
}

// Mock implementation (current):
export const mockVehicleRepository: VehicleRepository = {
  findById: (id) => Promise.resolve(MOCK_VEHICLES.find(v => v.id === id) ?? null),
  // ...
}

// Real implementation (future):
export const supabaseVehicleRepository: VehicleRepository = {
  findById: async (id) => {
    const { data } = await supabase.from('vehicles').select('*').eq('id', id).single()
    return data
  },
  // ...
}
```

Components and services import from the repository interface. Swapping mock for real requires only changing which implementation is injected — **no UI changes needed**.
