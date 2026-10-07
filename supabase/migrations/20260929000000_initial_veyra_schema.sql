-- ============================================================
-- Veyra Database Baseline Migration
-- Source: supabase/schemas/*.sql (declarative schemas)
-- Generated: 2026-09-29
-- ============================================================

-- >>> 00_extensions.sql <<<
-- ============================================================
-- Veyra -- Extensions & Private Schema
-- Order: 00 (must run before all other schemas)
-- ============================================================

-- ------------------------------------
-- Required extensions
-- ------------------------------------

-- gen_random_uuid() for all UUID primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- btree_gist: enables GiST indexes on scalar types (vehicle_id UUID)
-- combined with range types. Required for availability overlap queries.
-- Ref: docs/database/indexes.md section 2 (GiST range overlap indexes)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- pg_trgm: enables GIN trigram indexes for fuzzy text search
-- Used for: vehicle catalog search, customer name/email search
-- Ref: docs/database/indexes.md section 4 (full-text & trigram search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- NOTE: pg_stat_statements is enabled by default in Supabase cloud.
-- It is NOT declared here to avoid local/cloud environment conflicts.
-- NOTE: unaccent is not used in the Veyra schema and is not declared.

-- ------------------------------------
-- Private schema for helper functions
-- Not exposed via PostgREST API.
-- Contains SECURITY DEFINER RLS helper functions.
-- ------------------------------------
CREATE SCHEMA IF NOT EXISTS veyra_private;

-- Revoke access to the private schema from PUBLIC and anon.
-- Not exposed via PostgREST (schemas config only exposes public, graphql_public).
REVOKE ALL ON SCHEMA veyra_private FROM PUBLIC;
REVOKE ALL ON SCHEMA veyra_private FROM anon;

-- authenticated and service_role require USAGE to evaluate RLS policy helper functions
GRANT USAGE ON SCHEMA veyra_private TO authenticated, service_role;



-- >>> 01_identity.sql <<<
-- ============================================================
-- Veyra -- Identity & Users (01)
-- Tables: users, customers, staff_users
-- ============================================================

-- ------------------------------------
-- users
-- Maps Clerk identities to app users.
-- clerk_id = Clerk sub claim (user_xxx)
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id      TEXT          NOT NULL UNIQUE,
  email         TEXT          NOT NULL UNIQUE,
  email_verified BOOLEAN      NOT NULL DEFAULT false,
  user_type     TEXT          NOT NULL CHECK (user_type IN ('customer', 'staff')),
  status        TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ   NULL
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id  ON public.users (clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email     ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users (user_type);
CREATE INDEX IF NOT EXISTS idx_users_status    ON public.users (status);

COMMENT ON TABLE  public.users          IS 'Maps Clerk user identities to Veyra application users.';
COMMENT ON COLUMN public.users.clerk_id IS 'Clerk user_id (sub claim). Used for RLS identity resolution via auth.jwt() ->> ''sub''.';

-- ------------------------------------
-- customers
-- One-to-one with users WHERE user_type = 'customer'.
-- NOTE: preferred_hub_id FK to locations added in 02_branches.sql.
-- PROTECTED COLUMNS (server-controlled, not customer-updatable):
--   membership_number, total_rentals, verification_status, membership_tier
-- Customer self-update allowed for: first_name, last_name, phone, date_of_birth, preferred_hub_id
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  first_name          TEXT        NOT NULL,
  last_name           TEXT        NOT NULL,
  phone               TEXT        NULL,       -- E.164 format
  phone_verified      BOOLEAN     NOT NULL DEFAULT false,
  date_of_birth       DATE        NULL,
  preferred_hub_id    UUID        NULL,       -- FK added in 02_branches.sql: REFERENCES public.locations(id) ON DELETE SET NULL
  membership_tier     TEXT        NOT NULL DEFAULT 'standard' CHECK (membership_tier IN ('standard', 'preferred', 'elite')),
  membership_number   TEXT        NOT NULL UNIQUE,
  total_rentals       INT         NOT NULL DEFAULT 0,
  verification_status TEXT        NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id           ON public.customers (user_id);
CREATE INDEX IF NOT EXISTS idx_customers_membership_number  ON public.customers (membership_number);
CREATE INDEX IF NOT EXISTS idx_customers_membership_tier   ON public.customers (membership_tier);
CREATE INDEX IF NOT EXISTS idx_customers_verification      ON public.customers (verification_status);

-- GIN trigram index for admin customer search (first_name, last_name, email via join)
-- Ref: docs/database/indexes.md section 4.2
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm
  ON public.customers USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

COMMENT ON TABLE  public.customers IS 'Customer profile. One-to-one extension of users WHERE user_type = ''customer''.';
COMMENT ON COLUMN public.customers.membership_number IS 'System-generated unique membership identifier (e.g. VYR-CUS-00001). Server-controlled.';
COMMENT ON COLUMN public.customers.total_rentals IS 'Denormalized counter. Server-controlled; not customer-updatable.';
COMMENT ON COLUMN public.customers.verification_status IS 'Staff/admin-controlled verification state. Not customer-updatable.';
COMMENT ON COLUMN public.customers.membership_tier IS 'System-assigned tier. Not customer-updatable directly.';

-- ------------------------------------
-- staff_users
-- One-to-one with users WHERE user_type = 'staff'.
-- NOTE: branch_id FK to branches added in 02_branches.sql.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  first_name  TEXT        NOT NULL,
  last_name   TEXT        NOT NULL,
  employee_id TEXT        NOT NULL UNIQUE,
  role        TEXT        NOT NULL CHECK (role IN ('branch_staff','branch_manager','fleet_manager','support','finance','admin','superadmin')),
  branch_id   UUID        NULL,   -- FK added in 02_branches.sql: REFERENCES public.branches(id) ON DELETE SET NULL
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_date DATE        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_users_user_id   ON public.staff_users (user_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_branch_id ON public.staff_users (branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_role      ON public.staff_users (role);
CREATE INDEX IF NOT EXISTS idx_staff_users_status    ON public.staff_users (status);

COMMENT ON TABLE  public.staff_users      IS 'Staff profile. One-to-one extension of users WHERE user_type = ''staff''.';
COMMENT ON COLUMN public.staff_users.role IS 'Staff application role controlling access scope. Assigned by superadmin only.';


-- >>> 02_branches.sql <<<
-- ============================================================
-- Veyra -- Branches & Locations (02)
-- Tables: branches, locations
-- ============================================================

-- ------------------------------------
-- branches
-- Veyra operational offices.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  city          TEXT        NOT NULL,
  timezone      TEXT        NOT NULL,  -- IANA timezone, e.g. 'Asia/Manila'
  contact_phone TEXT        NULL,
  contact_email TEXT        NULL,
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_status ON public.branches (status);

COMMENT ON TABLE  public.branches          IS 'Veyra operational branch offices.';
COMMENT ON COLUMN public.branches.timezone IS 'IANA timezone identifier, e.g. Asia/Manila.';

-- ------------------------------------
-- locations
-- Physical pickup/return hubs.
-- A branch may have multiple locations.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id         UUID        NOT NULL REFERENCES public.branches (id) ON DELETE RESTRICT,
  name              TEXT        NOT NULL,
  type              TEXT        NOT NULL CHECK (type IN ('airport_terminal', 'city_center', 'private_hub')),
  address           TEXT        NOT NULL,
  city              TEXT        NOT NULL,
  operating_hours   TEXT        NOT NULL,
  pickup_available  BOOLEAN     NOT NULL DEFAULT true,
  return_available  BOOLEAN     NOT NULL DEFAULT true,
  timezone          TEXT        NOT NULL,  -- IANA timezone
  status            TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_branch_id ON public.locations (branch_id);
CREATE INDEX IF NOT EXISTS idx_locations_status    ON public.locations (status);

COMMENT ON TABLE  public.locations IS 'Physical pickup/return hub locations. Each belongs to a branch.';

-- ------------------------------------
-- Now that locations exists, add the FK from customers.preferred_hub_id
-- ------------------------------------
ALTER TABLE public.customers
  ADD CONSTRAINT fk_customers_preferred_hub
  FOREIGN KEY (preferred_hub_id)
  REFERENCES public.locations (id)
  ON DELETE SET NULL;

-- ------------------------------------
-- Now that branches exists, add the FK from staff_users.branch_id
-- ------------------------------------
ALTER TABLE public.staff_users
  ADD CONSTRAINT fk_staff_users_branch
  FOREIGN KEY (branch_id)
  REFERENCES public.branches (id)
  ON DELETE SET NULL;


-- >>> 03_fleet.sql <<<
-- ============================================================
-- Veyra -- Fleet (03)
-- Tables: vehicle_classes, vehicles, vehicle_features, vehicle_photos
-- ============================================================

-- ------------------------------------
-- vehicle_classes
-- Logical groupings of similar vehicles.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_classes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL UNIQUE,
  category        TEXT        NOT NULL CHECK (category IN ('sedan','suv','electric','van','luxury','touring')),
  base_daily_rate BIGINT      NOT NULL CHECK (base_daily_rate >= 0),   -- centavos
  description     TEXT        NULL,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_classes_category ON public.vehicle_classes (category);

COMMENT ON TABLE  public.vehicle_classes                 IS 'Logical vehicle class groupings, e.g. Executive Sedan, Luxury SUV.';
COMMENT ON COLUMN public.vehicle_classes.base_daily_rate IS 'Default daily rate in centavos; overridden per vehicle.';

-- ------------------------------------
-- vehicles
-- Individual physical fleet vehicles.
-- SENSITIVE FIELDS (staff/admin only):
--   vin, plate_number, internal_notes, odometer_km,
--   acquisition_date, next_maintenance_due, next_maintenance_odometer
-- Customer-safe fields are exposed via vehicle_catalog view (18_public_catalog.sql).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_class_id          UUID        NOT NULL REFERENCES public.vehicle_classes (id) ON DELETE RESTRICT,
  branch_id                 UUID        NOT NULL REFERENCES public.branches (id) ON DELETE RESTRICT,
  make                      TEXT        NOT NULL,
  model                     TEXT        NOT NULL,
  year                      SMALLINT    NOT NULL,
  plate_number              TEXT        NOT NULL UNIQUE,     -- SENSITIVE: staff only
  vin                       TEXT        NOT NULL UNIQUE,     -- SENSITIVE: staff only; 17-char VIN
  color                     TEXT        NULL,
  transmission              TEXT        NOT NULL CHECK (transmission IN ('automatic', 'manual')),
  fuel_type                 TEXT        NOT NULL CHECK (fuel_type IN ('petrol','diesel','electric','hybrid')),
  seats                     SMALLINT    NOT NULL,
  luggage_capacity          SMALLINT    NOT NULL,
  doors                     SMALLINT    NULL,
  daily_rate                BIGINT      NOT NULL CHECK (daily_rate >= 0),    -- centavos; overrides vehicle_class
  currency                  CHAR(3)     NOT NULL DEFAULT 'PHP',
  security_deposit          BIGINT      NOT NULL CHECK (security_deposit >= 0),  -- centavos
  mileage_allowance_km      INT         NULL,
  excess_mileage_rate       BIGINT      NULL CHECK (excess_mileage_rate >= 0),   -- centavos per km
  fleet_status              TEXT        NOT NULL DEFAULT 'available' CHECK (fleet_status IN ('available','reserved','rented','inspection','maintenance','inactive','retired')),
  condition                 TEXT        NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent','good','fair','poor')),
  odometer_km               INT         NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),  -- SENSITIVE
  fuel_level_pct            SMALLINT    NOT NULL DEFAULT 100 CHECK (fuel_level_pct BETWEEN 0 AND 100),
  last_inspection_date      DATE        NULL,
  next_maintenance_due      DATE        NULL,                -- SENSITIVE
  next_maintenance_odometer INT         NULL,               -- SENSITIVE
  acquisition_date          DATE        NOT NULL,            -- SENSITIVE
  internal_notes            TEXT        NULL,               -- SENSITIVE
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ NULL       -- soft retire
);

CREATE INDEX IF NOT EXISTS idx_vehicles_branch_id        ON public.vehicles (branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_status     ON public.vehicles (fleet_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_class_id ON public.vehicles (vehicle_class_id);
-- Partial index for active fleet queries (excludes retired/deleted)
CREATE INDEX IF NOT EXISTS idx_vehicles_active_fleet
  ON public.vehicles (branch_id, fleet_status)
  WHERE deleted_at IS NULL;

-- GIN trigram index for vehicle catalog search (make + model fuzzy search)
-- Ref: docs/database/indexes.md section 4.1
CREATE INDEX IF NOT EXISTS idx_vehicles_search_trgm
  ON public.vehicles USING gin ((make || ' ' || model) gin_trgm_ops);

COMMENT ON TABLE  public.vehicles            IS 'Individual physical fleet vehicles. Sensitive fields not exposed to anon via RLS Ã¢â‚¬â€ use vehicle_catalog view instead.';
COMMENT ON COLUMN public.vehicles.daily_rate IS 'Daily rate in centavos; overrides vehicle_class.base_daily_rate.';
COMMENT ON COLUMN public.vehicles.vin        IS 'SENSITIVE: staff-only. 17-character VIN number.';
COMMENT ON COLUMN public.vehicles.plate_number IS 'SENSITIVE: staff-only. Vehicle license plate.';
COMMENT ON COLUMN public.vehicles.deleted_at IS 'Soft retire. NULL = active in fleet.';

-- ------------------------------------
-- vehicle_features
-- Many-to-many: features per vehicle.
-- No sensitive data Ã¢â‚¬â€ safe for public read.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_features (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  feature    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_features_vehicle_id ON public.vehicle_features (vehicle_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_features_unique ON public.vehicle_features (vehicle_id, feature);

COMMENT ON TABLE  public.vehicle_features IS 'Feature tags per vehicle, e.g. All-Wheel Drive, Sunroof. No sensitive data.';

-- ------------------------------------
-- vehicle_photos
-- Vehicle photos.
-- Marketing photos: safe for public/anon access.
-- Inspection/damage photos: sensitive; staff-only via private bucket.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,   -- Supabase Storage path
  bucket       TEXT        NOT NULL,   -- 'vehicles-public' or 'vehicles-private'
  type         TEXT        NOT NULL CHECK (type IN ('marketing','inspection','damage')),
  sort_order   INT         NOT NULL DEFAULT 0,
  uploaded_by  UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle_id ON public.vehicle_photos (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_type       ON public.vehicle_photos (vehicle_id, type);

COMMENT ON TABLE  public.vehicle_photos        IS 'Vehicle photos. Marketing type: public bucket, anon-accessible. Inspection/damage: private bucket, staff-only.';
COMMENT ON COLUMN public.vehicle_photos.bucket IS 'Supabase Storage bucket: vehicles-public (marketing) or vehicles-private (inspection/damage).';


-- >>> 04_availability.sql <<<
-- ============================================================
-- Veyra -- Availability (04)
-- Tables: availability_blocks
-- ============================================================

-- ------------------------------------
-- availability_blocks
-- Explicit availability overrides (maintenance, holds, closures).
-- Reservation-based unavailability is derived from the reservations table.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('maintenance','hold','cleaning','recall','other')),
  starts_at  TIMESTAMPTZ NOT NULL,   -- UTC (inclusive start)
  ends_at    TIMESTAMPTZ NOT NULL,   -- UTC (exclusive end, half-open [) interval)
  reason     TEXT        NULL,
  created_by UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_availability_block_interval CHECK (ends_at > starts_at)
);

-- Standard B-tree FK index
CREATE INDEX IF NOT EXISTS idx_availability_blocks_vehicle_id
  ON public.availability_blocks (vehicle_id);

-- GiST range overlap index: enables the && overlap operator for availability queries.
-- Requires btree_gist extension (declared in 00_extensions.sql).
-- Used for: "find all blocks that overlap a given [pickup_at, return_at) window"
-- Query pattern: WHERE vehicle_id = $v AND tstzrange(starts_at, ends_at, '[)') && tstzrange($pickup, $return, '[)')
-- Ref: docs/database/indexes.md section 2.2
CREATE INDEX IF NOT EXISTS idx_availability_blocks_gist
  ON public.availability_blocks USING gist (
    vehicle_id,
    tstzrange(starts_at, ends_at, '[)')
  );

COMMENT ON TABLE  public.availability_blocks          IS 'Explicit vehicle availability blocks for maintenance, holds, cleaning, etc. Uses half-open [) intervals.';
COMMENT ON COLUMN public.availability_blocks.starts_at IS 'Inclusive start of block in UTC.';
COMMENT ON COLUMN public.availability_blocks.ends_at   IS 'Exclusive end of block in UTC. Half-open [) interval semantics.';


-- >>> 05_extras_pricing.sql <<<
-- ============================================================
-- Veyra -- Extras & Rate Plans (05)
-- Tables: extras, rate_plans
-- ============================================================

-- ------------------------------------
-- extras
-- Add-on products available during booking.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.extras (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('protection','convenience','equipment','mileage')),
  daily_rate  BIGINT      NOT NULL,   -- centavos
  currency    CHAR(3)     NOT NULL DEFAULT 'PHP',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extras_category  ON public.extras (category);
CREATE INDEX IF NOT EXISTS idx_extras_is_active ON public.extras (is_active);

COMMENT ON TABLE  public.extras            IS 'Add-on products: protection waivers, equipment, mileage upgrades, etc.';
COMMENT ON COLUMN public.extras.daily_rate IS 'Daily rate in centavos.';
COMMENT ON COLUMN public.extras.slug       IS 'URL-safe identifier, e.g. full-protection-waiver.';

-- ------------------------------------
-- rate_plans
-- Named rate configurations applied to vehicle classes.
-- E.g., weekend rates, long-term discount rates.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_plans (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT            NOT NULL,
  vehicle_class_id    UUID            NULL REFERENCES public.vehicle_classes (id) ON DELETE CASCADE,  -- NULL = all classes
  min_days            SMALLINT        NOT NULL,
  max_days            SMALLINT        NULL,       -- NULL = no upper limit
  daily_rate_override BIGINT          NULL,       -- centavos; NULL = use vehicle's daily_rate
  discount_pct        NUMERIC(5,2)    NULL CHECK (discount_pct BETWEEN 0 AND 100),
  valid_from          DATE            NULL,
  valid_to            DATE            NULL,
  is_active           BOOLEAN         NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_rate_plan_days CHECK (max_days IS NULL OR max_days >= min_days),
  CONSTRAINT chk_rate_plan_validity CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE INDEX IF NOT EXISTS idx_rate_plans_vehicle_class_id ON public.rate_plans (vehicle_class_id);
CREATE INDEX IF NOT EXISTS idx_rate_plans_is_active        ON public.rate_plans (is_active);

COMMENT ON TABLE  public.rate_plans IS 'Named rate configurations for volume discounts, seasonal rates, and long-term rentals.';


-- >>> 06_quotes.sql <<<
-- ============================================================
-- Veyra -- Quotes (06)
-- Tables: quotes, quote_extras
-- ============================================================

-- ------------------------------------
-- quotes
-- Immutable price snapshot presented to customer before booking.
-- Once created, never updated (pricing integrity).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.quotes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID        NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  vehicle_id          UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,
  pickup_location_id  UUID        NOT NULL REFERENCES public.locations (id) ON DELETE RESTRICT,
  return_location_id  UUID        NOT NULL REFERENCES public.locations (id) ON DELETE RESTRICT,
  pickup_at           TIMESTAMPTZ NOT NULL,   -- UTC
  return_at           TIMESTAMPTZ NOT NULL,   -- UTC
  rental_days         SMALLINT    NOT NULL,
  daily_rate          BIGINT      NOT NULL,   -- centavos at time of quote
  base_rental         BIGINT      NOT NULL,   -- centavos
  extras_subtotal     BIGINT      NOT NULL DEFAULT 0,  -- centavos
  discount_amount     BIGINT      NOT NULL DEFAULT 0,  -- centavos
  tax_amount          BIGINT      NOT NULL DEFAULT 0,  -- centavos
  subtotal            BIGINT      NOT NULL,   -- centavos
  total_rental        BIGINT      NOT NULL,   -- centavos (final)
  security_deposit    BIGINT      NOT NULL,   -- centavos
  currency            CHAR(3)     NOT NULL DEFAULT 'PHP',
  pricing_version     TEXT        NOT NULL,   -- hash or version tag of pricing rules
  status              TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','converted','cancelled')),
  expires_at          TIMESTAMPTZ NOT NULL,   -- typically 30 min after creation
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_quote_interval CHECK (return_at > pickup_at),
  CONSTRAINT chk_quote_rental_days CHECK (rental_days > 0)
);

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle_id  ON public.quotes (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status      ON public.quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_expires_at  ON public.quotes (expires_at);

COMMENT ON TABLE  public.quotes IS 'Immutable price snapshot presented to customer before booking confirmation. Never updated after creation.';

-- ------------------------------------
-- quote_extras
-- Line items for extras included in a quote.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.quote_extras (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID    NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  extra_id    UUID    NOT NULL REFERENCES public.extras (id) ON DELETE RESTRICT,
  extra_name  TEXT    NOT NULL,   -- snapshot at time of quote
  daily_rate  BIGINT  NOT NULL,   -- centavos; snapshot
  total       BIGINT  NOT NULL    -- centavos
);

CREATE INDEX IF NOT EXISTS idx_quote_extras_quote_id ON public.quote_extras (quote_id);

COMMENT ON TABLE  public.quote_extras IS 'Extra line items included in a quote. Prices are immutable snapshots.';


-- >>> 07_reservations.sql <<<
-- ============================================================
-- Veyra -- Reservations (07)
-- Tables: reservations, reservation_extras, reservation_drivers
-- ============================================================

-- ------------------------------------
-- reservations
-- Core booking record.
-- References an immutable quote for pricing integrity.
--
-- Vehicle Model Decision (Phase 8 Audit C-4):
--   vehicle_id          = the SPECIFIC PHYSICAL VEHICLE the customer selected
--   assigned_vehicle_id = the ACTUAL vehicle confirmed by staff (may differ on substitution)
--   Availability is checked against vehicle_id at hold creation time.
--   See: docs/operations/availability.md section 10
--
-- State Machine (reservation-state-machine.md):
--   draft Ã¢â€ â€™ quote_created Ã¢â€ â€™ held Ã¢â€ â€™ payment_pending Ã¢â€ â€™ confirmed
--   Ã¢â€ â€™ pickup_ready Ã¢â€ â€™ active Ã¢â€ â€™ return_inspection Ã¢â€ â€™ completed
--   Terminal: expired, payment_failed, cancelled, no_show, disputed
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.reservations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             TEXT        NOT NULL UNIQUE,   -- e.g. VYR-2024-ABCD
  customer_id           UUID        NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  quote_id              UUID        NOT NULL REFERENCES public.quotes (id) ON DELETE RESTRICT,
  vehicle_id            UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,   -- specific physical vehicle selected by customer
  assigned_vehicle_id   UUID        NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,      -- actual vehicle confirmed by staff (may differ from vehicle_id)
  pickup_location_id    UUID        NOT NULL REFERENCES public.locations (id) ON DELETE RESTRICT,
  return_location_id    UUID        NOT NULL REFERENCES public.locations (id) ON DELETE RESTRICT,
  pickup_at             TIMESTAMPTZ NOT NULL,
  return_at             TIMESTAMPTZ NOT NULL,
  actual_pickup_at      TIMESTAMPTZ NULL,   -- set by staff at handover
  actual_return_at      TIMESTAMPTZ NULL,   -- set by staff on return
  rental_days           SMALLINT    NOT NULL,
  hold_expires_at       TIMESTAMPTZ NULL,   -- TTL for held/quote_created/payment_pending states; cron uses this for reaper query
  status                TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'quote_created',
    'held',
    'payment_pending',
    'confirmed',
    'pickup_ready',
    'active',
    'return_inspection',
    'completed',
    'expired',
    'payment_failed',
    'cancelled',
    'no_show',
    'disputed'
  )),
  payment_status        TEXT        NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'authorized',
    'captured',
    'failed',
    'refunded',
    'partially_refunded'
  )),
  payment_method        TEXT        NULL CHECK (payment_method IN ('card','e_wallet','counter','bank_transfer')),
  total_amount          BIGINT      NOT NULL CHECK (total_amount >= 0),   -- centavos from quote
  deposit_amount        BIGINT      NOT NULL CHECK (deposit_amount >= 0), -- centavos from quote
  currency              CHAR(3)     NOT NULL DEFAULT 'PHP',
  internal_notes        TEXT        NULL,   -- staff-only
  cancellation_reason   TEXT        NULL,
  idempotency_key       TEXT        UNIQUE NULL,  -- safe duplicate submission guard
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_reservation_interval    CHECK (return_at > pickup_at),
  CONSTRAINT chk_reservation_rental_days CHECK (rental_days > 0)
);

-- Standard access indexes
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id   ON public.reservations (customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_id    ON public.reservations (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status        ON public.reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_pickup_at     ON public.reservations (pickup_at);
CREATE INDEX IF NOT EXISTS idx_reservations_reference     ON public.reservations (reference);

-- Partial index for branch operations: active pickups
CREATE INDEX IF NOT EXISTS idx_reservations_active_pickup
  ON public.reservations (pickup_location_id, pickup_at)
  WHERE status IN ('confirmed', 'pickup_ready');

-- Partial index for branch operations: active returns
CREATE INDEX IF NOT EXISTS idx_reservations_active_return
  ON public.reservations (return_location_id, return_at)
  WHERE status = 'active';

-- B-tree overlap index for availability queries (B-tree range comparison pattern)
-- Query: pickup_at < $return AND return_at > $pickup (half-open interval)
-- Excludes all terminal/failed states from the index for efficiency
CREATE INDEX IF NOT EXISTS idx_reservations_overlap_btree
  ON public.reservations (vehicle_id, pickup_at, return_at)
  WHERE status NOT IN ('cancelled', 'no_show', 'expired', 'payment_failed', 'completed', 'draft');

-- GiST range overlap index for future && operator queries
-- Requires btree_gist extension (00_extensions.sql)
-- Partial: only includes active/pending states
CREATE INDEX IF NOT EXISTS idx_reservations_overlap_gist
  ON public.reservations USING gist (
    vehicle_id,
    tstzrange(pickup_at, return_at, '[)')
  )
  WHERE status NOT IN ('cancelled', 'no_show', 'expired', 'payment_failed', 'completed', 'draft');

-- Hold TTL reaper index: enables cron to find stale holds efficiently
-- Ref: docs/operations/reservation-state-machine.md section 7
CREATE INDEX IF NOT EXISTS idx_reservations_hold_expires
  ON public.reservations (hold_expires_at)
  WHERE status IN ('held', 'quote_created', 'payment_pending')
    AND hold_expires_at IS NOT NULL;

-- Customer booking history (ordered by date)
CREATE INDEX IF NOT EXISTS idx_reservations_customer_history
  ON public.reservations (customer_id, created_at DESC);

COMMENT ON TABLE  public.reservations IS 'Core booking record. Drives the Veyra reservation state machine.';
COMMENT ON COLUMN public.reservations.reference IS 'Human-readable booking reference, e.g. VYR-2024-ABCD.';
COMMENT ON COLUMN public.reservations.vehicle_id IS 'Specific physical vehicle the customer selected. Availability is checked against this ID.';
COMMENT ON COLUMN public.reservations.assigned_vehicle_id IS 'Actual vehicle confirmed by staff. May differ from vehicle_id in substitution cases. Requires audit entry.';
COMMENT ON COLUMN public.reservations.hold_expires_at IS 'TTL timestamp for hold/quote states. Cron reaper uses this to release expired holds.';
COMMENT ON COLUMN public.reservations.idempotency_key IS 'Client-provided key to prevent duplicate reservation submissions.';

-- ------------------------------------
-- reservation_extras
-- Snapshot of extras for this reservation.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.reservation_extras (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID    NOT NULL REFERENCES public.reservations (id) ON DELETE CASCADE,
  extra_id       UUID    NOT NULL REFERENCES public.extras (id) ON DELETE RESTRICT,
  extra_name     TEXT    NOT NULL,   -- snapshot
  daily_rate     BIGINT  NOT NULL CHECK (daily_rate >= 0),  -- centavos; snapshot
  total          BIGINT  NOT NULL CHECK (total >= 0)        -- centavos
);

CREATE INDEX IF NOT EXISTS idx_reservation_extras_reservation_id ON public.reservation_extras (reservation_id);

COMMENT ON TABLE  public.reservation_extras IS 'Extra add-ons included in a reservation. Prices are immutable snapshots from quote.';

-- ------------------------------------
-- reservation_drivers
-- Additional authorized drivers.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.reservation_drivers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID        NOT NULL REFERENCES public.reservations (id) ON DELETE CASCADE,
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  email           TEXT        NULL,
  phone           TEXT        NULL,
  date_of_birth   DATE        NOT NULL,
  license_number  TEXT        NOT NULL,
  license_country CHAR(2)     NOT NULL,   -- ISO 3166-1 alpha-2
  license_expiry  DATE        NULL,
  is_primary      BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservation_drivers_reservation_id ON public.reservation_drivers (reservation_id);

COMMENT ON TABLE  public.reservation_drivers IS 'Additional authorized drivers for a reservation.';


-- >>> 08_payments.sql <<<
-- ============================================================
-- Veyra -- Payments (08)
-- Tables: payments, refunds, deposits
--
-- Write access: service_role ONLY.
-- No INSERT/UPDATE policies granted to authenticated role.
-- RLS default-deny prevents any direct client writes.
-- ============================================================

-- ------------------------------------
-- payments
-- Payment transactions associated with reservations.
-- Server-controlled: all writes via service_role (payment webhooks, admin actions).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id      UUID        NOT NULL REFERENCES public.reservations (id) ON DELETE RESTRICT,
  customer_id         UUID        NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  type                TEXT        NOT NULL CHECK (type IN ('rental','deposit','extra_charge','late_fee')),
  amount              BIGINT      NOT NULL CHECK (amount > 0),   -- centavos; must be positive
  currency            CHAR(3)     NOT NULL DEFAULT 'PHP',
  status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','captured','failed','refunded','partially_refunded')),
  method              TEXT        NULL CHECK (method IN ('card','e_wallet','counter','bank_transfer')),
  provider            TEXT        NULL,       -- e.g. 'paymongo'
  provider_payment_id TEXT        NULL,       -- PayMongo intent ID
  provider_txn_ref    TEXT        NULL,       -- payment reference number
  idempotency_key     TEXT        UNIQUE NULL,
  failure_reason      TEXT        NULL,
  notes               TEXT        NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation_id      ON public.payments (reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id         ON public.payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status              ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments (provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_pending_reconcile
  ON public.payments (provider_payment_id, created_at)
  WHERE status = 'pending';

COMMENT ON TABLE  public.payments IS 'Payment transactions. All amounts in centavos. Writes via service_role only.';

-- ------------------------------------
-- refunds
-- Refund records linked to payments.
-- Server-controlled: all writes via service_role (finance-initiated, webhook-confirmed).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id         UUID        NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  reservation_id     UUID        NOT NULL REFERENCES public.reservations (id) ON DELETE RESTRICT,
  amount             BIGINT      NOT NULL CHECK (amount > 0),   -- centavos; must be positive
  currency           CHAR(3)     NOT NULL DEFAULT 'PHP',
  status             TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  reason             TEXT        NOT NULL,
  provider_refund_id TEXT        NULL,
  idempotency_key    TEXT        UNIQUE NULL,
  initiated_by       UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id     ON public.refunds (payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_reservation_id ON public.refunds (reservation_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status         ON public.refunds (status);

COMMENT ON TABLE  public.refunds IS 'Refund records. All amounts in centavos. Initiated by finance/admin; writes via service_role.';

-- ------------------------------------
-- deposits
-- Security deposit tracking (authorization hold).
-- One deposit per reservation (UNIQUE on reservation_id).
-- Server-controlled: all writes via service_role.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.deposits (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   UUID        NOT NULL UNIQUE REFERENCES public.reservations (id) ON DELETE RESTRICT,
  amount           BIGINT      NOT NULL CHECK (amount > 0),   -- centavos; must be positive
  currency         CHAR(3)     NOT NULL DEFAULT 'PHP',
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','held','released','forfeited','partial_release')),
  provider_hold_id TEXT        NULL,
  authorized_at    TIMESTAMPTZ NULL,
  released_at      TIMESTAMPTZ NULL,
  forfeited_amount BIGINT      NULL CHECK (forfeited_amount > 0),   -- centavos; damage charges
  release_notes    TEXT        NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.deposits IS 'Security deposit hold tracking. One record per reservation. Writes via service_role.';


-- >>> 09_documents.sql <<<
-- ============================================================
-- Veyra -- Documents (09)
-- Tables: customer_documents
-- ============================================================

-- ------------------------------------
-- customer_documents
-- Identity and verification documents uploaded by customers.
-- Stored in the private Supabase Storage bucket.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID        NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  type              TEXT        NOT NULL CHECK (type IN ('driver_license','government_id','address_proof','passport')),
  storage_path      TEXT        NOT NULL,       -- Supabase Storage private path
  original_filename TEXT        NOT NULL,
  mime_type         TEXT        NOT NULL,       -- server-validated
  file_size_bytes   INT         NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','rejected','expired')),
  rejection_reason  TEXT        NULL,
  expires_at        DATE        NULL,           -- document expiry date
  reviewed_by       UUID        NULL REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_customer_id ON public.customer_documents (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type        ON public.customer_documents (customer_id, type);
CREATE INDEX IF NOT EXISTS idx_customer_documents_status      ON public.customer_documents (status);

COMMENT ON TABLE  public.customer_documents              IS 'Identity and verification documents uploaded by customers. Stored in private bucket.';
COMMENT ON COLUMN public.customer_documents.storage_path IS 'Supabase Storage object path in the customer-documents-private bucket.';


-- >>> 10_inspections.sql <<<
-- ============================================================
-- Veyra -- Inspections (10)
-- Tables: inspections, inspection_check_items, damage_reports
-- ============================================================

-- ------------------------------------
-- inspections
-- Pre-pickup and post-return vehicle inspection records.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.inspections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   UUID        NOT NULL REFERENCES public.reservations (id) ON DELETE RESTRICT,
  vehicle_id       UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,
  type             TEXT        NOT NULL CHECK (type IN ('pickup','return')),
  inspector_id     UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  customer_present BOOLEAN     NOT NULL,
  odometer_km      INT         NOT NULL CHECK (odometer_km >= 0),
  fuel_level_pct   SMALLINT    NOT NULL CHECK (fuel_level_pct BETWEEN 0 AND 100),
  overall_status   TEXT        NOT NULL CHECK (overall_status IN ('pass','fail','noted')),
  damage_status    TEXT        NOT NULL DEFAULT 'no_damage' CHECK (damage_status IN ('no_damage','existing_noted','new_damage','needs_review','charge_proposed','resolved')),
  notes            TEXT        NULL,
  customer_signature BOOLEAN   NOT NULL DEFAULT false,
  completed_at     TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspections_reservation_id ON public.inspections (reservation_id);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id     ON public.inspections (vehicle_id);
-- One pickup and one return inspection per reservation (enforced)
CREATE UNIQUE INDEX IF NOT EXISTS idx_inspections_unique_type ON public.inspections (reservation_id, type);

COMMENT ON TABLE  public.inspections IS 'Pre-pickup and post-return vehicle condition inspections.';

-- ------------------------------------
-- inspection_check_items
-- Individual checklist items per inspection.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_check_items (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID    NOT NULL REFERENCES public.inspections (id) ON DELETE CASCADE,
  area          TEXT    NOT NULL,   -- e.g. 'Front Bumper', 'Driver Door'
  status        TEXT    NOT NULL CHECK (status IN ('pass','fail','noted')),
  notes         TEXT    NULL
);

CREATE INDEX IF NOT EXISTS idx_inspection_check_items_inspection_id ON public.inspection_check_items (inspection_id);

COMMENT ON TABLE  public.inspection_check_items IS 'Individual area check results for an inspection.';

-- ------------------------------------
-- damage_reports
-- Damage findings attached to inspections.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.damage_reports (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id  UUID        NOT NULL REFERENCES public.inspections (id) ON DELETE RESTRICT,
  reservation_id UUID        NOT NULL REFERENCES public.reservations (id) ON DELETE RESTRICT,
  vehicle_id     UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,
  area           TEXT        NOT NULL,
  description    TEXT        NOT NULL,
  severity       TEXT        NOT NULL CHECK (severity IN ('minor','moderate','major')),
  pre_existing   BOOLEAN     NOT NULL,
  charge_amount  BIGINT      NULL CHECK (charge_amount > 0),   -- centavos; must be positive if set
  status         TEXT        NOT NULL DEFAULT 'reported' CHECK (status IN ('reported','assessed','charged','waived','disputed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_damage_reports_inspection_id  ON public.damage_reports (inspection_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_reservation_id ON public.damage_reports (reservation_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_vehicle_id     ON public.damage_reports (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status         ON public.damage_reports (status);

COMMENT ON TABLE  public.damage_reports IS 'Damage findings identified during inspections. charge_amount in centavos; must be positive if set.';


-- >>> 11_maintenance.sql <<<
-- ============================================================
-- Veyra -- Maintenance (11)
-- Tables: maintenance_records
-- ============================================================

-- ------------------------------------
-- maintenance_records
-- Scheduled and completed maintenance events per vehicle.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id          UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,
  branch_id           UUID        NOT NULL REFERENCES public.branches (id) ON DELETE RESTRICT,
  type                TEXT        NOT NULL CHECK (type IN (
    'routine_service','brake_service','tire_replacement','oil_change',
    'battery_check','ac_service','electrical','bodywork','recall'
  )),
  status              TEXT        NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','due','in_progress','completed','overdue')),
  priority            TEXT        NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  scheduled_date      DATE        NOT NULL,
  completed_date      DATE        NULL,
  odometer_at_service INT         NULL,
  estimated_cost      BIGINT      NULL,   -- centavos
  actual_cost         BIGINT      NULL,   -- centavos
  currency            CHAR(3)     NOT NULL DEFAULT 'PHP',
  provider            TEXT        NULL,   -- service shop name
  notes               TEXT        NULL,
  created_by          UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_vehicle_id     ON public.maintenance_records (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status         ON public.maintenance_records (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_scheduled_date ON public.maintenance_records (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_branch_id      ON public.maintenance_records (branch_id);

COMMENT ON TABLE  public.maintenance_records IS 'Scheduled and completed fleet maintenance events.';


-- >>> 12_webhooks.sql <<<
-- ============================================================
-- Veyra -- Webhook Events (12)
-- Tables: webhook_events
-- ============================================================

-- ------------------------------------
-- webhook_events
-- Inbound webhook events from external providers (PayMongo, Clerk).
-- Processed idempotently using (provider, provider_event_id).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT        NOT NULL CHECK (provider IN ('paymongo','clerk')),
  event_type        TEXT        NOT NULL,         -- e.g. 'payment.paid', 'user.created'
  provider_event_id TEXT        NOT NULL,         -- provider-issued unique event ID
  payload           JSONB       NOT NULL,         -- raw event body
  status            TEXT        NOT NULL DEFAULT 'received' CHECK (status IN ('received','processing','processed','failed','ignored')),
  processed_at      TIMESTAMPTZ NULL,
  failure_reason    TEXT        NULL,
  retry_count       SMALLINT    NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Deduplication: one record per provider event
  CONSTRAINT uq_webhook_events_provider_event UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider   ON public.webhook_events (provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status     ON public.webhook_events (status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events (created_at);

COMMENT ON TABLE  public.webhook_events IS 'Inbound webhook events from PayMongo and Clerk. Processed idempotently.';
COMMENT ON COLUMN public.webhook_events.provider_event_id IS 'Provider-assigned unique event ID. Used for deduplication.';


-- >>> 13_audit.sql <<<
-- ============================================================
-- Veyra -- Audit Events (13)
-- Tables: audit_events
-- APPEND-ONLY: no UPDATE or DELETE ever permitted.
-- ============================================================

-- ------------------------------------
-- audit_events
-- Immutable log of all business-significant actions.
-- Permissions: INSERT only for authenticated roles.
-- No RLS UPDATE/DELETE policies are defined for this table.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  actor_role    TEXT        NOT NULL,   -- snapshot of role at time of action
  action        TEXT        NOT NULL,   -- e.g. 'reservation.status_changed'
  resource_type TEXT        NOT NULL,   -- e.g. 'reservation'
  resource_id   TEXT        NOT NULL,   -- UUID of affected resource as text
  result        TEXT        NOT NULL CHECK (result IN ('success', 'failure')),
  details       TEXT        NOT NULL,   -- human-readable summary
  before_state  JSONB       NULL,       -- relevant fields before change
  after_state   JSONB       NULL,       -- relevant fields after change
  ip_address    INET        NULL,
  user_agent    TEXT        NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE: NO updated_at. This table is append-only.
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id      ON public.audit_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action        ON public.audit_events (action);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type ON public.audit_events (resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_id   ON public.audit_events (resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at    ON public.audit_events (created_at DESC);

COMMENT ON TABLE  public.audit_events IS 'Append-only immutable audit log. No UPDATE or DELETE are ever permitted.';
COMMENT ON COLUMN public.audit_events.actor_role IS 'Role snapshot preserved at time of action for historical accuracy.';
COMMENT ON COLUMN public.audit_events.resource_id IS 'UUID stored as TEXT to support any resource type.';


-- >>> 14_notifications.sql <<<
-- ============================================================
-- Veyra -- Notifications (14)
-- Tables: notification_queue
-- ============================================================

-- ------------------------------------
-- notification_queue
-- Outbound notifications to be dispatched by the notification worker.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  channel        TEXT        NOT NULL CHECK (channel IN ('email','sms','in_app','push')),
  event_type     TEXT        NOT NULL,         -- e.g. 'reservation.confirmed'
  template_id    TEXT        NOT NULL,         -- template reference key
  payload        JSONB       NOT NULL,         -- template variables
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  sent_at        TIMESTAMPTZ NULL,
  failure_reason TEXT        NULL,
  retry_count    SMALLINT    NOT NULL DEFAULT 0,
  scheduled_for  TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- allows delayed sends
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id       ON public.notification_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status        ON public.notification_queue (status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON public.notification_queue (scheduled_for)
  WHERE status = 'pending';

COMMENT ON TABLE  public.notification_queue IS 'Outbound notifications awaiting dispatch by the notification worker.';
COMMENT ON COLUMN public.notification_queue.scheduled_for IS 'Earliest send time. Supports delayed and future notifications.';


-- >>> 15_private_functions.sql <<<
-- ============================================================
-- Veyra -- Private Helper Functions (15)
-- Schema: veyra_private
-- Used by RLS policies for identity resolution.
-- Clerk Native Third-Party Auth pattern.
-- ============================================================

-- ------------------------------------
-- current_clerk_id()
-- Returns the Clerk user ID (sub claim) from the JWT.
-- SECURITY INVOKER: runs as the calling user, no privilege escalation.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_clerk_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT (auth.jwt() ->> 'sub');
$$;

-- ------------------------------------
-- current_user_id()
-- Maps the Clerk sub claim -> internal users.id UUID.
-- SECURITY DEFINER to safely cross schema boundary.
-- search_path explicitly set to prevent search-path hijacking.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT id
  FROM public.users
  WHERE clerk_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- ------------------------------------
-- current_staff_role()
-- Returns the staff role for the current user, or NULL if customer/unauthenticated.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_staff_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT su.role
  FROM public.staff_users su
  JOIN public.users u ON su.user_id = u.id
  WHERE u.clerk_id = (auth.jwt() ->> 'sub')
    AND su.status = 'active'
  LIMIT 1;
$$;

-- ------------------------------------
-- current_branch_id()
-- Returns the branch UUID for branch-scoped staff.
-- Returns NULL for customers or global staff (fleet_manager, support, finance, admin, superadmin).
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT su.branch_id
  FROM public.staff_users su
  JOIN public.users u ON su.user_id = u.id
  WHERE u.clerk_id = (auth.jwt() ->> 'sub')
    AND su.status = 'active'
    AND su.role IN ('branch_staff', 'branch_manager')  -- only branch-scoped roles have branch_id
  LIMIT 1;
$$;

-- ------------------------------------
-- is_org_staff()
-- Returns true if the current user is an org-wide staff member.
-- Roles: fleet_manager, support, finance, admin, superadmin
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.is_org_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_users su
    JOIN public.users u ON su.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
      AND su.status = 'active'
      AND su.role IN ('fleet_manager', 'support', 'finance', 'admin', 'superadmin')
  );
$$;

-- ------------------------------------
-- is_admin()
-- Returns true if the current user has admin or superadmin role.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_users su
    JOIN public.users u ON su.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
      AND su.status = 'active'
      AND su.role IN ('admin', 'superadmin')
  );
$$;

-- ------------------------------------
-- current_customer_id()
-- Returns the customers.id for the current customer user, or NULL.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT c.id
  FROM public.customers c
  JOIN public.users u ON c.user_id = u.id
  WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- ============================================================
-- SECURITY: Revoke default PUBLIC and anon execute on private functions.
-- Postgres grants EXECUTE to PUBLIC by default for new functions.
-- We explicitly revoke from PUBLIC and anon.
-- authenticated and service_role retain EXECUTE to evaluate RLS policies.
-- Because veyra_private is NOT an exposed schema in config.toml,
-- PostgREST will never expose these functions as API RPC endpoints.
-- ============================================================
REVOKE EXECUTE ON FUNCTION veyra_private.current_clerk_id()   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.current_user_id()    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.current_staff_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.current_branch_id()  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.is_org_staff()       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.is_admin()           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.current_customer_id() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION veyra_private.current_clerk_id()   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.current_user_id()    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.current_staff_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.current_branch_id()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.is_org_staff()       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.is_admin()           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.current_customer_id() TO authenticated, service_role;

-- Comments
COMMENT ON FUNCTION veyra_private.current_clerk_id()    IS 'Returns Clerk JWT sub claim. SECURITY INVOKER.';
COMMENT ON FUNCTION veyra_private.current_user_id()     IS 'Maps Clerk sub -> users.id. SECURITY DEFINER. Used in RLS policies.';
COMMENT ON FUNCTION veyra_private.current_staff_role()  IS 'Returns active staff role for current user. NULL if not staff. Used in RLS.';
COMMENT ON FUNCTION veyra_private.current_branch_id()   IS 'Returns branch_id for branch-scoped staff only. NULL for org-wide staff/customers.';
COMMENT ON FUNCTION veyra_private.is_org_staff()        IS 'True if user is fleet_manager, support, finance, admin, or superadmin.';
COMMENT ON FUNCTION veyra_private.is_admin()            IS 'True if user is admin or superadmin.';
COMMENT ON FUNCTION veyra_private.current_customer_id() IS 'Returns customers.id for current user. NULL if not a customer.';


-- >>> 16_triggers.sql <<<
-- ============================================================
-- Veyra -- Triggers: updated_at (16)
-- Auto-maintain updated_at on all tables that have it.
-- ============================================================

-- ------------------------------------
-- Generic updated_at trigger function
-- ------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger function: sets updated_at = NOW() on UPDATE.';

-- ------------------------------------
-- Attach trigger to all tables with updated_at
-- ------------------------------------

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_staff_users_updated_at
  BEFORE UPDATE ON public.staff_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_vehicle_classes_updated_at
  BEFORE UPDATE ON public.vehicle_classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_availability_blocks_updated_at
  BEFORE UPDATE ON public.availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_extras_updated_at
  BEFORE UPDATE ON public.extras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_rate_plans_updated_at
  BEFORE UPDATE ON public.rate_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_deposits_updated_at
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_customer_documents_updated_at
  BEFORE UPDATE ON public.customer_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_damage_reports_updated_at
  BEFORE UPDATE ON public.damage_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_maintenance_records_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_webhook_events_updated_at
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------
-- Security / Column-Level Protection Triggers
-- Prevents customers from modifying protected system columns
-- (e.g. membership_number, total_rentals, verification_status, pricing, etc.)
-- ------------------------------------

CREATE OR REPLACE FUNCTION public.protect_customer_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
BEGIN
  -- If not staff/admin, customer cannot alter system/protected columns
  IF veyra_private.current_staff_role() IS NULL THEN
    NEW.user_id             := OLD.user_id;
    NEW.membership_number   := OLD.membership_number;
    NEW.membership_tier     := OLD.membership_tier;
    NEW.total_rentals       := OLD.total_rentals;
    NEW.verification_status := OLD.verification_status;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_customer_columns() IS
  'Trigger function: enforces immutability of system-controlled customer fields against customer self-updates.';

CREATE OR REPLACE TRIGGER trg_customers_protect_columns
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.protect_customer_columns();

CREATE OR REPLACE FUNCTION public.protect_reservation_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
BEGIN
  -- If non-staff user is updating (e.g. customer self-cancellation),
  -- lock down financial, vehicle assignment, and operational fields.
  IF veyra_private.current_staff_role() IS NULL THEN
    NEW.customer_id         := OLD.customer_id;
    NEW.quote_id            := OLD.quote_id;
    NEW.vehicle_id          := OLD.vehicle_id;
    NEW.assigned_vehicle_id := OLD.assigned_vehicle_id;
    NEW.pickup_location_id  := OLD.pickup_location_id;
    NEW.return_location_id  := OLD.return_location_id;
    NEW.pickup_at           := OLD.pickup_at;
    NEW.return_at           := OLD.return_at;
    NEW.total_amount        := OLD.total_amount;
    NEW.deposit_amount      := OLD.deposit_amount;
    NEW.currency            := OLD.currency;
    NEW.payment_status      := OLD.payment_status;
    NEW.internal_notes      := OLD.internal_notes;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_reservation_columns() IS
  'Trigger function: locks down financial and operational fields on reservations when updated by customer self-service.';

CREATE OR REPLACE TRIGGER trg_reservations_protect_columns
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.protect_reservation_columns();



-- >>> 17_rls.sql <<<
-- ============================================================
-- Veyra -- Row-Level Security Policies (17)
-- SECURITY MODEL:
--   1. Primary authorization: Next.js Server Actions / Route Handlers
--   2. RLS: Database-level enforcement layer (defense-in-depth)
-- PATTERN: Clerk Native Third-Party Auth
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_classes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_features       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_extras           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_extras     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_drivers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue     ENABLE ROW LEVEL SECURITY;

-- EXPLICIT REVOKES: Belt-and-suspenders protection
REVOKE INSERT, UPDATE, DELETE ON public.webhook_events  FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_events    FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments        FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.refunds         FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.deposits        FROM authenticated;

-- 1. USERS
CREATE POLICY "users: own row select"       ON public.users FOR SELECT TO authenticated USING (id = veyra_private.current_user_id());
CREATE POLICY "users: admin select all"     ON public.users FOR SELECT TO authenticated USING (veyra_private.is_admin());
CREATE POLICY "users: support select"       ON public.users FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support', 'finance', 'admin', 'superadmin'));

-- 2. CUSTOMERS
CREATE POLICY "customers: own row select"   ON public.customers FOR SELECT TO authenticated USING (user_id = veyra_private.current_user_id());
CREATE POLICY "customers: staff select"     ON public.customers FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support', 'finance', 'admin', 'superadmin'));
CREATE POLICY "customers: own row update"   ON public.customers FOR UPDATE TO authenticated USING (user_id = veyra_private.current_user_id()) WITH CHECK (user_id = veyra_private.current_user_id());
CREATE POLICY "customers: admin update"     ON public.customers FOR UPDATE TO authenticated USING (veyra_private.is_admin()) WITH CHECK (veyra_private.is_admin());

-- 3. STAFF_USERS
CREATE POLICY "staff_users: own row select" ON public.staff_users FOR SELECT TO authenticated USING (user_id = veyra_private.current_user_id());
CREATE POLICY "staff_users: admin select"   ON public.staff_users FOR SELECT TO authenticated USING (veyra_private.is_admin());

-- 4. BRANCHES
CREATE POLICY "branches: anon read active"  ON public.branches FOR SELECT TO anon         USING (status = 'active');
CREATE POLICY "branches: auth read"         ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "branches: admin write"       ON public.branches FOR ALL    TO authenticated USING (veyra_private.is_admin()) WITH CHECK (veyra_private.is_admin());

-- 5. LOCATIONS
CREATE POLICY "locations: anon read active" ON public.locations FOR SELECT TO anon         USING (status = 'active');
CREATE POLICY "locations: auth read"        ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "locations: admin write"      ON public.locations FOR ALL    TO authenticated USING (veyra_private.is_admin()) WITH CHECK (veyra_private.is_admin());

-- 6. VEHICLE_CLASSES
CREATE POLICY "vehicle_classes: anon read"          ON public.vehicle_classes FOR SELECT TO anon         USING (true);
CREATE POLICY "vehicle_classes: auth read"          ON public.vehicle_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicle_classes: fleet mgr write"    ON public.vehicle_classes FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));

-- 7. VEHICLES (sensitive Ã¢â‚¬â€ no anon access; use vehicle_catalog view)
CREATE POLICY "vehicles: fleet mgr write"
  ON public.vehicles FOR ALL TO authenticated
  USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'))
  WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));

CREATE POLICY "vehicles: staff read"
  ON public.vehicles FOR SELECT TO authenticated
  USING (veyra_private.current_staff_role() IN ('fleet_manager','support','admin','superadmin'));

CREATE POLICY "vehicles: branch staff read own branch"
  ON public.vehicles FOR SELECT TO authenticated
  USING (
    veyra_private.current_staff_role() IN ('branch_staff','branch_manager')
    AND branch_id = veyra_private.current_branch_id()
  );

CREATE POLICY "vehicles: branch staff status update"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND branch_id = veyra_private.current_branch_id())
  WITH CHECK (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND branch_id = veyra_private.current_branch_id());

-- 8. VEHICLE_FEATURES
CREATE POLICY "vehicle_features: anon read"       ON public.vehicle_features FOR SELECT TO anon         USING (true);
CREATE POLICY "vehicle_features: auth read"        ON public.vehicle_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicle_features: fleet mgr write"  ON public.vehicle_features FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));

-- 9. VEHICLE_PHOTOS
CREATE POLICY "vehicle_photos: anon marketing"     ON public.vehicle_photos FOR SELECT TO anon         USING (type = 'marketing');
CREATE POLICY "vehicle_photos: staff read all"     ON public.vehicle_photos FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);
CREATE POLICY "vehicle_photos: customer marketing" ON public.vehicle_photos FOR SELECT TO authenticated USING (type = 'marketing' AND veyra_private.current_staff_role() IS NULL AND veyra_private.current_customer_id() IS NOT NULL);
CREATE POLICY "vehicle_photos: fleet mgr write"    ON public.vehicle_photos FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "vehicle_photos: branch staff upload" ON public.vehicle_photos FOR INSERT TO authenticated WITH CHECK (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND type IN ('inspection','damage'));

-- 10. AVAILABILITY_BLOCKS
CREATE POLICY "availability_blocks: fleet read"    ON public.availability_blocks FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "availability_blocks: branch read"   ON public.availability_blocks FOR SELECT TO authenticated
  USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.branch_id = veyra_private.current_branch_id()));
CREATE POLICY "availability_blocks: fleet write"   ON public.availability_blocks FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "availability_blocks: br mgr insert" ON public.availability_blocks FOR INSERT TO authenticated
  WITH CHECK (veyra_private.current_staff_role() = 'branch_manager' AND type IN ('cleaning','hold') AND EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.branch_id = veyra_private.current_branch_id()));

-- 11. EXTRAS
CREATE POLICY "extras: anon read active"       ON public.extras FOR SELECT TO anon         USING (is_active = true);
CREATE POLICY "extras: auth read"              ON public.extras FOR SELECT TO authenticated USING (true);
CREATE POLICY "extras: finance admin write"    ON public.extras FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));

-- 12. RATE_PLANS
CREATE POLICY "rate_plans: staff read"         ON public.rate_plans FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);
CREATE POLICY "rate_plans: finance admin write" ON public.rate_plans FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));

-- 13. QUOTES (immutable after creation)
CREATE POLICY "quotes: own select"             ON public.quotes FOR SELECT TO authenticated USING (customer_id = veyra_private.current_customer_id());
CREATE POLICY "quotes: staff select"           ON public.quotes FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support','finance','branch_staff','branch_manager','admin','superadmin'));
CREATE POLICY "quotes: own insert"             ON public.quotes FOR INSERT TO authenticated WITH CHECK (customer_id = veyra_private.current_customer_id());
CREATE POLICY "quote_extras: own select"       ON public.quote_extras FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "quote_extras: staff select"     ON public.quote_extras FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);

-- 14. RESERVATIONS
CREATE POLICY "reservations: own select"
  ON public.reservations FOR SELECT TO authenticated USING (customer_id = veyra_private.current_customer_id());

CREATE POLICY "reservations: branch staff select"
  ON public.reservations FOR SELECT TO authenticated
  USING (
    veyra_private.current_staff_role() IN ('branch_staff','branch_manager')
    AND (pickup_location_id IN (SELECT id FROM public.locations WHERE branch_id = veyra_private.current_branch_id())
      OR return_location_id IN (SELECT id FROM public.locations WHERE branch_id = veyra_private.current_branch_id()))
  );

CREATE POLICY "reservations: org staff select"
  ON public.reservations FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support','finance','admin','superadmin'));

CREATE POLICY "reservations: customer insert"
  ON public.reservations FOR INSERT TO authenticated WITH CHECK (customer_id = veyra_private.current_customer_id());

CREATE POLICY "reservations: customer cancel"
  ON public.reservations FOR UPDATE TO authenticated
  USING (customer_id = veyra_private.current_customer_id() AND status IN ('draft','quote_created','confirmed'))
  WITH CHECK (customer_id = veyra_private.current_customer_id() AND status = 'cancelled');

CREATE POLICY "reservations: branch mgr update"
  ON public.reservations FOR UPDATE TO authenticated
  USING (veyra_private.current_staff_role() = 'branch_manager' AND pickup_location_id IN (SELECT id FROM public.locations WHERE branch_id = veyra_private.current_branch_id()))
  WITH CHECK (veyra_private.current_staff_role() = 'branch_manager');

CREATE POLICY "reservations: branch staff update"
  ON public.reservations FOR UPDATE TO authenticated
  USING (veyra_private.current_staff_role() = 'branch_staff' AND pickup_location_id IN (SELECT id FROM public.locations WHERE branch_id = veyra_private.current_branch_id()))
  WITH CHECK (veyra_private.current_staff_role() = 'branch_staff');

CREATE POLICY "reservations: admin update"
  ON public.reservations FOR UPDATE TO authenticated USING (veyra_private.is_admin()) WITH CHECK (veyra_private.is_admin());

-- Reservation sub-tables
CREATE POLICY "reservation_extras: own select"       ON public.reservation_extras  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "reservation_extras: staff select"     ON public.reservation_extras  FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);
CREATE POLICY "reservation_drivers: own select"      ON public.reservation_drivers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "reservation_drivers: staff select"    ON public.reservation_drivers FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);
CREATE POLICY "reservation_drivers: customer insert" ON public.reservation_drivers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id() AND r.status IN ('draft','quote_created','held','confirmed')));

-- 15. PAYMENTS / REFUNDS / DEPOSITS (read-only for clients; write = service_role only)
CREATE POLICY "payments: own select"   ON public.payments FOR SELECT TO authenticated USING (customer_id = veyra_private.current_customer_id());
CREATE POLICY "payments: finance read" ON public.payments FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));
CREATE POLICY "refunds: own select"    ON public.refunds  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND p.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "refunds: finance read"  ON public.refunds  FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));
CREATE POLICY "deposits: own select"   ON public.deposits FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "deposits: finance read" ON public.deposits FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));

-- 16. CUSTOMER_DOCUMENTS (support/admin approve; no branch staff or fleet access)
CREATE POLICY "customer_documents: own select"   ON public.customer_documents FOR SELECT TO authenticated USING (customer_id = veyra_private.current_customer_id());
CREATE POLICY "customer_documents: support read" ON public.customer_documents FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support','admin','superadmin'));
CREATE POLICY "customer_documents: own insert"   ON public.customer_documents FOR INSERT TO authenticated WITH CHECK (customer_id = veyra_private.current_customer_id());
CREATE POLICY "customer_documents: support update" ON public.customer_documents FOR UPDATE TO authenticated USING (veyra_private.current_staff_role() IN ('support','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('support','admin','superadmin'));

-- 17. INSPECTIONS
CREATE POLICY "inspections: own reservation select" ON public.inspections FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "inspections: staff select"           ON public.inspections FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','support','admin','superadmin'));
CREATE POLICY "inspections: branch staff write"     ON public.inspections FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','admin','superadmin'));
CREATE POLICY "check_items: staff write"            ON public.inspection_check_items FOR ALL TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','admin','superadmin'));

-- 18. DAMAGE_REPORTS
CREATE POLICY "damage_reports: own select"     ON public.damage_reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "damage_reports: staff select"   ON public.damage_reports FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','finance','support','admin','superadmin'));
CREATE POLICY "damage_reports: br mgr write"   ON public.damage_reports FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('branch_manager','fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('branch_manager','fleet_manager','admin','superadmin'));
CREATE POLICY "damage_reports: finance update" ON public.damage_reports FOR UPDATE TO authenticated USING (veyra_private.current_staff_role() = 'finance') WITH CHECK (veyra_private.current_staff_role() = 'finance');

-- 19. MAINTENANCE_RECORDS
CREATE POLICY "maintenance: branch staff read"  ON public.maintenance_records FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND branch_id = veyra_private.current_branch_id());
CREATE POLICY "maintenance: fleet read"         ON public.maintenance_records FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "maintenance: fleet write"        ON public.maintenance_records FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "maintenance: branch mgr write"   ON public.maintenance_records FOR ALL    TO authenticated USING (veyra_private.current_staff_role() = 'branch_manager' AND branch_id = veyra_private.current_branch_id()) WITH CHECK (veyra_private.current_staff_role() = 'branch_manager' AND branch_id = veyra_private.current_branch_id());

-- 20. WEBHOOK_EVENTS (no client policies; service_role only)

-- 21. AUDIT_EVENTS (append-only; SELECT only for authenticated)
CREATE POLICY "audit_events: own actor select" ON public.audit_events FOR SELECT TO authenticated USING (actor_id = veyra_private.current_user_id());
CREATE POLICY "audit_events: admin select all" ON public.audit_events FOR SELECT TO authenticated USING (veyra_private.is_admin());

-- 22. NOTIFICATION_QUEUE
CREATE POLICY "notification_queue: own select"  ON public.notification_queue FOR SELECT TO authenticated USING (user_id = veyra_private.current_user_id());
CREATE POLICY "notification_queue: admin select" ON public.notification_queue FOR SELECT TO authenticated USING (veyra_private.is_admin());


-- >>> 18_public_catalog.sql <<<
-- ============================================================
-- Veyra -- Public Vehicle Catalog View (18)
-- Customer-facing safe vehicle view.
-- Excludes sensitive/operational data:
--   vin, plate_number, internal_notes, odometer_km,
--   acquisition_date, next_maintenance_due, next_maintenance_odometer
--
-- Security Model:
--   - public.vehicles has NO SELECT policy for anon or regular customers.
--   - This view acts as a secure projection boundary.
--   - Granted to anon and authenticated roles.
-- ============================================================

CREATE OR REPLACE VIEW public.vehicle_catalog AS
SELECT
  v.id,
  v.vehicle_class_id,
  v.branch_id,
  v.make,
  v.model,
  v.year,
  v.color,
  v.transmission,
  v.fuel_type,
  v.seats,
  v.luggage_capacity,
  v.doors,
  v.daily_rate,
  v.currency,
  v.security_deposit,
  v.mileage_allowance_km,
  v.excess_mileage_rate,
  v.fleet_status,
  v.created_at
FROM public.vehicles v
JOIN public.branches b ON b.id = v.branch_id
WHERE v.deleted_at IS NULL
  AND v.fleet_status != 'retired'
  AND b.status = 'active';

COMMENT ON VIEW public.vehicle_catalog IS
  'Customer-safe vehicle catalog view. Excludes VIN, plate number, odometer, internal notes, and maintenance schedules.';

-- Grant read access to public roles
GRANT SELECT ON public.vehicle_catalog TO anon, authenticated;


