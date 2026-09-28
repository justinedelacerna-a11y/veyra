-- ============================================================
-- Veyra -- Payments (08)
-- Tables: payments, refunds, deposits
--
-- Write access: service_role ONLY.
-- No INSERT/UPDATE policies granted to authenticated role.
-- RLS default-deny prevents any direct client writes.
-- ============================================================

-- ------------------------------------
-- payments
-- Payment transactions associated with reservations.
-- Server-controlled: all writes via service_role (payment webhooks, admin actions).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id      UUID        NOT NULL REFERENCES public.reservations (id) ON DELETE RESTRICT,
  customer_id         UUID        NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  type                TEXT        NOT NULL CHECK (type IN ('rental','deposit','extra_charge','late_fee')),
  amount              BIGINT      NOT NULL CHECK (amount > 0),   -- centavos; must be positive
  currency            CHAR(3)     NOT NULL DEFAULT 'PHP',
  status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','captured','failed','refunded','partially_refunded')),
  method              TEXT        NULL CHECK (method IN ('card','e_wallet','counter','bank_transfer')),
  provider            TEXT        NULL,       -- e.g. 'paymongo'
  provider_payment_id TEXT        NULL,       -- PayMongo intent ID
  provider_txn_ref    TEXT        NULL,       -- payment reference number
  idempotency_key     TEXT        UNIQUE NULL,
  failure_reason      TEXT        NULL,
  notes               TEXT        NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation_id      ON public.payments (reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id         ON public.payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status              ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments (provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_pending_reconcile
  ON public.payments (provider_payment_id, created_at)
  WHERE status = 'pending';

COMMENT ON TABLE  public.payments IS 'Payment transactions. All amounts in centavos. Writes via service_role only.';

-- ------------------------------------
-- refunds
-- Refund records linked to payments.
-- Server-controlled: all writes via service_role (finance-initiated, webhook-confirmed).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id         UUID        NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  reservation_id     UUID        NOT NULL REFERENCES public.reservations (id) ON DELETE RESTRICT,
  amount             BIGINT      NOT NULL CHECK (amount > 0),   -- centavos; must be positive
  currency           CHAR(3)     NOT NULL DEFAULT 'PHP',
  status             TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  reason             TEXT        NOT NULL,
  provider_refund_id TEXT        NULL,
  idempotency_key    TEXT        UNIQUE NULL,
  initiated_by       UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id     ON public.refunds (payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_reservation_id ON public.refunds (reservation_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status         ON public.refunds (status);

COMMENT ON TABLE  public.refunds IS 'Refund records. All amounts in centavos. Initiated by finance/admin; writes via service_role.';

-- ------------------------------------
-- deposits
-- Security deposit tracking (authorization hold).
-- One deposit per reservation (UNIQUE on reservation_id).
-- Server-controlled: all writes via service_role.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.deposits (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   UUID        NOT NULL UNIQUE REFERENCES public.reservations (id) ON DELETE RESTRICT,
  amount           BIGINT      NOT NULL CHECK (amount > 0),   -- centavos; must be positive
  currency         CHAR(3)     NOT NULL DEFAULT 'PHP',
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','held','released','forfeited','partial_release')),
  provider_hold_id TEXT        NULL,
  authorized_at    TIMESTAMPTZ NULL,
  released_at      TIMESTAMPTZ NULL,
  forfeited_amount BIGINT      NULL CHECK (forfeited_amount > 0),   -- centavos; damage charges
  release_notes    TEXT        NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.deposits IS 'Security deposit hold tracking. One record per reservation. Writes via service_role.';
