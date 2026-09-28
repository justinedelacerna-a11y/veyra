-- ============================================================
-- Veyra -- Documents (09)
-- Tables: customer_documents
-- ============================================================

-- ------------------------------------
-- customer_documents
-- Identity and verification documents uploaded by customers.
-- Stored in the private Supabase Storage bucket.
-- ------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID        NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  type              TEXT        NOT NULL CHECK (type IN ('driver_license','government_id','address_proof','passport')),
  storage_path      TEXT        NOT NULL,       -- Supabase Storage private path
  original_filename TEXT        NOT NULL,
  mime_type         TEXT        NOT NULL,       -- server-validated
  file_size_bytes   INT         NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','rejected','expired')),
  rejection_reason  TEXT        NULL,
  expires_at        DATE        NULL,           -- document expiry date
  reviewed_by       UUID        NULL REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_customer_id ON public.customer_documents (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type        ON public.customer_documents (customer_id, type);
CREATE INDEX IF NOT EXISTS idx_customer_documents_status      ON public.customer_documents (status);

COMMENT ON TABLE  public.customer_documents              IS 'Identity and verification documents uploaded by customers. Stored in private bucket.';
COMMENT ON COLUMN public.customer_documents.storage_path IS 'Supabase Storage object path in the customer-documents-private bucket.';
