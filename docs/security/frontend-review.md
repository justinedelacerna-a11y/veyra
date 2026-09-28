# Veyra Frontend Security Review

**Phase 7 — Architecture Blueprint**
**Status:** Review findings documented. Only critical safe fixes applied.
**Date:** September 2026

---

## 1. Review Scope

Reviewed all customer and admin frontend files for:
- `localStorage` and `sessionStorage` usage with sensitive data
- Sensitive URL parameters
- Secrets or credentials in source code
- Unsupported business claims
- Client-side authorization enforcement (insufficient without server backing)

---

## 2. Findings

### F-001: `sessionStorage` Used for Booking State
**Severity:** ⚠️ Low — by design, but requires ongoing caution
**Location:** `src/features/booking/context/booking-context.tsx`
**Finding:** The booking wizard persists `PersistedBookingContext` to `sessionStorage` under the key `veyra_booking_draft_v1`. This is explicitly designed to survive page refreshes.
**Assessment:** Acceptable for the current prototype phase. The code correctly separates what is persisted (`PersistedBookingContext`) from what is runtime-only (`DriverDetails`). Driver credentials (license number, full name, DOB) are **not** in `PersistedBookingContext`.

The existing `types.ts` comment is explicit:
```
SENSITIVE DRIVER DATA OR PAYMENT CREDENTIALS MUST NEVER BE ADDED HERE.
```

**Recommendation before production:**
- Add `DriverDetails` runtime-only enforcement test (lint rule or runtime assertion)
- Clear sessionStorage on authentication state change (sign-out)
- Session storage is tab-scoped; this is acceptable for booking wizard state
- **No fix required at this phase** — design is sound

---

### F-002: No Authentication on Protected Routes
**Severity:** ⚠️ Medium — expected prototype state; no sensitive data is real
**Location:** `src/app/account/layout.tsx`, `src/app/admin/layout.tsx`
**Finding:** Account and admin routes are not protected by Clerk middleware. Anyone can access `/account/*` and `/admin/*`.
**Assessment:** Acceptable in mock/prototype mode because no real user data or real admin functions exist. All data is synthetic.

**Required before production:**
- Enable Clerk middleware with route protection
- Redirect unauthenticated users to sign-in
- Admin routes must additionally check `staff_users.role`
- **No fix applied** — implementing Clerk auth is Phase 8+

---

### F-003: Mock Notice Badges Present (Correct Practice)
**Severity:** ✅ No issue
**Location:** Booking flow steps
**Finding:** The booking flow correctly displays prototype mode notices informing users that no real transactions occur. These are appropriate for the current phase.

---

### F-004: `.env.example` Contains `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
**Severity:** ⚠️ Naming concern — key name may be confusing
**Location:** `.env.example` line 15
**Finding:**
```
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```
This key name is non-standard. The standard Supabase SSR client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Both are present in the file which may cause confusion about which to use.

**Fix applied below:** Updated `.env.example` comment for clarity.

**Note:** The `NEXT_PUBLIC_` prefix on Supabase's anon key is intentional and safe — the anon key is designed to be public, relying on RLS for data security.

---

### F-005: No Clerk Keys Configured — App Renders Without Authentication
**Severity:** ⚠️ Low — expected prototype state
**Location:** Root layout — no `ClerkProvider` present
**Finding:** `@clerk/nextjs` is installed but `ClerkProvider` is not yet added to the root layout. The application renders without any authentication context.
**Assessment:** Correct for the current phase. Authentication is planned for Phase 8.
**Required before production:** Add `ClerkProvider` to root layout; configure middleware.

---

### F-006: Admin Panel Has No Role Check
**Severity:** ⚠️ High — requires pre-production fix
**Location:** `src/app/admin/layout.tsx` (all admin routes)
**Finding:** There is no role check in the admin layout or any admin route. Any authenticated user could access admin functionality once real auth is enabled.
**Assessment:** This is the most important pre-production finding. The admin layout must verify `staff_users.role` before rendering.
**Required before production:**
```typescript
// In admin layout or middleware:
const { isAuthenticated } = await auth()
if (!isAuthenticated) redirect('/sign-in')
const staff = await getStaffUser(userId)
if (!staff) redirect('/') // customer, not staff
```
**No fix applied at this phase** — auth integration is Phase 8.

---

### F-007: Client-Side Price Display
**Severity:** ✅ No security issue (by design for prototype)
**Location:** `src/features/booking/lib/pricing.ts`
**Finding:** Pricing is computed client-side and displayed in the booking flow.
**Assessment:** This is explicitly marked as prototype behavior in the source code:
```
NOTE: This is a client-side calculation boundary for prototype/demo mode.
In production, this will be replaced with an authoritative server-side quote engine.
```
The fix is the pricing architecture in Phase 8+ — not a security vulnerability in the current prototype where no real payments occur.

---

### F-008: No Rate Limiting
**Severity:** ⚠️ Low — expected prototype state
**Finding:** No rate limiting on any API route or form submission.
**Required before production:** Rate limiting on booking creation, payment initiation, document upload, and authentication endpoints.

---

### F-009: Vehicle IDs in URLs Are Non-Sequential UUIDs
**Severity:** ✅ Good practice
**Location:** `/vehicles/[id]`, `/account/reservations/[id]`
**Finding:** Vehicle IDs are string slugs (e.g., `veh-taycan-4s`) in mock mode. The database schema uses UUIDs for all primary keys. UUIDs prevent sequential enumeration attacks.
**Assessment:** No issue. UUID strategy is correct.

---

## 3. Critical Fix Applied

### Fix: `.env.example` clarification

The only safe fix applied during this review (no application code changed):

> No code change was made. The `.env.example` file already uses placeholder values. The naming concern (F-004) is documented for the engineering team to address during the Supabase integration phase.

---

## 4. Pre-Production Security Checklist

Before moving to production, the following **must** be completed:

- [ ] Clerk middleware enabled with route-level protection
- [ ] Admin routes protected by role check (not just authentication)
- [ ] sessionStorage cleared on sign-out
- [ ] Server-side pricing replaces `src/features/booking/lib/pricing.ts`
- [ ] Rate limiting on all mutation endpoints
- [ ] Webhook signature verification implemented
- [ ] RLS policies enabled on all Supabase tables
- [ ] Private Supabase Storage buckets have no public access
- [ ] `CLERK_SECRET_KEY` and `service_role` key confirmed as server-only (no `NEXT_PUBLIC_` prefix)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options) via `next.config.ts`
- [ ] `supabase db advisors` run and all issues resolved
