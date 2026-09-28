-- ============================================================
-- Veyra -- Notifications (14)
-- Tables: notification_queue
-- ============================================================

-- ------------------------------------
-- notification_queue
-- Outbound notifications to be dispatched by the notification worker.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  channel        TEXT        NOT NULL CHECK (channel IN ('email','sms','in_app','push')),
  event_type     TEXT        NOT NULL,         -- e.g. 'reservation.confirmed'
  template_id    TEXT        NOT NULL,         -- template reference key
  payload        JSONB       NOT NULL,         -- template variables
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  sent_at        TIMESTAMPTZ NULL,
  failure_reason TEXT        NULL,
  retry_count    SMALLINT    NOT NULL DEFAULT 0,
  scheduled_for  TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- allows delayed sends
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id       ON public.notification_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status        ON public.notification_queue (status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON public.notification_queue (scheduled_for)
  WHERE status = 'pending';

COMMENT ON TABLE  public.notification_queue IS 'Outbound notifications awaiting dispatch by the notification worker.';
COMMENT ON COLUMN public.notification_queue.scheduled_for IS 'Earliest send time. Supports delayed and future notifications.';
