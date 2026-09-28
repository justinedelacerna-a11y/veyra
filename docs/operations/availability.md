# Veyra Availability Architecture

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document.
**Date:** September 2026

---

## 1. Core Principle

Vehicle availability is **not** a boolean field on the vehicle record.

`vehicle.available = true` is insufficient because:

- It doesn't represent time-bounded availability
- It cannot represent partial-day unavailability
- It is susceptible to race conditions under concurrent bookings
- It cannot distinguish between maintenance, reservation, and cleaning downtime

---

## 2. Availability Model

A vehicle is available for a given `[pickup_at, return_at)` window if and only if **both** of the following are true simultaneously within a single database transaction:

### Condition 1: No conflicting reservations

```sql
-- A vehicle is NOT available if there is an overlapping active reservation
SELECT 1
FROM reservations
WHERE vehicle_id = $vehicle_id
  AND status IN (
    'held',
    'payment_pending',
    'confirmed',
    'pickup_ready',
    'active',
    'return_inspection'
  )
  AND pickup_at < $requested_return_at
  AND return_at > $requested_pickup_at
LIMIT 1;
-- If any rows found → NOT available
```

### Condition 2: No conflicting availability block

```sql
-- A vehicle is NOT available if there is an overlapping block
SELECT 1
FROM availability_blocks
WHERE vehicle_id = $vehicle_id
  AND starts_at < $requested_return_at
  AND ends_at > $requested_pickup_at
LIMIT 1;
-- If any rows found → NOT available
```

Both checks must return zero rows for availability to be confirmed.

---

## 3. Concurrency Strategy — Preventing Double Booking

Availability must be checked and locked **atomically** to prevent two simultaneous requests from both seeing the vehicle as available and both creating reservations.

### Approach: Pessimistic Locking with `SELECT ... FOR UPDATE`

When creating a hold or reservation:

```sql
BEGIN;

-- Lock the vehicle row to prevent concurrent writes
SELECT id FROM vehicles
WHERE id = $vehicle_id
FOR UPDATE;

-- Check for conflicting reservations (within same transaction)
SELECT 1 FROM reservations
WHERE vehicle_id = $vehicle_id
  AND status IN ('held','payment_pending','confirmed','pickup_ready','active','return_inspection')
  AND pickup_at < $return_at
  AND return_at > $pickup_at
LIMIT 1;

-- If conflict found: ROLLBACK, return HTTP 409
-- If no conflict: insert reservation in 'held' status

INSERT INTO reservations (...) VALUES (...);

COMMIT;
```

**Why `FOR UPDATE` on vehicles:**
- Locks the row for the duration of the transaction
- Any concurrent transaction attempting `FOR UPDATE` on the same vehicle ID will block until the first commits or rolls back
- Guarantees that two concurrent requests cannot both see "no conflict" and both insert

### Alternative for High Throughput: Unique Partial Index

For a future optimization at scale, a unique partial index could prevent double-booking at the database constraint level:

```sql
-- This is a design note only — do not implement yet
-- A unique constraint on (vehicle_id, pickup_date) for active reservations
-- would provide database-level double-booking prevention
-- but requires careful implementation for range overlaps
```

The `SELECT FOR UPDATE` approach is correct and safe for Veyra's expected launch volume.

---

## 4. Availability Search Algorithm

When a customer searches for available vehicles:

```
1. Parse: pickup_location, return_location, pickup_at, return_at
2. Validate: dates are in the future, return > pickup
3. Query: vehicles at pickup branch with fleet_status IN ('available', 'reserved')
   -- 'reserved' vehicles may return before the new pickup window
4. For each candidate vehicle:
   a. Check no overlapping active reservations
   b. Check no overlapping availability_blocks
5. Apply additional filters: category, seats, fuel_type, etc.
6. Compute pricing for each result (server-side)
7. Return filtered, priced, sorted list
```

**Performance note:** The overlap query is indexed on `(vehicle_id, pickup_at, return_at)`. For the catalog search, the query is also filtered by `branch_id` (pickup location's branch) first to reduce the candidate set.

---

## 5. Hold TTL

When a customer confirms a quote (before payment), a hold is created:

- Hold duration: **15 minutes**
- During the hold, the vehicle is treated as unavailable for new searches
- If payment is not initiated within 15 minutes, a background cron releases the hold
- The hold is represented by the reservation record with `status = 'held'`
- No separate "hold" table is needed — the reservation row itself is the hold

---

## 6. Timezone Handling for Availability Windows

All availability timestamps are stored in **UTC** in the database.

Conversion rules:

```
Customer-facing display:   branch.timezone (e.g. 'Asia/Manila')
Search input:              Treat as branch local time, convert to UTC server-side
Database storage:          Always UTC (TIMESTAMPTZ)
Availability checks:       UTC comparisons only
```

Pickup and return windows:

```
Pickup at: 2026-10-15 10:00 AM Asia/Manila
UTC:        2026-10-15 02:00:00+00

Return at: 2026-10-18 05:00 PM Asia/Manila
UTC:        2026-10-18 09:00:00+00
```

The server is responsible for all timezone conversions. The client sends local time with timezone context; the server converts before storage.

---

## 7. Availability Block Types

| Block Type | When Created | Created By |
|---|---|---|
| `maintenance` | Scheduled or urgent vehicle maintenance | fleet_manager, admin |
| `hold` | Manual temporary hold | branch_manager, admin |
| `cleaning` | Post-rental deep clean period | branch_staff, system |
| `recall` | Manufacturer recall | fleet_manager, admin |
| `other` | Custom operational reason | admin |

Blocks are soft — they can be deleted if mistakenly created. Deletion is audited.

---

## 8. Partial Day Availability

Veyra currently uses full-day rental windows (pickup time to return time). The availability algorithm correctly handles sub-day granularity through timestamp comparison.

Example: A vehicle is returned at 10:00 AM. It has a 2-hour cleaning block (10:00–12:00). A new pickup at 12:30 PM is valid.

The `TIMESTAMPTZ` comparisons handle this automatically. No special day-boundary logic is needed.

---

## 9. Rollback on Payment Failure

If `payment_pending → payment_failed`:

1. Webhook received from PayMongo
2. Transaction started
3. Reservation status updated to `payment_failed`
4. Vehicle fleet_status reverted to `available` (if applicable)
5. No availability block exists to remove — the reservation itself was the blocker
6. Future availability checks on this vehicle now return no conflict
7. Audit event created
8. Customer notified

---

## 10. Assigned Vehicle vs Requested Vehicle

The reservation has two vehicle references:

- `vehicle_id` — the vehicle the customer specifically selected (always present)
- `assigned_vehicle_id` — the actual vehicle staff have confirmed will be used (set at `pickup_ready` stage)

For same-vehicle fleets (specific model guaranteed), these will be the same. The architecture supports the case where a vehicle of the same model and specification is substituted in exceptional circumstances (mechanical failure). This requires an admin override and creates an audit entry with justification.

**Availability is checked against `vehicle_id` at hold creation time.** If `assigned_vehicle_id` differs, the staff must verify the substitute vehicle is also available.
