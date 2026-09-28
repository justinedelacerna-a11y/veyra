-- ============================================================
-- Veyra -- Extensions & Private Schema
-- Order: 00 (must run before all other schemas)
-- ============================================================

-- ------------------------------------
-- Required extensions
-- ------------------------------------

-- gen_random_uuid() for all UUID primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- btree_gist: enables GiST indexes on scalar types (vehicle_id UUID)
-- combined with range types. Required for availability overlap queries.
-- Ref: docs/database/indexes.md section 2 (GiST range overlap indexes)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- pg_trgm: enables GIN trigram indexes for fuzzy text search
-- Used for: vehicle catalog search, customer name/email search
-- Ref: docs/database/indexes.md section 4 (full-text & trigram search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- NOTE: pg_stat_statements is enabled by default in Supabase cloud.
-- It is NOT declared here to avoid local/cloud environment conflicts.
-- NOTE: unaccent is not used in the Veyra schema and is not declared.

-- ------------------------------------
-- Private schema for helper functions
-- Not exposed via PostgREST API.
-- Contains SECURITY DEFINER RLS helper functions.
-- ------------------------------------
CREATE SCHEMA IF NOT EXISTS veyra_private;

-- Revoke access to the private schema from PUBLIC and anon.
-- Not exposed via PostgREST (schemas config only exposes public, graphql_public).
REVOKE ALL ON SCHEMA veyra_private FROM PUBLIC;
REVOKE ALL ON SCHEMA veyra_private FROM anon;

-- authenticated and service_role require USAGE to evaluate RLS policy helper functions
GRANT USAGE ON SCHEMA veyra_private TO authenticated, service_role;

