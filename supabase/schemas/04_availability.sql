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
-- Query pattern: WHERE vehicle_id = $v AND tsrange(starts_at, ends_at, '[)') && tsrange($pickup, $return, '[)')
-- Ref: docs/database/indexes.md section 2.2
CREATE INDEX IF NOT EXISTS idx_availability_blocks_gist
  ON public.availability_blocks USING gist (
    vehicle_id,
    tsrange(starts_at, ends_at, '[)')
  );

COMMENT ON TABLE  public.availability_blocks          IS 'Explicit vehicle availability blocks for maintenance, holds, cleaning, etc. Uses half-open [) intervals.';
COMMENT ON COLUMN public.availability_blocks.starts_at IS 'Inclusive start of block in UTC.';
COMMENT ON COLUMN public.availability_blocks.ends_at   IS 'Exclusive end of block in UTC. Half-open [) interval semantics.';
