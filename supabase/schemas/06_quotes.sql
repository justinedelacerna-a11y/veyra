-- ============================================================
-- Veyra -- Quotes (06)
-- Tables: quotes, quote_extras
-- ============================================================

-- ------------------------------------
-- quotes
-- Immutable price snapshot presented to customer before booking.
-- Once created, never updated (pricing integrity).
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.quotes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID        NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  vehicle_id          UUID        NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,
  pickup_location_id  UUID        NOT NULL REFERENCES public.locations (id) ON DELETE RESTRICT,
  return_location_id  UUID        NOT NULL REFERENCES public.locations (id) ON DELETE RESTRICT,
  pickup_at           TIMESTAMPTZ NOT NULL,   -- UTC
  return_at           TIMESTAMPTZ NOT NULL,   -- UTC
  rental_days         SMALLINT    NOT NULL,
  daily_rate          BIGINT      NOT NULL,   -- centavos at time of quote
  base_rental         BIGINT      NOT NULL,   -- centavos
  extras_subtotal     BIGINT      NOT NULL DEFAULT 0,  -- centavos
  discount_amount     BIGINT      NOT NULL DEFAULT 0,  -- centavos
  tax_amount          BIGINT      NOT NULL DEFAULT 0,  -- centavos
  subtotal            BIGINT      NOT NULL,   -- centavos
  total_rental        BIGINT      NOT NULL,   -- centavos (final)
  security_deposit    BIGINT      NOT NULL,   -- centavos
  currency            CHAR(3)     NOT NULL DEFAULT 'PHP',
  pricing_version     TEXT        NOT NULL,   -- hash or version tag of pricing rules
  status              TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','converted','cancelled')),
  expires_at          TIMESTAMPTZ NOT NULL,   -- typically 30 min after creation
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_quote_interval CHECK (return_at > pickup_at),
  CONSTRAINT chk_quote_rental_days CHECK (rental_days > 0)
);

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle_id  ON public.quotes (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status      ON public.quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_expires_at  ON public.quotes (expires_at);

COMMENT ON TABLE  public.quotes IS 'Immutable price snapshot presented to customer before booking confirmation. Never updated after creation.';

-- ------------------------------------
-- quote_extras
-- Line items for extras included in a quote.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.quote_extras (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID    NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  extra_id    UUID    NOT NULL REFERENCES public.extras (id) ON DELETE RESTRICT,
  extra_name  TEXT    NOT NULL,   -- snapshot at time of quote
  daily_rate  BIGINT  NOT NULL,   -- centavos; snapshot
  total       BIGINT  NOT NULL    -- centavos
);

CREATE INDEX IF NOT EXISTS idx_quote_extras_quote_id ON public.quote_extras (quote_id);

COMMENT ON TABLE  public.quote_extras IS 'Extra line items included in a quote. Prices are immutable snapshots.';
