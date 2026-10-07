-- Migration: 20261008000000_vehicle_images.sql
-- Description: Vehicle images table for multi-photo gallery and primary marketing photos.

CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  alt_text     TEXT,
  sort_order   INT         NOT NULL DEFAULT 0,
  is_primary   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id 
  ON public.vehicle_images (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_sort_order 
  ON public.vehicle_images (vehicle_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_primary 
  ON public.vehicle_images (vehicle_id, is_primary) 
  WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anon can read all vehicle images (for public catalog & detail page)
CREATE POLICY "vehicle_images: anon read" 
  ON public.vehicle_images FOR SELECT 
  TO anon 
  USING (true);

-- Authenticated customers & staff can read all vehicle images
CREATE POLICY "vehicle_images: auth read" 
  ON public.vehicle_images FOR SELECT 
  TO authenticated 
  USING (true);

-- Staff (fleet_manager, admin, superadmin) can insert, update, delete
CREATE POLICY "vehicle_images: staff write" 
  ON public.vehicle_images FOR ALL 
  TO authenticated 
  USING (veyra_private.current_staff_role() IN ('fleet_manager', 'admin', 'superadmin'))
  WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager', 'admin', 'superadmin'));

-- Ensure permissions
GRANT SELECT ON public.vehicle_images TO anon, authenticated;
GRANT ALL ON public.vehicle_images TO service_role;

-- Storage RLS policy for vehicles-marketing bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
      AND schemaname = 'storage' 
      AND policyname = 'vehicles_marketing_public_read'
  ) THEN
    CREATE POLICY "vehicles_marketing_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'vehicles-marketing');
  END IF;
END $$;
