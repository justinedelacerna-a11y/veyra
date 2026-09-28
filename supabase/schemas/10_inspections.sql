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
