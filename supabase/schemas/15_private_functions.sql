-- ============================================================
-- Veyra -- Private Helper Functions (15)
-- Schema: veyra_private
-- Used by RLS policies for identity resolution.
-- Clerk Native Third-Party Auth pattern.
-- ============================================================

-- ------------------------------------
-- current_clerk_id()
-- Returns the Clerk user ID (sub claim) from the JWT.
-- SECURITY INVOKER: runs as the calling user, no privilege escalation.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_clerk_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT (auth.jwt() ->> 'sub');
$$;

-- ------------------------------------
-- current_user_id()
-- Maps the Clerk sub claim -> internal users.id UUID.
-- SECURITY DEFINER to safely cross schema boundary.
-- search_path explicitly set to prevent search-path hijacking.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT id
  FROM public.users
  WHERE clerk_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- ------------------------------------
-- current_staff_role()
-- Returns the staff role for the current user, or NULL if customer/unauthenticated.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_staff_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT su.role
  FROM public.staff_users su
  JOIN public.users u ON su.user_id = u.id
  WHERE u.clerk_id = (auth.jwt() ->> 'sub')
    AND su.status = 'active'
  LIMIT 1;
$$;

-- ------------------------------------
-- current_branch_id()
-- Returns the branch UUID for branch-scoped staff.
-- Returns NULL for customers or global staff (fleet_manager, support, finance, admin, superadmin).
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT su.branch_id
  FROM public.staff_users su
  JOIN public.users u ON su.user_id = u.id
  WHERE u.clerk_id = (auth.jwt() ->> 'sub')
    AND su.status = 'active'
    AND su.role IN ('branch_staff', 'branch_manager')  -- only branch-scoped roles have branch_id
  LIMIT 1;
$$;

-- ------------------------------------
-- is_org_staff()
-- Returns true if the current user is an org-wide staff member.
-- Roles: fleet_manager, support, finance, admin, superadmin
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.is_org_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_users su
    JOIN public.users u ON su.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
      AND su.status = 'active'
      AND su.role IN ('fleet_manager', 'support', 'finance', 'admin', 'superadmin')
  );
$$;

-- ------------------------------------
-- is_admin()
-- Returns true if the current user has admin or superadmin role.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_users su
    JOIN public.users u ON su.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
      AND su.status = 'active'
      AND su.role IN ('admin', 'superadmin')
  );
$$;

-- ------------------------------------
-- current_customer_id()
-- Returns the customers.id for the current customer user, or NULL.
-- ------------------------------------
CREATE OR REPLACE FUNCTION veyra_private.current_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
  SELECT c.id
  FROM public.customers c
  JOIN public.users u ON c.user_id = u.id
  WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- ============================================================
-- SECURITY: Revoke default PUBLIC and anon execute on private functions.
-- Postgres grants EXECUTE to PUBLIC by default for new functions.
-- We explicitly revoke from PUBLIC and anon.
-- authenticated and service_role retain EXECUTE to evaluate RLS policies.
-- Because veyra_private is NOT an exposed schema in config.toml,
-- PostgREST will never expose these functions as API RPC endpoints.
-- ============================================================
REVOKE EXECUTE ON FUNCTION veyra_private.current_clerk_id()   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.current_user_id()    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.current_staff_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.current_branch_id()  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.is_org_staff()       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.is_admin()           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION veyra_private.current_customer_id() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION veyra_private.current_clerk_id()   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.current_user_id()    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.current_staff_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.current_branch_id()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.is_org_staff()       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.is_admin()           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION veyra_private.current_customer_id() TO authenticated, service_role;

-- Comments
COMMENT ON FUNCTION veyra_private.current_clerk_id()    IS 'Returns Clerk JWT sub claim. SECURITY INVOKER.';
COMMENT ON FUNCTION veyra_private.current_user_id()     IS 'Maps Clerk sub -> users.id. SECURITY DEFINER. Used in RLS policies.';
COMMENT ON FUNCTION veyra_private.current_staff_role()  IS 'Returns active staff role for current user. NULL if not staff. Used in RLS.';
COMMENT ON FUNCTION veyra_private.current_branch_id()   IS 'Returns branch_id for branch-scoped staff only. NULL for org-wide staff/customers.';
COMMENT ON FUNCTION veyra_private.is_org_staff()        IS 'True if user is fleet_manager, support, finance, admin, or superadmin.';
COMMENT ON FUNCTION veyra_private.is_admin()            IS 'True if user is admin or superadmin.';
COMMENT ON FUNCTION veyra_private.current_customer_id() IS 'Returns customers.id for current user. NULL if not a customer.';
