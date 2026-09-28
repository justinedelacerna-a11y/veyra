# Veyra Database Schema Design

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document. No tables have been created yet.
**Date:** September 2026

All amounts are stored in **minor units** (centavos). Currency is stored alongside.
All timestamps are stored as `TIMESTAMPTZ` in UTC.

---

## Schema Conventions

- Primary keys: `uuid` generated with `gen_random_uuid()`
- Timestamps: `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Soft deletes: `deleted_at TIMESTAMPTZ` (nullable — null means active)
- All status fields: `TEXT` with a `CHECK` constraint on allowed values
- All monetary fields: `BIGINT` (minor units, e.g. centavos)
- Foreign keys: always explicit with `ON DELETE` behavior noted

---

## 1. Identity & Users

### `users`
Maps Clerk identities to application users.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | gen_random_uuid() |
| `clerk_id` | TEXT UNIQUE | No | Clerk user_id (e.g. user_xxx) |
| `email` | TEXT UNIQUE | No | Synced from Clerk via webhook |
| `email_verified` | BOOLEAN | No | DEFAULT false |
| `user_type` | TEXT | No | CHECK IN ('customer', 'staff') |
| `status` | TEXT | No | CHECK IN ('active', 'suspended', 'deleted') |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |
| `deleted_at` | TIMESTAMPTZ | Yes | Soft delete |

**Indexes:** `clerk_id`, `email`

---

### `customers`
Customer-specific profile. One-to-one with `users` where `user_type = 'customer'`.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `user_id` | UUID FK → users.id | No | ON DELETE CASCADE |
| `first_name` | TEXT | No | |
| `last_name` | TEXT | No | |
| `phone` | TEXT | Yes | E.164 format |
| `phone_verified` | BOOLEAN | No | DEFAULT false |
| `date_of_birth` | DATE | Yes | For age validation |
| `preferred_hub_id` | UUID FK → locations.id | Yes | |
| `membership_tier` | TEXT | No | CHECK IN ('standard', 'preferred', 'elite') DEFAULT 'standard' |
| `membership_number` | TEXT UNIQUE | No | Generated on creation |
| `total_rentals` | INT | No | DEFAULT 0 — denormalized counter |
| `verification_status` | TEXT | No | CHECK IN ('unverified', 'pending', 'verified', 'rejected') |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Indexes:** `user_id`, `membership_number`

---

### `staff_users`
Staff profile. One-to-one with `users` where `user_type = 'staff'`.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `user_id` | UUID FK → users.id | No | ON DELETE CASCADE |
| `first_name` | TEXT | No | |
| `last_name` | TEXT | No | |
| `employee_id` | TEXT UNIQUE | No | Internal identifier |
| `role` | TEXT | No | CHECK IN ('branch_staff','branch_manager','fleet_manager','support','finance','admin','superadmin') |
| `branch_id` | UUID FK → branches.id | Yes | NULL = not branch-scoped |
| `status` | TEXT | No | CHECK IN ('active', 'inactive', 'suspended') |
| `joined_date` | DATE | No | |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Indexes:** `user_id`, `branch_id`, `role`

---

## 2. Branches & Locations

### `branches`
Veyra operational offices (may span multiple hub locations).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `name` | TEXT | No | |
| `city` | TEXT | No | |
| `timezone` | TEXT | No | IANA timezone (e.g. 'Asia/Manila') |
| `contact_phone` | TEXT | Yes | |
| `contact_email` | TEXT | Yes | |
| `status` | TEXT | No | CHECK IN ('active', 'inactive') |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

---

### `locations`
Physical pickup/return hubs. A branch may have multiple locations.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `branch_id` | UUID FK → branches.id | No | ON DELETE RESTRICT |
| `name` | TEXT | No | |
| `type` | TEXT | No | CHECK IN ('airport_terminal', 'city_center', 'private_hub') |
| `address` | TEXT | No | |
| `city` | TEXT | No | |
| `operating_hours` | TEXT | No | Human-readable; structured hours in separate table later |
| `pickup_available` | BOOLEAN | No | DEFAULT true |
| `return_available` | BOOLEAN | No | DEFAULT true |
| `timezone` | TEXT | No | IANA timezone |
| `status` | TEXT | No | CHECK IN ('active', 'inactive') |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Indexes:** `branch_id`, `status`

---

## 3. Fleet

### `vehicle_classes`
Logical groupings of similar vehicles (e.g., Executive Sedan, Luxury SUV).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `name` | TEXT UNIQUE | No | e.g. 'Executive Sedan' |
| `category` | TEXT | No | CHECK IN ('sedan','suv','electric','van','luxury','touring') |
| `base_daily_rate` | BIGINT | No | Centavos; overridden per vehicle |
| `description` | TEXT | Yes | |
| `sort_order` | INT | No | DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

---

### `vehicles`
Individual physical vehicles in the fleet.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `vehicle_class_id` | UUID FK → vehicle_classes.id | No | |
| `branch_id` | UUID FK → branches.id | No | Home branch |
| `make` | TEXT | No | e.g. 'Porsche' |
| `model` | TEXT | No | e.g. 'Taycan 4S Cross Turismo' |
| `year` | SMALLINT | No | |
| `plate_number` | TEXT UNIQUE | No | |
| `vin` | TEXT UNIQUE | No | 17-char VIN |
| `color` | TEXT | Yes | |
| `transmission` | TEXT | No | CHECK IN ('automatic', 'manual') |
| `fuel_type` | TEXT | No | CHECK IN ('petrol','diesel','electric','hybrid') |
| `seats` | SMALLINT | No | |
| `luggage_capacity` | SMALLINT | No | Number of large bags |
| `doors` | SMALLINT | Yes | |
| `daily_rate` | BIGINT | No | Centavos; overrides vehicle_class default |
| `currency` | CHAR(3) | No | DEFAULT 'PHP' |
| `security_deposit` | BIGINT | No | Centavos |
| `mileage_allowance_km` | INT | Yes | Per-day allowance |
| `excess_mileage_rate` | BIGINT | Yes | Centavos per km over allowance |
| `fleet_status` | TEXT | No | CHECK IN ('available','reserved','rented','inspection','maintenance','inactive','retired') |
| `condition` | TEXT | No | CHECK IN ('excellent','good','fair','poor') |
| `odometer_km` | INT | No | DEFAULT 0 |
| `fuel_level_pct` | SMALLINT | No | 0–100 |
| `last_inspection_date` | DATE | Yes | |
| `next_maintenance_due` | DATE | Yes | |
| `next_maintenance_odometer` | INT | Yes | |
| `acquisition_date` | DATE | No | |
| `internal_notes` | TEXT | Yes | |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |
| `deleted_at` | TIMESTAMPTZ | Yes | Soft retire |

**Indexes:** `branch_id`, `fleet_status`, `vehicle_class_id`, `plate_number`
**Security Notice:** Raw `vehicles` table is NEVER exposed to `anon` or general customers. Access is restricted to authorized staff/admin roles. Public catalog queries MUST use the `vehicle_catalog` view.

---

### `vehicle_catalog` (Public Secure View)
Public customer-facing vehicle view projecting only safe specification and pricing attributes. Excludes internal fleet fields (`vin`, `plate_number`, `internal_notes`, `odometer_km`, `acquisition_date`, maintenance schedules).

| Column | Type | Nullable | Source |
|---|---|---|---|
| `id` | UUID | No | `vehicles.id` |
| `vehicle_class_id` | UUID | No | `vehicles.vehicle_class_id` |
| `branch_id` | UUID | No | `vehicles.branch_id` |
| `make` | TEXT | No | `vehicles.make` |
| `model` | TEXT | No | `vehicles.model` |
| `year` | SMALLINT | No | `vehicles.year` |
| `color` | TEXT | Yes | `vehicles.color` |
| `transmission` | TEXT | No | `vehicles.transmission` |
| `fuel_type` | TEXT | No | `vehicles.fuel_type` |
| `seats` | SMALLINT | No | `vehicles.seats` |
| `luggage_capacity` | SMALLINT | No | `vehicles.luggage_capacity` |
| `doors` | SMALLINT | Yes | `vehicles.doors` |
| `daily_rate` | BIGINT | No | `vehicles.daily_rate` |
| `currency` | CHAR(3) | No | `vehicles.currency` |
| `security_deposit` | BIGINT | No | `vehicles.security_deposit` |
| `mileage_allowance_km` | INT | Yes | `vehicles.mileage_allowance_km` |
| `excess_mileage_rate` | BIGINT | Yes | `vehicles.excess_mileage_rate` |
| `fleet_status` | TEXT | No | `vehicles.fleet_status` |
| `created_at` | TIMESTAMPTZ | No | `vehicles.created_at` |

**Security Grant:** `GRANT SELECT ON public.vehicle_catalog TO anon, authenticated;`

---

### `vehicle_features`
Many-to-many: features per vehicle.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `vehicle_id` | UUID FK → vehicles.id | No | ON DELETE CASCADE |
| `feature` | TEXT | No | e.g. 'All-Wheel Drive' |

**Index:** `vehicle_id`

---

### `vehicle_photos`
Photos associated with a vehicle. Marketing photos are public; inspection photos are private.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `vehicle_id` | UUID FK → vehicles.id | No | ON DELETE CASCADE |
| `storage_path` | TEXT | No | Supabase Storage path |
| `bucket` | TEXT | No | 'vehicles-public' or 'vehicles-private' |
| `type` | TEXT | No | CHECK IN ('marketing','inspection','damage') |
| `sort_order` | INT | No | DEFAULT 0 |
| `uploaded_by` | UUID FK → users.id | No | |
| `created_at` | TIMESTAMPTZ | No | |

**Index:** `vehicle_id`, `type`

---

## 4. Availability

### `availability_blocks`
Explicit availability overrides (maintenance, holds, closures).
Reservation-based availability is derived from the `reservations` table.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `vehicle_id` | UUID FK → vehicles.id | No | |
| `type` | TEXT | No | CHECK IN ('maintenance','hold','cleaning','recall','other') |
| `starts_at` | TIMESTAMPTZ | No | UTC |
| `ends_at` | TIMESTAMPTZ | No | UTC |
| `reason` | TEXT | Yes | |
| `created_by` | UUID FK → users.id | No | Staff who created the block |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Indexes:** `vehicle_id`, `(starts_at, ends_at)` — critical for overlap queries

---

## 5. Extras & Pricing

### `extras`
Add-on products available during booking (protection, convenience, equipment).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `name` | TEXT | No | e.g. 'Full Protection Waiver' |
| `slug` | TEXT UNIQUE | No | e.g. 'full-protection-waiver' |
| `description` | TEXT | No | |
| `category` | TEXT | No | CHECK IN ('protection','convenience','equipment','mileage') |
| `daily_rate` | BIGINT | No | Centavos |
| `currency` | CHAR(3) | No | DEFAULT 'PHP' |
| `is_active` | BOOLEAN | No | DEFAULT true |
| `sort_order` | INT | No | DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

---

### `rate_plans`
Named rate configurations applied to vehicle classes (e.g., weekend rates, long-term rates).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `name` | TEXT | No | |
| `vehicle_class_id` | UUID FK → vehicle_classes.id | Yes | NULL = applies to all |
| `min_days` | SMALLINT | No | Minimum rental duration |
| `max_days` | SMALLINT | Yes | NULL = no upper limit |
| `daily_rate_override` | BIGINT | Yes | Centavos; NULL = use vehicle rate |
| `discount_pct` | NUMERIC(5,2) | Yes | 0.00–100.00 |
| `valid_from` | DATE | Yes | |
| `valid_to` | DATE | Yes | |
| `is_active` | BOOLEAN | No | DEFAULT true |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

---

## 6. Quotes

### `quotes`
Price snapshot presented to customer before reservation confirmation.
Quotes are immutable after creation.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `customer_id` | UUID FK → customers.id | No | |
| `vehicle_id` | UUID FK → vehicles.id | No | |
| `pickup_location_id` | UUID FK → locations.id | No | |
| `return_location_id` | UUID FK → locations.id | No | |
| `pickup_at` | TIMESTAMPTZ | No | UTC |
| `return_at` | TIMESTAMPTZ | No | UTC |
| `rental_days` | SMALLINT | No | Computed |
| `daily_rate` | BIGINT | No | Centavos — rate at time of quote |
| `base_rental` | BIGINT | No | Centavos |
| `extras_subtotal` | BIGINT | No | Centavos |
| `discount_amount` | BIGINT | No | DEFAULT 0 |
| `tax_amount` | BIGINT | No | DEFAULT 0 |
| `subtotal` | BIGINT | No | Centavos |
| `total_rental` | BIGINT | No | Centavos |
| `security_deposit` | BIGINT | No | Centavos |
| `currency` | CHAR(3) | No | DEFAULT 'PHP' |
| `pricing_version` | TEXT | No | Hash or version tag of pricing rules |
| `status` | TEXT | No | CHECK IN ('active','expired','converted','cancelled') |
| `expires_at` | TIMESTAMPTZ | No | Typically 30 min after creation |
| `created_at` | TIMESTAMPTZ | No | |

**Indexes:** `customer_id`, `vehicle_id`, `status`, `expires_at`

---

### `quote_extras`
Line items for extras included in a quote.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `quote_id` | UUID FK → quotes.id | No | ON DELETE CASCADE |
| `extra_id` | UUID FK → extras.id | No | |
| `extra_name` | TEXT | No | Snapshot at time of quote |
| `daily_rate` | BIGINT | No | Centavos — snapshot |
| `total` | BIGINT | No | Centavos |

---

## 7. Reservations

### `reservations`
Core booking record. References a quote snapshot for pricing integrity.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `reference` | TEXT UNIQUE | No | Human-readable: VYR-XXXX-YYYY |
| `customer_id` | UUID FK → customers.id | No | |
| `quote_id` | UUID FK → quotes.id | No | Immutable pricing snapshot |
| `vehicle_id` | UUID FK → vehicles.id | No | Specific physical fleet vehicle selected by customer. Availability is locked against this ID at hold creation time. |
| `assigned_vehicle_id` | UUID FK → vehicles.id | Yes | Actual physical vehicle confirmed by staff at handover. May differ from vehicle_id in exceptional audited substitution cases. |
| `pickup_location_id` | UUID FK → locations.id | No | |
| `return_location_id` | UUID FK → locations.id | No | |
| `pickup_at` | TIMESTAMPTZ | No | UTC (inclusive start) |
| `return_at` | TIMESTAMPTZ | No | UTC (exclusive end, half-open [) interval) |
| `actual_pickup_at` | TIMESTAMPTZ | Yes | Set by staff at handover |
| `actual_return_at` | TIMESTAMPTZ | Yes | Set by staff on return |
| `rental_days` | SMALLINT | No | From quote |
| `hold_expires_at` | TIMESTAMPTZ | Yes | TTL for held/quote_created/payment_pending states; cron reaper query target |
| `status` | TEXT | No | CHECK IN ('draft','quote_created','held','payment_pending','confirmed','pickup_ready','active','return_inspection','completed','expired','payment_failed','cancelled','no_show','disputed') |
| `payment_status` | TEXT | No | CHECK IN ('pending','authorized','captured','failed','refunded','partially_refunded') |
| `payment_method` | TEXT | Yes | CHECK IN ('card','e_wallet','counter','bank_transfer') |
| `total_amount` | BIGINT | No | Centavos — from quote |
| `deposit_amount` | BIGINT | No | Centavos — from quote |
| `currency` | CHAR(3) | No | DEFAULT 'PHP' |
| `internal_notes` | TEXT | Yes | Staff-only |
| `cancellation_reason` | TEXT | Yes | |
| `idempotency_key` | TEXT UNIQUE | Yes | For safe duplicate submission |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Indexes:** `customer_id`, `vehicle_id`, `status`, `pickup_at`, `return_at`, `reference`, `hold_expires_at` (partial)
**Critical overlap indexes:**
- `(vehicle_id, pickup_at, return_at)` partial B-tree — for B-tree range queries
- `USING gist (vehicle_id, tsrange(pickup_at, return_at, '[)'))` partial GiST — for `&&` range overlap operator queries

---

### `reservation_extras`
Snapshot of extras selected for this reservation. References both the live extra and preserves the quote pricing.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `reservation_id` | UUID FK → reservations.id | No | ON DELETE CASCADE |
| `extra_id` | UUID FK → extras.id | No | |
| `extra_name` | TEXT | No | Snapshot |
| `daily_rate` | BIGINT | No | Centavos — snapshot |
| `total` | BIGINT | No | Centavos |

---

### `reservation_drivers`
Additional authorized drivers on a reservation.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `reservation_id` | UUID FK → reservations.id | No | ON DELETE CASCADE |
| `first_name` | TEXT | No | |
| `last_name` | TEXT | No | |
| `email` | TEXT | Yes | |
| `phone` | TEXT | Yes | |
| `date_of_birth` | DATE | No | |
| `license_number` | TEXT | No | |
| `license_country` | CHAR(2) | No | ISO 3166-1 alpha-2 |
| `license_expiry` | DATE | Yes | |
| `is_primary` | BOOLEAN | No | DEFAULT false |
| `created_at` | TIMESTAMPTZ | No | |

**Index:** `reservation_id`

---

## 8. Payments

### `payments`
Payment transactions associated with reservations.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `reservation_id` | UUID FK → reservations.id | No | |
| `customer_id` | UUID FK → customers.id | No | |
| `type` | TEXT | No | CHECK IN ('rental','deposit','extra_charge','late_fee') |
| `amount` | BIGINT | No | Centavos |
| `currency` | CHAR(3) | No | DEFAULT 'PHP' |
| `status` | TEXT | No | CHECK IN ('pending','authorized','captured','failed','refunded','partially_refunded') |
| `method` | TEXT | Yes | CHECK IN ('card','e_wallet','counter','bank_transfer') |
| `provider` | TEXT | Yes | e.g. 'paymongo' |
| `provider_payment_id` | TEXT | Yes | PayMongo intent ID |
| `provider_txn_ref` | TEXT | Yes | Payment reference |
| `idempotency_key` | TEXT UNIQUE | Yes | |
| `failure_reason` | TEXT | Yes | |
| `notes` | TEXT | Yes | Internal |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Indexes:** `reservation_id`, `customer_id`, `status`, `provider_payment_id`

---

### `refunds`
Refund records linked to payments.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `payment_id` | UUID FK → payments.id | No | |
| `reservation_id` | UUID FK → reservations.id | No | |
| `amount` | BIGINT | No | Centavos |
| `currency` | CHAR(3) | No | DEFAULT 'PHP' |
| `status` | TEXT | No | CHECK IN ('pending','processing','completed','failed') |
| `reason` | TEXT | No | |
| `provider_refund_id` | TEXT | Yes | |
| `idempotency_key` | TEXT UNIQUE | Yes | |
| `initiated_by` | UUID FK → users.id | No | Staff who triggered |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

---

### `deposits`
Security deposit tracking (typically an authorization hold).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `reservation_id` | UUID FK → reservations.id | No | UNIQUE |
| `amount` | BIGINT | No | Centavos |
| `currency` | CHAR(3) | No | DEFAULT 'PHP' |
| `status` | TEXT | No | CHECK IN ('pending','authorized','held','released','forfeited','partial_release') |
| `provider_hold_id` | TEXT | Yes | |
| `authorized_at` | TIMESTAMPTZ | Yes | |
| `released_at` | TIMESTAMPTZ | Yes | |
| `forfeited_amount` | BIGINT | Yes | If damage charges applied |
| `release_notes` | TEXT | Yes | |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

---

## 9. Documents

### `customer_documents`
Identity and verification documents uploaded by customers.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `customer_id` | UUID FK → customers.id | No | |
| `type` | TEXT | No | CHECK IN ('driver_license','government_id','address_proof','passport') |
| `storage_path` | TEXT | No | Supabase Storage private path |
| `original_filename` | TEXT | No | |
| `mime_type` | TEXT | No | Server-validated |
| `file_size_bytes` | INT | No | |
| `status` | TEXT | No | CHECK IN ('pending_review','approved','rejected','expired') |
| `rejection_reason` | TEXT | Yes | |
| `expires_at` | DATE | Yes | Document expiry |
| `reviewed_by` | UUID FK → users.id | Yes | Staff reviewer |
| `reviewed_at` | TIMESTAMPTZ | Yes | |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Indexes:** `customer_id`, `type`, `status`

---

## 10. Inspections

### `inspections`
Pre-pickup and post-return vehicle inspection records.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `reservation_id` | UUID FK → reservations.id | No | |
| `vehicle_id` | UUID FK → vehicles.id | No | |
| `type` | TEXT | No | CHECK IN ('pickup','return') |
| `inspector_id` | UUID FK → users.id | No | Staff who performed inspection |
| `customer_present` | BOOLEAN | No | |
| `odometer_km` | INT | No | |
| `fuel_level_pct` | SMALLINT | No | 0–100 |
| `overall_status` | TEXT | No | CHECK IN ('pass','fail','noted') |
| `damage_status` | TEXT | No | CHECK IN ('no_damage','existing_noted','new_damage','needs_review','charge_proposed','resolved') |
| `notes` | TEXT | Yes | |
| `customer_signature` | BOOLEAN | No | DEFAULT false |
| `completed_at` | TIMESTAMPTZ | No | |
| `created_at` | TIMESTAMPTZ | No | |

**Index:** `reservation_id`, `type`, `vehicle_id`

---

### `inspection_check_items`
Individual checklist items for each inspection.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `inspection_id` | UUID FK → inspections.id | No | ON DELETE CASCADE |
| `area` | TEXT | No | e.g. 'Front Bumper', 'Driver Door' |
| `status` | TEXT | No | CHECK IN ('pass','fail','noted') |
| `notes` | TEXT | Yes | |

---

### `damage_reports`
Damage findings attached to inspections.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `inspection_id` | UUID FK → inspections.id | No | |
| `reservation_id` | UUID FK → reservations.id | No | |
| `vehicle_id` | UUID FK → vehicles.id | No | |
| `area` | TEXT | No | |
| `description` | TEXT | No | |
| `severity` | TEXT | No | CHECK IN ('minor','moderate','major') |
| `pre_existing` | BOOLEAN | No | |
| `charge_amount` | BIGINT | Yes | Centavos |
| `status` | TEXT | No | CHECK IN ('reported','assessed','charged','waived','disputed') |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

---

## 11. Maintenance

### `maintenance_records`
Scheduled and completed maintenance events per vehicle.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `vehicle_id` | UUID FK → vehicles.id | No | |
| `branch_id` | UUID FK → branches.id | No | |
| `type` | TEXT | No | CHECK IN ('routine_service','brake_service','tire_replacement','oil_change','battery_check','ac_service','electrical','bodywork','recall') |
| `status` | TEXT | No | CHECK IN ('scheduled','due','in_progress','completed','overdue') |
| `priority` | TEXT | No | CHECK IN ('low','normal','high','urgent') |
| `scheduled_date` | DATE | No | |
| `completed_date` | DATE | Yes | |
| `odometer_at_service` | INT | Yes | |
| `estimated_cost` | BIGINT | Yes | Centavos |
| `actual_cost` | BIGINT | Yes | Centavos |
| `currency` | CHAR(3) | No | DEFAULT 'PHP' |
| `provider` | TEXT | Yes | Service shop |
| `notes` | TEXT | Yes | |
| `created_by` | UUID FK → users.id | No | |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Indexes:** `vehicle_id`, `status`, `scheduled_date`

---

## 12. Webhooks

### `webhook_events`
Inbound webhook events from external providers (PayMongo, Clerk).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `provider` | TEXT | No | CHECK IN ('paymongo','clerk') |
| `event_type` | TEXT | No | e.g. 'payment.paid', 'user.created' |
| `provider_event_id` | TEXT | No | Provider-issued unique event ID |
| `payload` | JSONB | No | Raw event body |
| `status` | TEXT | No | CHECK IN ('received','processing','processed','failed','ignored') |
| `processed_at` | TIMESTAMPTZ | Yes | |
| `failure_reason` | TEXT | Yes | |
| `retry_count` | SMALLINT | No | DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

**Unique constraint:** `(provider, provider_event_id)` — deduplication key
**Index:** `provider`, `status`, `event_type`

---

## 13. Audit

### `audit_events`
Immutable log of all business-significant actions.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `actor_id` | UUID FK → users.id | No | Who performed the action |
| `actor_role` | TEXT | No | Snapshot of role at time of action |
| `action` | TEXT | No | e.g. 'reservation.status_changed' |
| `resource_type` | TEXT | No | e.g. 'reservation' |
| `resource_id` | TEXT | No | UUID of affected resource |
| `result` | TEXT | No | CHECK IN ('success', 'failure') |
| `details` | TEXT | No | Human-readable summary |
| `before_state` | JSONB | Yes | Relevant fields before change |
| `after_state` | JSONB | Yes | Relevant fields after change |
| `ip_address` | INET | Yes | Requestor IP (server-recorded) |
| `user_agent` | TEXT | Yes | |
| `created_at` | TIMESTAMPTZ | No | |

**Append-only. No UPDATE or DELETE on this table.**
**Indexes:** `actor_id`, `action`, `resource_type`, `resource_id`, `created_at`

---

## 14. Notifications

### `notification_queue`
Outbound notifications to be dispatched by the notification worker.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID PK | No | |
| `user_id` | UUID FK → users.id | No | |
| `channel` | TEXT | No | CHECK IN ('email','sms','in_app','push') |
| `event_type` | TEXT | No | e.g. 'reservation.confirmed' |
| `template_id` | TEXT | No | Template reference |
| `payload` | JSONB | No | Template variables |
| `status` | TEXT | No | CHECK IN ('pending','sent','failed','skipped') |
| `sent_at` | TIMESTAMPTZ | Yes | |
| `failure_reason` | TEXT | Yes | |
| `retry_count` | SMALLINT | No | DEFAULT 0 |
| `scheduled_for` | TIMESTAMPTZ | No | DEFAULT NOW() |
| `created_at` | TIMESTAMPTZ | No | |

**Indexes:** `user_id`, `status`, `scheduled_for`

---

## Summary: Table Count

| Domain | Tables |
|---|---|
| Identity & Users | users, customers, staff_users |
| Branches & Locations | branches, locations |
| Fleet | vehicle_classes, vehicles, vehicle_features, vehicle_photos |
| Availability | availability_blocks |
| Extras & Pricing | extras, rate_plans |
| Quotes | quotes, quote_extras |
| Reservations | reservations, reservation_extras, reservation_drivers |
| Payments | payments, refunds, deposits |
| Documents | customer_documents |
| Inspections | inspections, inspection_check_items, damage_reports |
| Maintenance | maintenance_records |
| Webhooks | webhook_events |
| Audit | audit_events |
| Notifications | notification_queue |
| **Total** | **~27 tables** |
