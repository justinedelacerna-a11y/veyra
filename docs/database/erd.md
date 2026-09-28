# Veyra Entity Relationship Diagram

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document. No tables exist yet.
**Date:** September 2026

---

## Core ERD

```mermaid
erDiagram
    users {
        uuid id PK
        text clerk_id UK
        text email UK
        text user_type
        text status
        timestamptz created_at
    }

    customers {
        uuid id PK
        uuid user_id FK
        text first_name
        text last_name
        text phone
        text membership_tier
        text membership_number UK
        text verification_status
    }

    staff_users {
        uuid id PK
        uuid user_id FK
        text employee_id UK
        text role
        uuid branch_id FK
        text status
    }

    branches {
        uuid id PK
        text name
        text city
        text timezone
        text status
    }

    locations {
        uuid id PK
        uuid branch_id FK
        text name
        text type
        text address
        text timezone
        boolean pickup_available
    }

    vehicle_classes {
        uuid id PK
        text name UK
        text category
        bigint base_daily_rate
    }

    vehicles {
        uuid id PK
        uuid vehicle_class_id FK
        uuid branch_id FK
        text make
        text model
        smallint year
        text plate_number UK
        text vin UK
        bigint daily_rate
        text fleet_status
        bigint security_deposit
    }

    extras {
        uuid id PK
        text slug UK
        text name
        text category
        bigint daily_rate
        boolean is_active
    }

    quotes {
        uuid id PK
        uuid customer_id FK
        uuid vehicle_id FK
        uuid pickup_location_id FK
        uuid return_location_id FK
        timestamptz pickup_at
        timestamptz return_at
        bigint total_rental
        bigint security_deposit
        text status
        timestamptz expires_at
    }

    quote_extras {
        uuid id PK
        uuid quote_id FK
        uuid extra_id FK
        bigint total
    }

    reservations {
        uuid id PK
        text reference UK
        uuid customer_id FK
        uuid quote_id FK
        uuid vehicle_id FK
        uuid assigned_vehicle_id FK
        uuid pickup_location_id FK
        uuid return_location_id FK
        timestamptz pickup_at
        timestamptz return_at
        text status
        bigint total_amount
        bigint deposit_amount
    }

    reservation_extras {
        uuid id PK
        uuid reservation_id FK
        uuid extra_id FK
        bigint total
    }

    reservation_drivers {
        uuid id PK
        uuid reservation_id FK
        text first_name
        text last_name
        text license_number
        boolean is_primary
    }

    payments {
        uuid id PK
        uuid reservation_id FK
        uuid customer_id FK
        text type
        bigint amount
        text status
        text provider
        text provider_payment_id
    }

    refunds {
        uuid id PK
        uuid payment_id FK
        uuid reservation_id FK
        bigint amount
        text status
    }

    deposits {
        uuid id PK
        uuid reservation_id FK
        bigint amount
        text status
        timestamptz authorized_at
        timestamptz released_at
    }

    customer_documents {
        uuid id PK
        uuid customer_id FK
        text type
        text storage_path
        text status
        date expires_at
    }

    availability_blocks {
        uuid id PK
        uuid vehicle_id FK
        text type
        timestamptz starts_at
        timestamptz ends_at
    }

    inspections {
        uuid id PK
        uuid reservation_id FK
        uuid vehicle_id FK
        text type
        uuid inspector_id FK
        int odometer_km
        text damage_status
        timestamptz completed_at
    }

    damage_reports {
        uuid id PK
        uuid inspection_id FK
        uuid reservation_id FK
        uuid vehicle_id FK
        text area
        text severity
        bigint charge_amount
        text status
    }

    maintenance_records {
        uuid id PK
        uuid vehicle_id FK
        uuid branch_id FK
        text type
        text status
        date scheduled_date
        bigint estimated_cost
    }

    audit_events {
        uuid id PK
        uuid actor_id FK
        text action
        text resource_type
        text resource_id
        text result
        jsonb before_state
        jsonb after_state
        timestamptz created_at
    }

    webhook_events {
        uuid id PK
        text provider
        text provider_event_id
        jsonb payload
        text status
    }

    %% Identity relationships
    users ||--o| customers : "has profile"
    users ||--o| staff_users : "has staff profile"
    staff_users }o--|| branches : "assigned to"

    %% Location relationships
    branches ||--|{ locations : "has"

    %% Fleet relationships
    vehicle_classes ||--|{ vehicles : "defines"
    branches ||--|{ vehicles : "owns"

    %% Availability
    vehicles ||--|{ availability_blocks : "has blocks"

    %% Booking flow
    customers ||--|{ quotes : "creates"
    vehicles ||--|{ quotes : "quoted for"
    locations ||--|{ quotes : "pickup at"
    quotes ||--|{ quote_extras : "includes"
    extras ||--|{ quote_extras : "references"

    customers ||--|{ reservations : "makes"
    quotes ||--|| reservations : "converts to"
    vehicles ||--|{ reservations : "requested vehicle"
    locations ||--|{ reservations : "pickup at"
    reservations ||--|{ reservation_extras : "includes"
    extras ||--|{ reservation_extras : "references"
    reservations ||--|{ reservation_drivers : "has"

    %% Payments
    reservations ||--|{ payments : "has"
    customers ||--|{ payments : "made by"
    payments ||--|{ refunds : "may have"
    reservations ||--o| deposits : "has deposit"

    %% Documents
    customers ||--|{ customer_documents : "uploads"

    %% Operations
    reservations ||--|{ inspections : "has"
    vehicles ||--|{ inspections : "inspected"
    inspections ||--|{ damage_reports : "may have"

    vehicles ||--|{ maintenance_records : "has"
    branches ||--|{ maintenance_records : "at branch"

    %% Audit
    users ||--|{ audit_events : "creates"
```

---

## Relationship Notes

### User Identity
- Every `users` row has exactly one Clerk identity (`clerk_id`)
- A `users` row has either a `customers` or `staff_users` profile, never both
- `staff_users.branch_id` may be NULL for admins/superadmins with organization-wide access

### Pricing Integrity
- `quotes` record a price snapshot at the moment of quoting
- `reservations.quote_id` references this immutable snapshot
- `reservation_extras` replicates the extra name and rate from the quote — changing an `extras` record later does not affect existing reservations

### Availability Model
- Vehicle availability = the vehicle has no overlapping `reservations` in status `held`, `payment_pending`, `confirmed`, `pickup_ready`, `active`, `return_inspection` AND no overlapping `availability_blocks`
- Both conditions must be checked atomically in a transaction

### Deposit vs Payment
- `deposits` track the refundable security hold separately from rental payments
- A reservation has one `deposits` record and one or more `payments` records
- The deposit is authorized at pickup by the payment provider and released after clean return inspection

### Vehicle Model (Requested vs Assigned Physical Vehicle)
- `reservations.vehicle_id` = The specific physical fleet vehicle selected by the customer. Availability is locked against this vehicle.
- `reservations.assigned_vehicle_id` = The actual physical vehicle confirmed by staff at pickup. Defaults to `vehicle_id`, but may differ in audited substitution scenarios (e.g. mechanical failure).
- Both FKs point to `public.vehicles(id)`.
- Public catalog queries access `public.vehicle_catalog` view rather than the raw `vehicles` table, shielding sensitive fleet data (VIN, plate, maintenance).

### Audit Trail
- `audit_events` is append-only (no UPDATE, no DELETE)
- Every status transition in `reservations`, `payments`, `refunds`, `deposits`, `vehicles`, and `customer_documents` must create an audit event
- `actor_id` is always a real `users.id` — system actions use a dedicated system user
