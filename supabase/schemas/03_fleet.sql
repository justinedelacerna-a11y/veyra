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

COMMENT ON TABLE  public.vehicles            IS 'Individual physical fleet vehicles. Sensitive fields not exposed to anon via RLS — use vehicle_catalog view instead.';
COMMENT ON COLUMN public.vehicles.daily_rate IS 'Daily rate in centavos; overrides vehicle_class.base_daily_rate.';
COMMENT ON COLUMN public.vehicles.vin        IS 'SENSITIVE: staff-only. 17-character VIN number.';
COMMENT ON COLUMN public.vehicles.plate_number IS 'SENSITIVE: staff-only. Vehicle license plate.';
COMMENT ON COLUMN public.vehicles.deleted_at IS 'Soft retire. NULL = active in fleet.';

-- ------------------------------------
-- vehicle_features
-- Many-to-many: features per vehicle.
-- No sensitive data — safe for public read.
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
