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
