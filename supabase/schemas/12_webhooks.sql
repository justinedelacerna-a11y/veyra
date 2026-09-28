-- ============================================================
-- Veyra -- Webhook Events (12)
-- Tables: webhook_events
-- ============================================================

-- ------------------------------------
-- webhook_events
-- Inbound webhook events from external providers (PayMongo, Clerk).
-- Processed idempotently using (provider, provider_event_id).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT        NOT NULL CHECK (provider IN ('paymongo','clerk')),
  event_type        TEXT        NOT NULL,         -- e.g. 'payment.paid', 'user.created'
  provider_event_id TEXT        NOT NULL,         -- provider-issued unique event ID
  payload           JSONB       NOT NULL,         -- raw event body
  status            TEXT        NOT NULL DEFAULT 'received' CHECK (status IN ('received','processing','processed','failed','ignored')),
  processed_at      TIMESTAMPTZ NULL,
  failure_reason    TEXT        NULL,
  retry_count       SMALLINT    NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Deduplication: one record per provider event
  CONSTRAINT uq_webhook_events_provider_event UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider   ON public.webhook_events (provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status     ON public.webhook_events (status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events (created_at);

COMMENT ON TABLE  public.webhook_events IS 'Inbound webhook events from PayMongo and Clerk. Processed idempotently.';
COMMENT ON COLUMN public.webhook_events.provider_event_id IS 'Provider-assigned unique event ID. Used for deduplication.';
