# Veyra Implemented Database Schema

**Phase:** Phase 8 — Database Security Gate + Declarative Schema Implementation  
**Status:** IMPLEMENTED in `supabase/schemas/*.sql`  
**Date:** September 2026  
**Diff Engine:** pg-delta (declarative schema workflow via `config.toml`)  

---

## 1. Schema Files Structure

The database is declared across 19 modular SQL files executed in alphabetical order:

| File | Module | Description | Tables / Objects |
|---|---|---|---|
| `00_extensions.sql` | Extensions & Schemas | PostgreSQL extensions and private helper schema | `pgcrypto`, `btree_gist`, `pg_trgm`, `veyra_private` schema |
| `01_identity.sql` | Identity & Users | Clerk mapping and user profiles | `users`, `customers`, `staff_users` |
| `02_branches.sql` | Fleet Hubs | Operational branches and pickup locations | `branches`, `locations` |
| `03_fleet.sql` | Fleet Management | Fleet inventory and vehicle specs | `vehicle_classes`, `vehicles`, `vehicle_features`, `vehicle_photos` |
| `04_availability.sql` | Availability | Explicit maintenance and operational blocks | `availability_blocks` (GiST indexed) |
| `05_extras_pricing.sql` | Pricing Configuration | Add-on products and duration-based rate plans | `extras`, `rate_plans` |
| `06_quotes.sql` | Quotes & Pricing | Immutable pricing snapshots before booking | `quotes`, `quote_extras` |
| `07_reservations.sql` | Booking State Machine | Core booking engine and driver records | `reservations`, `reservation_extras`, `reservation_drivers` |
| `08_payments.sql` | Financial Operations | Payment transactions, refunds, and security deposits | `payments`, `refunds`, `deposits` |
| `09_documents.sql` | Customer Verification | License and ID document storage metadata | `customer_documents` |
| `10_inspections.sql` | Vehicle Condition | Pre/post rental check items and damage reports | `inspections`, `inspection_check_items`, `damage_reports` |
| `11_maintenance.sql` | Fleet Health | Maintenance logs and service tracking | `maintenance_records` |
| `12_webhooks.sql` | Integration Ingestion | Idempotent webhook event ledger (PayMongo, Clerk) | `webhook_events` |
| `13_audit.sql` | Compliance Audit | Tamper-evident append-only operational audit log | `audit_events` |
| `14_notifications.sql` | Outbox Queue | Background transactional notification dispatch | `notification_queue` |
| `15_private_functions.sql` | Private RLS Helpers | `SECURITY DEFINER` functions in `veyra_private` | 7 helper functions |
| `16_triggers.sql` | Triggers & Integrity | `updated_at` automation & column-level protection | 16 update triggers + 2 security integrity triggers |
| `17_rls.sql` | Row-Level Security | Defense-in-depth authorization matrix | 28 tables RLS enabled + explicit revoke statements |
| `18_public_catalog.sql` | Public Catalog View | Customer-safe vehicle projection view | `public.vehicle_catalog` view |

---

## 2. Quantitative Summary

- **Total Public Tables:** 28
- **Total Public Views:** 1 (`public.vehicle_catalog`)
- **Total Private Schemas:** 1 (`veyra_private`)
- **Total Extensions:** 3 (`pgcrypto`, `btree_gist`, `pg_trgm`)
- **Total RLS Policies:** 42 active policies covering all public tables
- **Total Triggers:** 18 triggers (16 `updated_at`, 2 column-level protection)
- **Primary Monetary Type:** `BIGINT` (minor units / centavos) with explicit `CHAR(3) DEFAULT 'PHP'`
- **Timestamp Strategy:** `TIMESTAMPTZ` in UTC throughout

---

## 3. Key Architectural Implementations

### 3.1 Public Vehicle Data Isolation
- Raw `public.vehicles` contains internal fleet fields (`vin`, `plate_number`, `internal_notes`, `odometer_km`, `acquisition_date`, `next_maintenance_due`).
- Raw `public.vehicles` has **NO SELECT policy for `anon` or general customers**.
- Anonymous and customer queries access `public.vehicle_catalog`, which projects only customer-safe marketing and specification fields.

### 3.2 Vehicle Model Distinction
- `reservations.vehicle_id` (FK → `public.vehicles`): The specific physical fleet vehicle chosen by the customer. Availability is locked against this ID at hold creation time.
- `reservations.assigned_vehicle_id` (FK → `public.vehicles`): The actual physical vehicle confirmed by branch staff at vehicle handover. Defaults to `vehicle_id`, but may differ in audited substitution events (e.g. unexpected mechanical failure).

### 3.3 Availability Overlap Architecture
- Half-open `[pickup_at, return_at)` UTC interval semantics on reservations.
- Half-open `[starts_at, ends_at)` UTC interval semantics on availability blocks.
- Backed by `btree_gist` extension with composite GiST range indexes:
  - `idx_availability_blocks_gist`: `USING gist (vehicle_id, tsrange(starts_at, ends_at, '[)'))`
  - `idx_reservations_overlap_gist`: `USING gist (vehicle_id, tsrange(pickup_at, return_at, '[)')) WHERE status NOT IN (...)`
- Double-booking prevention enforced via transactional locking (`SELECT ... FOR UPDATE` on `vehicles`) across both `reservations` and `availability_blocks`.

### 3.4 Column-Level Protection Triggers
- PostgreSQL RLS controls row visibility but does not restrict specific column mutation in `UPDATE` policies.
- Defense-in-depth triggers in `16_triggers.sql`:
  - `protect_customer_columns()`: Preserves `membership_number`, `membership_tier`, `total_rentals`, `verification_status`, and `user_id` against customer self-updates.
  - `protect_reservation_columns()`: Preserves `total_amount`, `deposit_amount`, `currency`, `quote_id`, `vehicle_id`, `pickup_at`, `return_at`, and `payment_status` against customer self-service updates (e.g. self-cancellation).

### 3.5 Native Clerk Authentication Integration
- Native Supabase Third-Party Authentication pattern: `users.clerk_id TEXT UNIQUE NOT NULL`.
- Helper functions in `veyra_private` extract `auth.jwt() ->> 'sub'`.
- Deprecated Clerk JWT-template pattern completely avoided.
