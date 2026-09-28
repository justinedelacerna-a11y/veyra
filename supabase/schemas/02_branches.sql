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
