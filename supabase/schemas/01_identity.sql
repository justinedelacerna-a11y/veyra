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
