-- Migration: 20261018020000_unlimited_rental_duration.sql
-- Description: Update rental_duration system setting to explicitly represent an unlimited maximum duration (max_days = null) by default.

UPDATE public.system_settings
SET value = jsonb_set(value, '{max_days}', 'null'::jsonb),
    description = 'Configures the minimum and maximum rental duration in days for customer bookings (null = unlimited).',
    updated_at = NOW()
WHERE key = 'rental_duration'
  AND (value->>'max_days' = '30' OR value->'max_days' IS NULL);
