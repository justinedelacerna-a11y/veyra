# Veyra — Cloud Development Guide

## Target Architecture

```
Developer Workstation / Vercel (Production Hosting)
            ↓
  Next.js 16 (App Router + proxy.ts)
            ↓
  Clerk (Identity & Authentication Provider)
            ↓ native session token (accessToken)
  Supabase Cloud (PostgreSQL Database + Storage)
            ↓ (future)
  PayMongo (Payment Provider)
```

### Dedicated Cloud Topology
Veyra runs strictly on a hosted cloud stack:
- **Vercel**: Hosts the Next.js 16 web application and server runtimes.
- **Supabase Cloud**: Managed PostgreSQL database, Row Level Security (RLS) enforcement engine, and object storage.
- **Clerk**: Identity provider handling user accounts, authentication sessions, and JWT issuance.
- **PayMongo**: Future payment processing engine.

> **NO LOCAL SUPABASE / DOCKER REQUIRED:**
> Docker Desktop, WSL, Podman, `supabase start`, and local PostgreSQL containers are **intentionally not part of the Veyra workflow**.
> All database development, testing, and migrations occur against hosted Supabase Cloud projects.

---

## Prerequisites

1. **Node.js 20.9+** — required for Next.js 16 and Clerk SDKs
2. **npm** — package manager
3. **Supabase CLI** — installed locally as a dev dependency (`npx supabase`)
4. Access to the **Veyra Supabase Cloud project**
5. Access to the **Veyra Clerk application**

---

## First-Time Setup

### 1. Environment Configuration

Copy the template:
```bash
cp .env.example .env.local
```

Fill in `.env.local` with your development keys:

```ini
# Browser-Safe Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-Only Keys (Keep Secret)
CLERK_SECRET_KEY=sk_test_...
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

> **Security Guardrails:**
> - NEVER share the Supabase JWT secret with Clerk.
> - NEVER commit `.env.local` to git.
> - NEVER expose `SUPABASE_SERVICE_ROLE_KEY` or `CLERK_SECRET_KEY` via `NEXT_PUBLIC_` prefixes or browser code.

---

## Native Third-Party Authentication (Clerk + Supabase)

Veyra uses **Clerk as a native Supabase third-party authentication provider**. This eliminates the deprecated Clerk JWT template and eliminates shared JWT secrets.

### How It Works:
1. **Clerk is the Identity Provider**: Issues standard session tokens upon user login.
2. **Native Third-Party Verification**: Supabase validates incoming Clerk JWTs against the configured Clerk instance domain using Clerk's JSON Web Key Set (JWKS).
3. **Automatic Client Token Injection**: Both server and browser Supabase clients pass the current Clerk session token via the native `accessToken` option:
   ```ts
   createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
     accessToken: async () => (await auth()).getToken()
   })
   ```
4. **PostgreSQL RLS Resolution**: Supabase evaluates RLS policies by extracting the Clerk subject claim:
   ```sql
   auth.jwt() ->> 'sub'
   ```
   Internal functions (e.g. `veyra_private.current_user_id()`) map `auth.jwt() ->> 'sub'` directly to `public.users.clerk_id`.
5. **Anonymous Access**: If a user is not logged in, `accessToken` resolves to `null`, and the Supabase client safely operates under the `anon` role, allowing public reads on catalog tables (e.g., `vehicle_catalog`, `branches`, `rate_plans`).

### Dashboard Setup Instructions:

#### Step 1: Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Configure** → **Integrations** → **Supabase** (or Setup).
2. Activate the Supabase integration and copy your **Clerk Domain** (e.g., `clerk.your-domain.com` or `https://<instance>.clerk.accounts.dev`).

#### Step 2: Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Sign In / Providers** (or **Third-Party Auth**).
2. Select **Add provider** → **Clerk**.
3. Enable Clerk and paste the **Clerk Domain** from Step 1.
4. Save changes.

---

## Database Schema & Migration Workflow

Veyra uses **declarative schemas** located in:
```
supabase/schemas/
├── 00_extensions.sql         Extensions (uuid-ossp, citext, pg_trgm)
├── 01_identity.sql           users, customers, staff_users
├── 02_branches.sql           branches, locations
├── 03_fleet.sql              vehicle_classes, vehicles, features, photos
├── 04_availability.sql       availability_blocks
├── 05_extras_pricing.sql     extras, rate_plans
├── 06_quotes.sql             quotes, quote_extras
├── 07_reservations.sql       reservations, reservation_extras, drivers
├── 08_payments.sql           payments, refunds, deposits
├── 09_documents.sql          customer_documents
├── 10_inspections.sql        inspections, check_items, damage_reports
├── 11_maintenance.sql        maintenance_records
├── 12_webhooks.sql           webhook_events
├── 13_audit.sql              audit_events
├── 14_notifications.sql      notification_queue
├── 15_private_functions.sql  veyra_private helpers (RLS identity resolution)
├── 16_triggers.sql           Business logic triggers
├── 17_rls.sql                All 28 table RLS policies
└── 18_public_catalog.sql     vehicle_catalog view
```

### Applying Schema to Supabase Cloud

Follow this exact sequence to deploy database updates safely:

#### 1. Authenticate with Supabase CLI
```bash
npx supabase login
```

#### 2. Link your Hosted Supabase Project
```bash
npx supabase link --project-ref <YOUR_PROJECT_REF>
```

#### 3. Preview Schema Changes (Dry Run)
Always perform a dry run first to inspect the diff between local schemas and the remote database:
```bash
npx supabase db push --dry-run
```

#### 4. Push Schema to Cloud
Once the dry run is verified:
```bash
npx supabase db push
```

> ⚠️ **Seed Data Safety:**
> - Do **NOT** pass `--include-seed` when pushing to production.
> - `supabase/seed.sql` contains synthetic development data (`dev_clerk_*`, placeholder branches). It must NEVER be executed against production.

---

## TypeScript Database Types

Once the schema is pushed to your remote Supabase project, generate the official TypeScript types:

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

This overwrites the temporary stub at `src/types/database.ts` with exact typings for all 28 tables, views, enums, and foreign keys.

---

## Client Usage Examples

### Server Components & Server Actions
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getVehicles() {
  const supabase = createClient()
  // Automatically attaches Clerk session token for RLS if user is authenticated;
  // falls back to anon publishable key for public catalog if unauthenticated.
  const { data, error } = await supabase.from('vehicle_catalog').select('*')
  return data
}
```

### Client Components ('use client')
```typescript
'use client'

import { useSupabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function MyReservations() {
  const supabase = useSupabase()
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('reservations').select('*')
      if (data) setReservations(data)
    }
    load()
  }, [supabase])

  return <div>{/* Render user reservations */}</div>
}
```

### Trusted Service Role (Webhooks & Admin Scripts)
```typescript
import { createServiceClient } from '@/lib/supabase/server'

// In a verified webhook handler:
export async function POST(req: Request) {
  // Always verify webhook signature first!
  const supabase = createServiceClient()
  // Bypasses RLS to synchronize user records from Clerk webhook:
  await supabase.from('users').upsert({
    clerk_id: event.data.id,
    email: event.data.email_addresses[0].email_address,
    user_type: 'customer',
  })
}
```

---

## Quality Gates

Before committing changes or opening a pull request, run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```
All checks must pass with 0 errors.
