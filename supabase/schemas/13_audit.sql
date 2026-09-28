-- ============================================================
-- Veyra -- Audit Events (13)
-- Tables: audit_events
-- APPEND-ONLY: no UPDATE or DELETE ever permitted.
-- ============================================================

-- ------------------------------------
-- audit_events
-- Immutable log of all business-significant actions.
-- Permissions: INSERT only for authenticated roles.
-- No RLS UPDATE/DELETE policies are defined for this table.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  actor_role    TEXT        NOT NULL,   -- snapshot of role at time of action
  action        TEXT        NOT NULL,   -- e.g. 'reservation.status_changed'
  resource_type TEXT        NOT NULL,   -- e.g. 'reservation'
  resource_id   TEXT        NOT NULL,   -- UUID of affected resource as text
  result        TEXT        NOT NULL CHECK (result IN ('success', 'failure')),
  details       TEXT        NOT NULL,   -- human-readable summary
  before_state  JSONB       NULL,       -- relevant fields before change
  after_state   JSONB       NULL,       -- relevant fields after change
  ip_address    INET        NULL,
  user_agent    TEXT        NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE: NO updated_at. This table is append-only.
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id      ON public.audit_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action        ON public.audit_events (action);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type ON public.audit_events (resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_id   ON public.audit_events (resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at    ON public.audit_events (created_at DESC);

COMMENT ON TABLE  public.audit_events IS 'Append-only immutable audit log. No UPDATE or DELETE are ever permitted.';
COMMENT ON COLUMN public.audit_events.actor_role IS 'Role snapshot preserved at time of action for historical accuracy.';
COMMENT ON COLUMN public.audit_events.resource_id IS 'UUID stored as TEXT to support any resource type.';
