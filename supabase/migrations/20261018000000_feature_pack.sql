-- ============================================================
-- Migration: 20261018000000_feature_pack.sql
-- Feature Pack: Manual Pickup Address, Rental Duration Config,
--               Terms of Service, Interactive Map Coordinates
-- ============================================================

-- ============================================================
-- 1. MANUAL PICKUP ADDRESS (Feature 1)
-- Add customer address fields to reservations table.
-- These are optional details the customer provides to help
-- staff locate the handover point within the selected barangay.
-- ============================================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS pickup_street_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS pickup_landmark       TEXT NULL,
  ADD COLUMN IF NOT EXISTS pickup_contact_phone  TEXT NULL;

COMMENT ON COLUMN public.reservations.pickup_street_address IS
  'Customer-provided street address or complete address within the selected barangay. Optional.';
COMMENT ON COLUMN public.reservations.pickup_landmark IS
  'Nearby landmark or additional pickup instructions. Optional.';
COMMENT ON COLUMN public.reservations.pickup_contact_phone IS
  'Contact number override for this reservation. Falls back to customer profile phone.';

-- ============================================================
-- 2. SYSTEM SETTINGS (Feature 2 — Rental Duration Config)
-- Key-value store for admin-configurable platform settings.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key                TEXT        PRIMARY KEY,
  value              JSONB       NOT NULL,
  description        TEXT        NULL,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_staff_id UUID       NULL REFERENCES public.staff_users (id) ON DELETE SET NULL
);

COMMENT ON TABLE  public.system_settings IS 'Admin-configurable platform settings. Keys are stable identifiers; values are typed JSON objects.';
COMMENT ON COLUMN public.system_settings.key IS 'Stable setting key, e.g. rental_duration, service_area.';
COMMENT ON COLUMN public.system_settings.value IS 'Typed JSON object. Schema is documented per key.';

-- Seed default rental duration configuration
-- min_days: minimum number of days a customer can rent
-- max_days: maximum number of days a customer can rent (null = no upper limit)
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'rental_duration',
  '{"min_days": 1, "max_days": 30}'::jsonb,
  'Configures the minimum and maximum rental duration in days for customer bookings. Enforced server-side on quote and reservation creation.'
)
ON CONFLICT (key) DO NOTHING;

-- RLS: Only staff can read/write system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_settings_staff_select"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = (auth.jwt() ->> 'sub')
        AND u.user_type = 'staff'
        AND u.status = 'active'
    )
  );

CREATE POLICY "system_settings_staff_write"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.staff_users su ON su.user_id = u.id
      WHERE u.clerk_id = (auth.jwt() ->> 'sub')
        AND u.user_type = 'staff'
        AND u.status = 'active'
        AND su.status = 'active'
        AND su.role IN ('admin', 'superadmin')
    )
  );

-- Grant service_role full access (bypasses RLS for server operations)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO service_role;

-- ============================================================
-- 3. TERMS OF SERVICE (Feature 4)
-- Versioned terms and customer acceptance records.
-- ============================================================

-- terms_versions: Immutable version registry. Each published version
-- is permanent; acceptance records reference a specific version.
CREATE TABLE IF NOT EXISTS public.terms_versions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  version     TEXT        NOT NULL UNIQUE,  -- e.g. "v1.0", "v1.1"
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_current  BOOLEAN     NOT NULL DEFAULT false,
  summary     TEXT        NULL,   -- human description of changes
  created_by_staff_id UUID NULL REFERENCES public.staff_users (id) ON DELETE SET NULL
);

COMMENT ON TABLE  public.terms_versions IS 'Versioned Terms of Service records. Acceptance records reference specific versions.';
COMMENT ON COLUMN public.terms_versions.is_current IS 'Exactly one row should have is_current=true. Changing the current version does NOT invalidate prior acceptances.';

-- Seed initial version
INSERT INTO public.terms_versions (id, version, is_current, summary)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'v1.0',
  true,
  'Initial Terms of Service for Veyra Car Rental, Butuan City. Covers eligibility, KYC, booking, pickup/return, payments, and prohibited uses.'
)
ON CONFLICT (id) DO NOTHING;

-- terms_acceptances: Immutable customer acceptance records.
-- One row per customer per reservation (reservation_id may be null for standalone accepts).
CREATE TABLE IF NOT EXISTS public.terms_acceptances (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID        NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  terms_version_id    UUID        NOT NULL REFERENCES public.terms_versions (id) ON DELETE RESTRICT,
  reservation_id      UUID        NULL REFERENCES public.reservations (id) ON DELETE SET NULL,
  accepted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash             TEXT        NULL,   -- SHA-256 of client IP; never store raw IP

  -- Prevent duplicate acceptance of same version for same reservation
  CONSTRAINT uq_terms_acceptance UNIQUE (customer_id, terms_version_id, reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptances_customer_id ON public.terms_acceptances (customer_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_reservation_id ON public.terms_acceptances (reservation_id);

COMMENT ON TABLE  public.terms_acceptances IS 'Immutable record of customer acceptance of a specific Terms of Service version.';
COMMENT ON COLUMN public.terms_acceptances.ip_hash IS 'SHA-256 of client IP address. Raw IP is never stored.';

-- RLS: Customers can read their own acceptances; staff can read all
ALTER TABLE public.terms_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Terms versions: anyone (including anon) can read current version metadata
CREATE POLICY "terms_versions_anon_select"
  ON public.terms_versions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Terms acceptances: customer can read their own
CREATE POLICY "terms_acceptances_customer_select"
  ON public.terms_acceptances
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT c.id FROM public.customers c
      JOIN public.users u ON u.id = c.user_id
      WHERE u.clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- Terms acceptances: customers can insert their own (service_role inserts on their behalf)
-- Insertions are performed by the server via service_role, so no authenticated insert policy is needed.
-- service_role bypasses RLS entirely.

GRANT SELECT ON public.terms_versions   TO anon, authenticated;
GRANT SELECT ON public.terms_acceptances TO authenticated;
GRANT SELECT, INSERT ON public.terms_acceptances TO service_role;
GRANT SELECT ON public.terms_versions TO service_role;

-- ============================================================
-- 4. INTERACTIVE MAP COORDINATES (Feature 6)
-- Add geographic coordinates to locations for map display.
-- Coordinates are in decimal degrees (WGS84).
-- ============================================================

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10,8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) NULL;

COMMENT ON COLUMN public.locations.latitude  IS 'Decimal latitude (WGS84). Used for interactive map marker placement.';
COMMENT ON COLUMN public.locations.longitude IS 'Decimal longitude (WGS84). Used for interactive map marker placement.';

-- Seed verified coordinates for the 8 Butuan City barangay hubs.
-- Coordinates verified against OpenStreetMap / Google Maps for Butuan City.
UPDATE public.locations SET
  latitude  =  8.9450,
  longitude = 125.5454
WHERE id = '10c00000-0000-0000-0000-000000000001'; -- Barangay Libertad Hub

UPDATE public.locations SET
  latitude  =  8.9563,
  longitude = 125.6012
WHERE id = '10c00000-0000-0000-0000-000000000011'; -- Barangay Ampayon Hub

UPDATE public.locations SET
  latitude  =  8.9370,
  longitude = 125.5750
WHERE id = '10c00000-0000-0000-0000-000000000012'; -- Barangay Villa Kananga Hub

UPDATE public.locations SET
  latitude  =  8.9498,
  longitude = 125.5447
WHERE id = '10c00000-0000-0000-0000-000000000013'; -- Barangay San Vicente Hub

UPDATE public.locations SET
  latitude  =  8.9480,
  longitude = 125.5430
WHERE id = '10c00000-0000-0000-0000-000000000014'; -- Barangay J.P. Rizal Hub

UPDATE public.locations SET
  latitude  =  8.9420,
  longitude = 125.5700
WHERE id = '10c00000-0000-0000-0000-000000000015'; -- Barangay Baan Km. 3 Hub

UPDATE public.locations SET
  latitude  =  8.9510,
  longitude = 125.5480
WHERE id = '10c00000-0000-0000-0000-000000000016'; -- Barangay Dagohoy Hub

UPDATE public.locations SET
  latitude  =  8.9490,
  longitude = 125.5465
WHERE id = '10c00000-0000-0000-0000-000000000017'; -- Barangay Leon Kilat Hub

-- ============================================================
-- 5. STRIPE PAYMENT SUPPORT (Feature 3)
-- Add stripe_session_id to payments table if it exists,
-- and ensure webhook_events table can track Stripe events.
-- ============================================================

-- Add stripe session tracking to reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS stripe_session_id   TEXT NULL,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT NULL;

COMMENT ON COLUMN public.reservations.stripe_session_id IS 'Stripe Checkout Session ID. Used to correlate webhook events.';
COMMENT ON COLUMN public.reservations.stripe_payment_intent IS 'Stripe PaymentIntent ID. Set after payment confirmation.';

-- Ensure reservation_id column exists on existing webhook_events table
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS reservation_id UUID NULL REFERENCES public.reservations (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_events_reservation_id ON public.webhook_events (reservation_id);

-- ============================================================
-- 6. Refresh vehicle_catalog view to include lat/lng
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
  v.created_at,
  v.location_id,
  l.barangay,
  l.name AS location_name,
  l.latitude,
  l.longitude
FROM public.vehicles v
JOIN public.branches b ON b.id = v.branch_id
LEFT JOIN public.locations l ON l.id = v.location_id
WHERE v.deleted_at IS NULL
  AND v.fleet_status != 'retired'
  AND b.status = 'active';

GRANT SELECT ON public.vehicle_catalog TO anon, authenticated;
