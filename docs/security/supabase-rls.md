# Veyra Supabase RLS Policy Design & Implementation

**Phase 8 — Database Security Gate + Implementation**
**Status:** IMPLEMENTED and AUDITED in `supabase/schemas/17_rls.sql`, `16_triggers.sql`, and `18_public_catalog.sql`.
**Date:** September 2026

> **Architecture Standard:** Veyra uses Clerk for authentication and Supabase for PostgreSQL. Per current official Supabase guidance, **Veyra uses Supabase Native Third-Party Authentication with Clerk** rather than the deprecated Clerk JWT-template integration (deprecated as of April 1, 2025).
>
> In this native architecture:
> 1. Supabase verifies Clerk session tokens directly against Clerk's JWKS using the configured Clerk Domain (`[auth.third_party.clerk]`).
> 2. Clerk session tokens carry `"role": "authenticated"` and `"sub": "{{user.id}}"`.
> 3. The Supabase client passes the standard Clerk session token via `accessToken: async () => (await auth()).getToken()`.
> 4. RLS policies identify the caller via `(auth.jwt() ->> 'sub')`, which is mapped to the internal `users.clerk_id` column.
> 5. Application authorization is enforced first server-side in Next.js Server Actions and Route Handlers; RLS serves as the defense-in-depth enforcement layer.
> 6. Public catalog queries access `public.vehicle_catalog` view; raw `vehicles` table has NO anon read access.
> 7. Critical columns on `customers` and `reservations` are guarded by BEFORE UPDATE triggers (`protect_customer_columns`, `protect_reservation_columns`).

---

## 1. Authentication Token & Identity Claims

In Supabase Native Third-Party Auth, the Clerk session token is presented to Supabase with the following verified claims:

```json
{
  "iss": "https://<your-clerk-domain>.clerk.accounts.dev",
  "sub": "user_2xxxxxxxxx",
  "role": "authenticated",
  "email": "user@example.com",
  "iat": 1727500000,
  "exp": 1727500300
}
```

* **No Secret Sharing:** The Supabase JWT secret is never shared with Clerk, and no custom template is required.
* **Identity Mapping:** The `sub` claim maps 1:1 to `users.clerk_user_id` in PostgreSQL.
* **Role & Scope Resolution:** Application roles and branch assignments are stored authoritatively in PostgreSQL (`roles`, `staff_profiles`). This prevents stale JWT claims and guarantees immediate effect upon role revocation or branch reassignment.

---

## 2. Helper Functions (Native Third-Party Auth Pattern)

To keep RLS policies clean, performant, and maintainable, helper functions reside in a dedicated `veyra_private` schema with `SECURITY DEFINER` and an explicit `search_path`:

```sql
-- 1. Returns the Clerk user ID (sub claim)
CREATE OR REPLACE FUNCTION veyra_private.current_clerk_id()
RETURNS text LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT (auth.jwt() ->> 'sub');
$$;

-- 2. Returns the internal Veyra user UUID
CREATE OR REPLACE FUNCTION veyra_private.current_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, veyra_private AS $$
  SELECT id FROM public.users 
  WHERE clerk_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- 3. Returns the active role name for the current user
CREATE OR REPLACE FUNCTION veyra_private.current_role_name()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, veyra_private AS $$
  SELECT r.name 
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- 4. Returns the branch UUID for branch-scoped staff (or NULL for customer/global staff)
CREATE OR REPLACE FUNCTION veyra_private.current_branch_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, veyra_private AS $$
  SELECT sp.branch_id 
  FROM public.staff_profiles sp
  JOIN public.users u ON sp.user_id = u.id
  WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- 5. Returns true if the user has an organization-wide staff/admin role
CREATE OR REPLACE FUNCTION veyra_private.is_org_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, veyra_private AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
      AND r.name IN ('fleet_manager', 'support', 'finance', 'admin', 'superadmin')
  );
$$;
```

**Security Note:** All `SECURITY DEFINER` functions in `veyra_private` specify `SET search_path = public, veyra_private` to prevent search-path hijacking attacks, and execute internal lookups filtered strictly by `auth.jwt() ->> 'sub'`.

---

## 3. Policy Designs Per Table

### 3.1 `users`

| Operation | Policy | Condition |
|---|---|---|
| SELECT | Own row only | `id = veyra_private.current_user_id()` |
| SELECT | Admin read | role IN ('admin', 'superadmin') |
| INSERT | System only | Via service_role (no user policy) |
| UPDATE | System only | Via service_role (synced from Clerk webhook) |
| DELETE | System only | Soft delete via service_role |

```sql
-- Customers and staff can read their own users row
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (id = veyra_private.current_user_id());

-- Admins can read all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT TO authenticated
  USING (veyra_private.current_role_name() IN ('admin', 'superadmin'));
```

---

### 3.2 `customers`

| Operation | Scope | Notes |
|---|---|---|
| SELECT | Own profile | `user_id = veyra_private.current_user_id()` |
| SELECT | Support/Admin read | |
| UPDATE | Own profile (limited fields) | Via service_role for sensitive fields |
| INSERT/DELETE | Service role only | Created via Clerk webhook handler |

```sql
CREATE POLICY "customers_select_own" ON customers
  FOR SELECT TO authenticated
  USING (user_id = veyra_private.current_user_id());

CREATE POLICY "customers_select_staff" ON customers
  FOR SELECT TO authenticated
  USING (
    veyra_private.current_role_name() IN
    ('support','finance','admin','superadmin')
  );

-- Customers can update their own non-sensitive fields
CREATE POLICY "customers_update_own" ON customers
  FOR UPDATE TO authenticated
  USING (user_id = veyra_private.current_user_id())
  WITH CHECK (user_id = veyra_private.current_user_id());
```

---

### 3.3 `reservations`

The most critical table for authorization. Three tiers:

| Access Tier | Who | Condition |
|---|---|---|
| Customer | Own reservations only | `customer_id → customers → user_id` |
| Branch staff | Branch-scoped reservations | Via `pickup_location_id → locations → branch_id` |
| Org staff | All reservations | Roles: support, finance, admin, superadmin |

```sql
-- Customers see only their own reservations
CREATE POLICY "reservations_select_customer" ON reservations
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = veyra_private.current_user_id()
    )
  );

-- Branch staff see reservations at their branch only
CREATE POLICY "reservations_select_branch_staff" ON reservations
  FOR SELECT TO authenticated
  USING (
    veyra_private.current_role_name() IN ('branch_staff','branch_manager')
    AND pickup_location_id IN (
      SELECT id FROM locations WHERE branch_id = veyra_private.current_branch_id()
    )
  );

-- Org-level staff see all reservations
CREATE POLICY "reservations_select_org_staff" ON reservations
  FOR SELECT TO authenticated
  USING (veyra_private.is_org_staff());
```

**Customers cannot SELECT, UPDATE, or DELETE other customers' reservations. This is enforced at both application layer and RLS.**

---

### 3.4 `vehicles` (public catalog)

```sql
-- Fleet catalog is publicly readable (anonymous browsing)
CREATE POLICY "vehicles_select_public" ON vehicles
  FOR SELECT TO anon, authenticated
  USING (
    fleet_status != 'retired'
    AND deleted_at IS NULL
  );

-- Only fleet_manager and admin can modify vehicles
CREATE POLICY "vehicles_modify_fleet_manager" ON vehicles
  FOR ALL TO authenticated
  USING (
    veyra_private.current_role_name() IN ('fleet_manager','admin','superadmin')
  )
  WITH CHECK (
    veyra_private.current_role_name() IN ('fleet_manager','admin','superadmin')
  );
```

---

### 3.5 `payments`

**Extremely sensitive — strict access.**

```sql
-- Customers see only their own payments
CREATE POLICY "payments_select_customer" ON payments
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = veyra_private.current_user_id()
    )
  );

-- Finance, admin, superadmin see all payments
CREATE POLICY "payments_select_finance" ON payments
  FOR SELECT TO authenticated
  USING (
    veyra_private.current_role_name() IN ('finance','admin','superadmin')
  );

-- No direct INSERT/UPDATE/DELETE from client — service_role only
```

---

### 3.6 `customer_documents`

**Highly sensitive — private documents.**

```sql
-- Customers can see metadata of their own documents (NOT storage content)
CREATE POLICY "documents_select_own" ON customer_documents
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = veyra_private.current_user_id()
    )
  );

-- Support and admin can read document metadata
CREATE POLICY "documents_select_staff" ON customer_documents
  FOR SELECT TO authenticated
  USING (
    veyra_private.current_role_name() IN ('support','admin','superadmin')
  );

-- Customers can INSERT their own documents (via server-validated upload)
CREATE POLICY "documents_insert_own" ON customer_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = veyra_private.current_user_id()
    )
  );
```

**Document files in Supabase Storage (private bucket) are NEVER directly accessible by clients. All access goes through server-generated signed URLs.**

---

### 3.7 `inspections` and `damage_reports`

```sql
-- Customers can view inspections for their own reservations
CREATE POLICY "inspections_select_customer" ON inspections
  FOR SELECT TO authenticated
  USING (
    reservation_id IN (
      SELECT id FROM reservations WHERE customer_id IN (
        SELECT id FROM customers WHERE user_id = veyra_private.current_user_id()
      )
    )
  );

-- Branch staff can view inspections at their branch
CREATE POLICY "inspections_select_branch" ON inspections
  FOR SELECT TO authenticated
  USING (
    veyra_private.current_role_name() IN ('branch_staff','branch_manager')
    AND vehicle_id IN (
      SELECT id FROM vehicles WHERE branch_id = veyra_private.current_branch_id()
    )
  );

-- Org staff see all
CREATE POLICY "inspections_select_org" ON inspections
  FOR SELECT TO authenticated
  USING (veyra_private.is_org_staff());
```

---

### 3.8 `maintenance_records`

```sql
-- Branch staff see only their branch's maintenance
CREATE POLICY "maintenance_select_branch" ON maintenance_records
  FOR SELECT TO authenticated
  USING (
    veyra_private.current_role_name() IN ('branch_staff','branch_manager')
    AND branch_id = veyra_private.current_branch_id()
  );

-- Fleet managers and above see all
CREATE POLICY "maintenance_select_fleet" ON maintenance_records
  FOR SELECT TO authenticated
  USING (
    veyra_private.current_role_name() IN ('fleet_manager','admin','superadmin')
  );
```

---

### 3.9 `audit_events`

**Append-only. Highly restricted read access.**

```sql
-- Customers can see audit events about their own actions
CREATE POLICY "audit_select_own" ON audit_events
  FOR SELECT TO authenticated
  USING (actor_id = veyra_private.current_user_id());

-- Admin and superadmin see all
CREATE POLICY "audit_select_admin" ON audit_events
  FOR SELECT TO authenticated
  USING (
    veyra_private.current_role_name() IN ('admin','superadmin')
  );

-- INSERT only via service_role (application layer). No direct client inserts.
-- No UPDATE or DELETE ever — audit records are immutable.
```

---

## 4. Server-Only Tables

The following tables are **only accessible via the service_role key** from the Next.js application layer. No RLS policy grants `anon` or `authenticated` access:

- `webhook_events` — raw webhook payloads; never exposed to clients
- `staff_users` — sensitive staff data; accessed only via service_role in admin panel
- `notification_queue` — internal worker queue
- `rate_plans` — pricing configuration; admin-only via service_role

---

## 5. Supabase Storage Bucket Policies

### Public bucket: `vehicles-marketing`

```sql
-- Anyone can read marketing vehicle photos
CREATE POLICY "public_vehicle_photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vehicles-marketing');
```

### Private bucket: `customer-documents`

```sql
-- Only server (service_role) can read/write. No client policies.
-- All access via signed URLs generated by the Next.js server.
```

### Private bucket: `inspection-photos`

```sql
-- Only service_role. Signed URLs issued by server to authorized staff.
```

---

## 6. Views and Security Invoker

All database views must use `security_invoker = true` (Postgres 15+) to ensure RLS policies are evaluated for the calling user, not the view creator:

```sql
CREATE VIEW customer_reservation_summary
WITH (security_invoker = true) AS
SELECT r.id, r.reference, r.status, r.pickup_at, r.return_at, r.total_amount
FROM reservations r
WHERE ...;
-- The caller's RLS policies on reservations still apply
```

Without `security_invoker = true`, views bypass RLS and expose all rows to any authenticated user who can query the view.

---

## 7. RLS Checklist Before Implementation

Before enabling RLS on any table:
- [ ] All policies tested with a simulated customer JWT
- [ ] All policies tested with branch_staff JWT scoped to a specific branch
- [ ] Verified cross-customer data leakage is impossible (Customer A cannot see Customer B's data)
- [ ] Verified cross-branch leakage is impossible for branch-scoped staff
- [ ] Views audited for `security_invoker`
- [ ] `SECURITY DEFINER` functions audited — none should bypass authorization
- [ ] `supabase db advisors` run and all issues resolved
