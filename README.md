# Veyra — Modern Car Rental Platform (Butuan City)

Veyra is a premium car-rental platform engineered for seamless vehicle discovery, custom rental duration, Butuan City geographic pickup coordination, identity verification (KYC), Terms of Service compliance, multi-method simulated payments, and operational fleet management.

---

## 1. System Architecture & Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Core Runtime & Language**: [Node.js](https://nodejs.org/), [TypeScript 5](https://www.typescriptlang.org/), [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables
- **Component Primitives**: [Base UI](https://base-ui.com/) & [shadcn/ui](https://ui.shadcn.com/) (`mist` palette, `remixicon`)
- **Authentication**: [@clerk/nextjs](https://clerk.com/) (Server-enforced session protection, role-based access control)
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security and private object storage buckets)
- **Maps & Geolocation**: OpenStreetMap / Leaflet with verified 86 Butuan City barangay bounds and 8 official Veyra hubs
- **Quality Gates**: ESLint 9 (`eslint-config-next`), Node.js Test Runner, TypeScript strict typecheck

---

## 2. Implemented Modules

1. **Vehicle Catalogue & Real-Time Availability**:
   - Fleet browsing with high-resolution vehicle photography, transmission/fuel specs, and daily rates.
   - Concurrency-safe availability checking with automatic collision detection.
2. **Flexible & Unlimited Rental Duration**:
   - Customer-selected duration supporting 1, 5, 30, 60, 90, and extended periods.
   - 24-hour cycle return calculation with instant quote recalculation.
3. **Butuan City Geographic Pickup Coordination**:
   - Interactive full-city map and dropdown search covering all 86 official Butuan City barangays.
   - 8 official Veyra hubs (Airport, SM City, Robinsons, Gaisano, Bus Terminals, City Hall).
   - Custom street address and landmark support with 35 km service boundary validation.
4. **KYC Identity Verification**:
   - Secure customer document upload into private Supabase Storage (`customer-documents`).
   - Staff review portal with time-limited (5-min TTL) signed URLs.
   - Clearance requirement enforced for confirmed rentals (Proof of billing is optional).
5. **Terms of Service Compliance**:
   - 17 structured clauses covering insurance, deposits, and usage limits.
   - Mandatory server-validated agreement with cryptographic SHA-256 IP hashing.
   - Immutable historical acceptance ledger and version control.
6. **Multi-Method Demo Payment Module**:
   - Simulated checkout for **GCash (Demo)**, **Maya (Demo)**, **Credit/Debit Card (Demo)**, and **Bank Transfer (Demo)**, plus **Pay at Pickup**.
   - Interactive simulation controls: `Simulate Successful Payment`, `Simulate Failed Payment`, and `Cancel Payment`.
   - Distinct printable demo receipts featuring a prominent `DEMO — NO REAL MONEY INVOLVED` watermark.
   - Strict financial isolation: Demo payments are tagged `is_demo: true` and segregated from actual captured revenue in Admin reporting.
7. **Comprehensive Admin Console**:
   - Role-based operations console (`/admin`) for fleet, reservations, maintenance, inspections, KYC, terms, and payments.

---

## 3. Safe Demo Mode & Financial Isolation Guarantee

> [!IMPORTANT]
> **SIMULATED PAYMENTS DO NOT MOVE REAL MONEY**
>
> All online payment methods operate strictly in **Demo / Simulation Mode** for classroom and capstone presentation purposes:
> - **No live payment gateway APIs** (PayMongo, Stripe, or banks) are called.
> - **No real funds, credit cards, or bank accounts** are charged or transferred.
> - **No sensitive credentials** (MPINs, OTPs, CVVs, or bank logins) are collected.
> - Every demo transaction is saved with `is_demo: true` and reference prefix `VYR-DEMO-`.
> - In the Admin Payment Ledger, demo payments appear exclusively under **Simulated Payment Volume (Demo)** and are **strictly excluded from Total Captured Revenue**.
> - Live gateway processing (`PAYMENTS_ENABLED=false`) remains locked.

---

## 4. Environment Configuration

1. Copy the safe configuration template:
   ```bash
   cp .env.example .env.local
   ```
2. Verify the required variables in `.env.local`:
   ```env
   # Browser-Safe (Clerk & Supabase)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/auth/redirect
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/auth/redirect
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Server-Only Keys (Never commit to Git)
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
   SUPABASE_SERVICE_ROLE_KEY=...
   
   # Demo Mode Flags
   DEMO_MODE=true
   PAYMENTS_ENABLED=false
   ALLOW_LIVE_PAYMENTS=false

   # Admin / Superadmin Owner Identity
   VEYRA_OWNER_EMAIL=owner@veyra.rentals
   ```

---

## 5. Database Setup & Synchronized Migrations

Veyra uses Supabase PostgreSQL. All 11 migrations are tracked and synchronized under `supabase/migrations/`:

| Migration | Purpose |
| :--- | :--- |
| `20260929000000_initial_veyra_schema.sql` | Core tables (users, vehicles, locations, reservations, payments) |
| `20261002000000_clerk_auth_tables.sql` | Clerk identity integration and staff profiles |
| `20261008000000_audit_and_kyc_fixes.sql` | Audit logging and KYC document review schema |
| `20261009000000_fleet_expansion.sql` | Vehicle pricing tiers and category classifications |
| `20261010000000_manual_pickup_address.sql` | Custom barangay and street address fields |
| `20261011000000_configurable_rental_duration.sql` | Configurable min/max rental duration settings |
| `20261012000000_terms_of_service_schema.sql` | Terms versions and cryptographic IP hash acceptances |
| `20261018000000_add_missing_rls_policies.sql` | Customer-level Row-Level Security policies |
| `20261018010000_storage_buckets_setup.sql` | Private storage buckets (`customer-documents`, `fleet-assets`) |
| `20261018020000_system_settings_down_migration.sql` | Settings table constraint enhancements |
| `20261018030000_add_demo_payments_support.sql` | `is_demo` tracking and index on `public.payments` |

To push migrations to a linked Supabase instance:
```bash
npx supabase db push --linked
```

To verify migration status:
```bash
npx supabase migration list
```

---

## 6. Local Development & Quality Gates

Run all quality checks before presentation:

```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Automated Test Suite (178 unit & integration tests)
npm test

# 3. Linter
npm run lint

# 4. Production Build
npm run build

# 5. Start Development Server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## 7. Step-by-Step Capstone Demonstration Guide

### Part 1: Customer Booking Journey
1. **Sign In**: Navigate to `http://localhost:3000/sign-in` and sign in with a demo Clerk account.
2. **Browse Vehicles**: Visit `/vehicles`, filter by category (SUV, Sedan, Van), and select a vehicle (e.g., Toyota Corolla Cross Hybrid).
3. **Select Itinerary**: Choose pickup and return dates. Manually adjust the duration (e.g., 3 days or 14 days) and observe return date and price synchronizing in real time.
4. **Choose Location**: Select a Butuan City barangay (e.g., *Doongan* or *Libertad*) and enter a pickup landmark (e.g., *Near City Hall*).
5. **Review Terms**: Read the Terms of Service and check the agreement checkbox.
6. **Simulated Payment**: Select `GCash (Demo)`. On `/booking/demo-checkout`, click **Simulate Successful Payment**.
7. **View Receipt**: Review the confirmed booking and open the demo receipt with the prominent `DEMO — NO REAL MONEY INVOLVED` watermark.
8. **Customer History**: Visit `/account/payments` and `/account/reservations` to inspect the newly recorded transaction with its `DEMO` badge.

### Part 2: Failure Scenario & Retry
1. Book another vehicle, select `Maya (Demo)` or `Card (Demo)`.
2. On the demo checkout screen, select **Insufficient Wallet Balance (Demo)** and click **Simulate Failed Payment**.
3. Note that the booking is preserved in `payment_failed` state without orphan charges.
4. Click **Retry Payment**, select a different method, and simulate success.

### Part 3: Operational Administration
1. Sign in with the designated owner account (`VEYRA_OWNER_EMAIL`).
2. Navigate to `/admin`.
3. Open `/admin/payments`:
   - Point out that **Total Captured Revenue** strictly excludes demo payments.
   - Point out that **Simulated Payment Volume (Demo)** aggregates all demo transactions with purple `DEMO` tags.
4. Open `/admin/customers` to inspect uploaded KYC documents using secure 5-minute signed URLs.
5. Open `/admin/settings` to demonstrate admin control over minimum/maximum rental duration.

---

## 8. Known Presentation Boundaries

- Online checkout methods (GCash, Maya, Card, Bank Transfer) operate strictly in Demo Mode.
- Live card processing and real webhooks remain disabled by default for student safety.
