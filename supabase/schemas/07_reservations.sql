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
--   draft → quote_created → held → payment_pending → confirmed
--   → pickup_ready → active → return_inspection → completed
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
