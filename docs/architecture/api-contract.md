# Veyra API Contract

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document. No endpoints implemented yet.
**Date:** September 2026

All routes are Next.js App Router Route Handlers or Server Actions.
All protected routes require a valid Clerk session. Authorization is checked at the service layer.

---

## 1. Customer: Search & Catalog

### `POST /api/search/availability`
**Purpose:** Find available vehicles for a given pickup window.
**Auth:** Optional (anonymous search supported; authenticated results may show member pricing)

**Input:**
```typescript
{
  pickupLocationId: string   // UUID
  returnLocationId: string   // UUID
  pickupAt: string           // ISO 8601 UTC
  returnAt: string           // ISO 8601 UTC
  category?: VehicleCategory
  minSeats?: number
}
```
**Output:**
```typescript
{
  vehicles: Array<{
    id: string
    make: string
    model: string
    year: number
    // ...specs
    dailyRate: number        // Minor units (centavos)
    currency: string
    available: true
    rentalDays: number       // Computed
    estimatedTotal: number   // Computed server-side
  }>
  pickupLocation: LocationHub
  returnLocation: LocationHub
  rentalDays: number
}
```
**Validation:** Dates in future; return > pickup; minimum 1 day; maximum 90 days
**Side effects:** None
**Idempotency:** Idempotent (read-only)

---

### `GET /api/vehicles/[id]`
**Purpose:** Vehicle detail page data.
**Auth:** None required (public catalog)

**Output:** Full vehicle record + signed photo URLs
**Authorization:** No ownership check; public data
**Side effects:** None

---

### `GET /api/vehicles/[id]/availability`
**Purpose:** Check if a specific vehicle is available for given dates.
**Auth:** None required
**Query params:** `from`, `to` (ISO 8601 UTC)
**Output:** `{ available: boolean, nextAvailableDate?: string }`

---

## 2. Booking Flow

### `POST /api/quotes`
**Purpose:** Create a server-authoritative price quote.
**Auth:** Required (customer)

**Input:**
```typescript
{
  vehicleId: string
  pickupLocationId: string
  returnLocationId: string
  pickupAt: string          // ISO 8601 UTC
  returnAt: string          // ISO 8601 UTC
  selectedExtraIds: string[]
  promotionCode?: string
}
```
**Output:**
```typescript
{
  quoteId: string
  expiresAt: string         // UTC timestamp
  dailyRate: number
  rentalDays: number
  baseRental: number
  extrasSubtotal: number
  discountAmount: number
  taxAmount: number
  totalRental: number       // All in minor units
  securityDeposit: number
  currency: string
  lineItems: QuoteLineItem[]
}
```
**Authorization:** Any authenticated customer
**Side effects:** Creates `quotes` record (immutable after creation)
**Idempotency:** Not required (new quote per call is acceptable)
**Failure cases:** Vehicle not available → 409; Quote expired vehicle → 410; Invalid dates → 422

---

### `POST /api/reservations`
**Purpose:** Create a reservation (hold inventory) from a valid quote.
**Auth:** Required (customer)

**Input:**
```typescript
{
  quoteId: string
  idempotencyKey: string     // Client-generated UUID for safe retry
}
```
**Output:**
```typescript
{
  reservationId: string
  reference: string           // e.g. VYR-8492-CDO
  status: 'held'
  holdExpiresAt: string       // UTC — 15 minutes
  totalAmount: number
  securityDeposit: number
}
```
**Authorization:** Quote must belong to the authenticated customer
**Side effects:**
- Availability check (atomic with FOR UPDATE)
- Quote marked as `converted`
- Reservation created in `held` status
- Inventory effectively blocked for 15 minutes
- Audit event created
**Idempotency:** `idempotencyKey` prevents duplicate reservations
**Failure cases:** Quote not found/expired → 404; Vehicle no longer available → 409; Duplicate key → return existing reservation

---

### `POST /api/reservations/[id]/payment-intent`
**Purpose:** Create a payment intent for the held reservation.
**Auth:** Required (owner customer)

**Input:** `{ paymentMethod: 'card' | 'e_wallet' }`
**Output:** `{ clientKey: string, paymentIntentId: string }`
**Authorization:** Reservation must belong to authenticated customer; status must be `held`
**Side effects:** Creates payment record (pending); creates PayMongo payment intent
**Idempotency:** Idempotency key sent to PayMongo

---

### `POST /api/reservations/[id]/submit-driver`
**Purpose:** Submit primary driver details for a reservation.
**Auth:** Required (owner customer)

**Input:** Driver details (name, license, DOB, etc.)
**Output:** `{ success: true }`
**Authorization:** Reservation belongs to customer
**Validation:** Age ≥ 21; license not expired; required fields present
**Side effects:** Creates/updates `reservation_drivers` record

---

## 3. Customer Account

### `GET /api/account/reservations`
**Auth:** Required
**Query params:** `status`, `page`, `limit`
**Output:** Paginated list of customer's reservations
**Authorization:** Returns ONLY the authenticated customer's reservations

---

### `GET /api/account/reservations/[id]`
**Auth:** Required
**Output:** Full reservation detail
**Authorization:** Reservation must belong to authenticated customer — 403 otherwise

---

### `POST /api/account/reservations/[id]/cancel`
**Auth:** Required (owner customer)
**Output:** `{ success: true, refundAmount?: number }`
**Authorization:** Customer owns reservation; status must be `confirmed`; within cancellation window
**Side effects:** Status → `cancelled`; refund initiated; deposit hold released; audit event

---

### `GET /api/account/documents`
**Auth:** Required
**Output:** Customer's document list (metadata only, no storage paths)
**Authorization:** Own documents only

---

### `POST /api/documents/upload`
**Auth:** Required
**Input:** `FormData` with file + document type
**Output:** `{ documentId: string, status: 'pending_review' }`
**Authorization:** Customer can only upload their own documents
**Validation:** File type, MIME, size checked server-side
**Side effects:** File uploaded to `customer-documents` bucket; `customer_documents` record created; audit event

---

### `GET /api/documents/[id]/view`
**Auth:** Required
**Output:** `{ signedUrl: string, expiresAt: string }`
**Authorization:** Document belongs to customer, or actor has support/admin role
**Side effects:** Audit event created for every signed URL issuance
**TTL:** 15 minutes

---

## 4. Admin Operations

### `GET /api/admin/reservations`
**Auth:** Required (branch_staff+)
**Query params:** `status`, `branchId`, `dateFrom`, `dateTo`, `page`, `limit`
**Authorization:** branch_staff/branch_manager: filtered to own branch; org roles: all

---

### `POST /api/admin/reservations/[id]/transition`
**Auth:** Required (branch_staff+)
**Input:** `{ toStatus: string, notes?: string }`
**Authorization:** Allowed transitions per role per state machine
**Side effects:** Status transition; audit event; notification dispatched

---

### `POST /api/admin/reservations/[id]/assign`
**Auth:** Required (branch_staff+)
**Input:** `{ vehicleId: string }`
**Authorization:** Vehicle must be in actor's branch
**Side effects:** `assigned_vehicle_id` updated; availability check on substitute; audit event

---

### `POST /api/admin/payments/[id]/refund`
**Auth:** Required (finance+)
**Input:** `{ amount: number, reason: string }`
**Authorization:** Finance, admin, or superadmin only
**Validation:** Amount ≤ original payment amount; refund policy check
**Side effects:** Refund created at PayMongo; refund record created; audit event

---

## 5. Webhook Endpoints

### `POST /api/webhooks/paymongo`
**Auth:** Signature verification (PayMongo-Signature header)
**Purpose:** Receive payment lifecycle events from PayMongo
**Processing:** See `docs/architecture/webhooks.md` for full pipeline
**Response:** Always HTTP 200 after persistence (to prevent retry storms)

### `POST /api/webhooks/clerk`
**Auth:** Clerk webhook signature (svix)
**Purpose:** Sync user lifecycle events (created, updated, deleted)
**Side effects:** Creates/updates/soft-deletes `users` and `customers`/`staff_users` records

---

## 6. Common Error Responses

| HTTP Status | Meaning |
|---|---|
| 400 | Invalid request body or parameters |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found (or hidden for security) |
| 409 | Conflict (vehicle unavailable, duplicate key) |
| 410 | Gone (quote expired, reservation expired) |
| 422 | Validation failed (business rule violation) |
| 429 | Rate limit exceeded |
| 500 | Server error (never expose internal details) |

All error responses follow the shape:
```typescript
{ error: string, code?: string, details?: Record<string, string> }
```
