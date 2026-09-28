-- ============================================================
-- Veyra -- Maintenance (11)
-- Tables: maintenance_records
-- ============================================================

-- ------------------------------------
-- maintenance_records
-- Scheduled and completed maintenance events per vehicle.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id          UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,
  branch_id           UUID        NOT NULL REFERENCES public.branches (id) ON DELETE RESTRICT,
  type                TEXT        NOT NULL CHECK (type IN (
    'routine_service','brake_service','tire_replacement','oil_change',
    'battery_check','ac_service','electrical','bodywork','recall'
  )),
  status              TEXT        NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','due','in_progress','completed','overdue')),
  priority            TEXT        NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  scheduled_date      DATE        NOT NULL,
  completed_date      DATE        NULL,
  odometer_at_service INT         NULL,
  estimated_cost      BIGINT      NULL,   -- centavos
  actual_cost         BIGINT      NULL,   -- centavos
  currency            CHAR(3)     NOT NULL DEFAULT 'PHP',
  provider            TEXT        NULL,   -- service shop name
  notes               TEXT        NULL,
  created_by          UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_vehicle_id     ON public.maintenance_records (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status         ON public.maintenance_records (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_scheduled_date ON public.maintenance_records (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_branch_id      ON public.maintenance_records (branch_id);

COMMENT ON TABLE  public.maintenance_records IS 'Scheduled and completed fleet maintenance events.';
