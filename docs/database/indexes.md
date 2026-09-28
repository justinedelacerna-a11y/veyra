# Veyra PostgreSQL Indexing Strategy & Performance Guide

This document specifies the complete indexing strategy for the Veyra PostgreSQL database, detailing B-Tree, GiST, GIN/Trigram, composite, and partial indexes designed to ensure sub-10ms query times and prevent performance degradation under concurrent production load.

---

## 1. Indexing Principles & Postgres Realities

1. **Foreign Keys Are Not Automatically Indexed in Postgres:**
   Every foreign key constraint in Veyra MUST have an explicit supporting index. Unindexed foreign keys cause full table scans and aggressive share locks on referenced tables during updates and deletes.
2. **Partial Indexes for Status-Driven Tables:**
   90% of operational queries inspect active or pending records (e.g., `HELD`, `CONFIRMED`, `ACTIVE`). We use partial indexes (`WHERE status IN (...)`) to keep index sizes minimal, cached in RAM, and lightning-fast.
3. **Range-Overlap Acceleration via GiST:**
   Temporal availability checks cannot rely on standard B-Trees without sequential scan filtering. We use PostgreSQL `btree_gist` extension to index timestamp intervals (`tsrange`).
4. **Trigram Matching for Search:**
   Vehicle catalog search and admin search use `pg_trgm` GIN indexes for fuzzy text matching (`ILIKE '%query%'`) without full table scans.
5. **Zero-Downtime Index Creation:**
   In production migrations, all indexes MUST be created using `CREATE INDEX CONCURRENTLY` to avoid exclusive table locks.

---

## 2. Temporal Availability & Concurrency Indexes (GiST)

### 2.1 Extension Prerequisite
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 2.2 Availability Overlap Exclusion Index
To guarantee that no fleet vehicle is double-booked or simultaneously in maintenance, we index `fleet_vehicle_id` and the reservation interval as a range:
```sql
-- On reservations table
CREATE INDEX idx_reservations_vehicle_interval_gist
ON reservations USING gist (
  fleet_vehicle_id,
  tsrange(start_time, end_time, '[)')
)
WHERE status IN ('HELD', 'PAYMENT_PENDING', 'CONFIRMED', 'PICKUP_READY', 'ACTIVE');

-- On availability_blocks table
CREATE INDEX idx_availability_blocks_vehicle_interval_gist
ON availability_blocks USING gist (
  fleet_vehicle_id,
  tsrange(start_time, end_time, '[)')
);
```
**Impact:** Allows the availability engine to perform overlap queries (`&&` operator) in under 2ms across hundreds of thousands of historical rows.

---

## 3. High-Frequency Query & Partial Indexes

### 3.1 Reservations Table
```sql
-- Fast customer booking history (ordered by date)
CREATE INDEX idx_reservations_customer_created
ON reservations (customer_id, created_at DESC);

-- Fast branch operations lookup for active pickups/returns today
CREATE INDEX idx_reservations_branch_active_dates
ON reservations (pickup_branch_id, start_time)
WHERE status IN ('CONFIRMED', 'PICKUP_READY');

CREATE INDEX idx_reservations_branch_return_dates
ON reservations (return_branch_id, end_time)
WHERE status = 'ACTIVE';

-- Reference number quick lookup (Customer lookup / staff search)
CREATE UNIQUE INDEX idx_reservations_reference_number
ON reservations (reference_number);

-- Expired hold reaper query (used by pg_cron every minute)
CREATE INDEX idx_reservations_stale_holds
ON reservations (hold_expires_at)
WHERE status IN ('HELD', 'PAYMENT_PENDING');
```

### 3.2 Fleet Vehicles Table
```sql
-- Admin fleet listing filtered by branch and operational status
CREATE INDEX idx_fleet_vehicles_branch_status
ON fleet_vehicles (branch_id, status)
WHERE deleted_at IS NULL;

-- Vehicle model category aggregation
CREATE INDEX idx_fleet_vehicles_model_id
ON fleet_vehicles (vehicle_model_id);

-- License plate and VIN lookups
CREATE UNIQUE INDEX idx_fleet_vehicles_plate
ON fleet_vehicles (license_plate);

CREATE UNIQUE INDEX idx_fleet_vehicles_vin
ON fleet_vehicles (vin);
```

### 3.3 Payments & Financial Tables
```sql
-- Payments by reservation lookup
CREATE INDEX idx_payments_reservation_id
ON payments (reservation_id, created_at DESC);

-- Payment reconciliation lookup for unresolved webhooks
CREATE INDEX idx_payments_pending_reconciliation
ON payments (provider_payment_id, created_at)
WHERE status = 'PENDING';

-- Refunds lookup by payment
CREATE INDEX idx_refunds_payment_id
ON refunds (payment_id);

-- Security deposits tracking
CREATE INDEX idx_deposits_reservation_status
ON deposits (reservation_id, status);
```

---

## 4. Full-Text & Trigram Search Indexes (GIN)

### 4.1 Vehicle Catalog Discovery
Customers search by model name, make, or body type:
```sql
-- GIN Trigram index for fuzzy search across make and model
CREATE INDEX idx_vehicles_trgm_search
ON vehicle_models USING gin (
  (make || ' ' || model) gin_trgm_ops
);

-- Catalog filtering by class, transmission, and seat count
CREATE INDEX idx_vehicles_catalog_filters
ON vehicle_models (vehicle_class_id, transmission, seats)
WHERE is_active = TRUE;
```

### 4.2 Admin Customer Search
Staff search customers by name, phone, or email:
```sql
CREATE INDEX idx_customers_search_trgm
ON customers USING gin (
  (first_name || ' ' || last_name || ' ' || email) gin_trgm_ops
);

CREATE INDEX idx_customers_phone
ON customers (phone);
```

---

## 5. Foreign Key Supporting Index Matrix

Every relation listed below must maintain an explicit index to eliminate cascade locks:

| Child Table | Foreign Key Column | Target Index Name |
|---|---|---|
| `users` | `role_id` | `idx_users_role_id` |
| `customers` | `user_id` | `idx_customers_user_id` |
| `drivers` | `customer_id` | `idx_drivers_customer_id` |
| `customer_documents` | `customer_id` | `idx_customer_docs_customer_id` |
| `vehicles` | `vehicle_class_id` | `idx_vehicles_class_id` |
| `fleet_vehicles` | `branch_id` | `idx_fleet_branch_id` |
| `quotes` | `customer_id` | `idx_quotes_customer_id` |
| `quotes` | `vehicle_model_id` | `idx_quotes_vehicle_id` |
| `reservation_items` | `reservation_id` | `idx_res_items_res_id` |
| `reservation_drivers` | `reservation_id` | `idx_res_drivers_res_id` |
| `inspections` | `reservation_id` | `idx_inspections_res_id` |
| `damage_reports` | `fleet_vehicle_id` | `idx_damage_reports_vehicle_id` |
| `maintenance_records` | `fleet_vehicle_id` | `idx_maint_records_vehicle_id` |
| `audit_logs` | `actor_id` | `idx_audit_logs_actor_id` |
| `audit_logs` | `(target_entity, target_id)` | `idx_audit_logs_target` |

---

## 6. Index Maintenance & Monitoring

1. **Unused Index Audits:**
   Quarterly query against `pg_stat_user_indexes` to identify indexes with `idx_scan = 0` and prune redundant entries.
2. **Bloat Prevention:**
   Tables with heavy update/delete churn (`reservations`, `quotes`, `webhook_events`) will experience index bloat. Schedule automated `REINDEX TABLE CONCURRENTLY` during low-traffic windows (03:00 PHT Sundays).
3. **Lock Avoidance Rule:**
   Never run bare `CREATE INDEX` or `DROP INDEX` against live production tables. Always specify `CONCURRENTLY`.
