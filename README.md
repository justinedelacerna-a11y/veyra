# Veyra — Modern Car Rental Platform

Veyra is a premium car-rental platform engineered for seamless customer vehicle discovery, quoting, reservations, and operational fleet management.

---

## 1. Current Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Core Runtime & Language**: [Node.js](https://nodejs.org/), [TypeScript 5](https://www.typescriptlang.org/), [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables
- **Component Primitives**: [Base UI](https://base-ui.com/) & [shadcn/ui](https://ui.shadcn.com/) (initialized with preset `b3ZzWgYd8d`, `mist` palette, `remixicon`)
- **Authentication SDK**: [@clerk/nextjs](https://clerk.com/)
- **Database & Backend SDK**: [@supabase/supabase-js](https://supabase.com/) and [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/nextjs)
- **Quality & Linting**: ESLint 9 (`eslint-config-next`)

---

## 2. Current Development Phase

**Phase: Bootstrap & Foundation Setup (Deliberate Mode)**

The project is currently establishing engineering intelligence, dependency foundations, architectural boundaries, and vendor agent skills.

*In accordance with project guidelines:*
- No customer pages or admin dashboards have been prematurely built.
- Development operates in frontend-first / mock-first mode before live transaction or database wiring.
- No live secrets or credentials are hardcoded.

---

## 3. Project Structure

```text
veyra/
├── .agents/
│   └── skills/                         # Engineering brain and vendor skills
│       ├── SKILLS.md                   # Veyra Master Engineering Skills specification
│       ├── shadcn/                     # shadcn UI skill
│       ├── migrate-radix-to-base/      # Radix to Base UI migration skill
│       ├── clerk/                      # Official Clerk suite (20 skills)
│       ├── supabase/                   # Official Supabase skill
│       ├── supabase-postgres-best-practices/ # Supabase SQL & Postgres best practices
│       └── veyra/                      # Veyra agent skill
├── docs/                               # Foundational architecture and specifications
│   ├── product/                        # Product requirements and workflows
│   ├── design/                         # Design system, tokens, and guidelines
│   ├── architecture/                   # Technical architecture and conventions
│   ├── security/                       # Security models, RLS policies, secrets rules
│   ├── database/                       # PostgreSQL schemas and migration guides
│   └── operations/                     # Deployment and operational runbooks
├── prompts/                            # System prompts and engineering runbooks
├── public/                             # Static assets
├── src/
│   ├── app/                            # Next.js App Router (layout, globals.css, root)
│   ├── components/                     # Reusable design system primitives
│   │   └── ui/                         # shadcn/ui components (Base UI backed)
│   ├── features/                       # Domain-driven feature modules
│   ├── lib/                            # Shared utilities (cn, client factories)
│   └── types/                          # Shared TypeScript interfaces & models
├── .env.example                        # Safe environment variable template
├── components.json                     # shadcn configuration (preset b3ZzWgYd8d)
├── eslint.config.mjs                   # ESLint configuration
├── next.config.ts                      # Next.js configuration
├── package.json                        # Project manifest and dependencies
└── tsconfig.json                       # TypeScript compiler options
```

---

## 4. Vendor Skills & Engineering Intelligence

The project equips AI pair programmers and human engineers with dedicated vendor and architectural skills under `.agents/skills/`:

- **Veyra Engineering Skills** ([`.agents/skills/SKILLS.md`](file:///c:/Users/Niqsy/Desktop/veyra/.agents/skills/SKILLS.md)): Comprehensive engineering intelligence, architecture standards, security mandates, and product rules.
- **shadcn/ui** (`shadcn`, `migrate-radix-to-base`): Automated component scaffolding and modern Base UI primitives.
- **Clerk Suite** (`clerk`, `clerk-nextjs-patterns`, `clerk-billing`, `clerk-orgs`, etc.): Official patterns for authentication, session verification, and organization management.
- **Supabase Suite** (`supabase`, `supabase-postgres-best-practices`): Official patterns for SSR client initialization, Row-Level Security (RLS), and Postgres query optimization.

---

## 5. Environment Setup

1. Copy the safe configuration template:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the required environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public frontend key.
   - `CLERK_SECRET_KEY`: Clerk backend secret (server-only; NEVER commit or expose to client).
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable / anon key.

*Security Warning:* Never commit `.env.local` to git. Never prefix secret keys with `NEXT_PUBLIC_`.

---

## 6. Local Development Commands

- **Start Development Server**:
  ```bash
  npm run dev
  ```
  Accessible at `http://localhost:3000`.

- **Run Linting**:
  ```bash
  npm run lint
  ```

- **Run Production Build & Typecheck**:
  ```bash
  npm run build
  ```

---

## 7. Future Phase Strategy

1. **Design System & Shell**: Construct responsive global navigation, mobile drawer, typography, and container components aligned with the `b3ZzWgYd8d` preset.
2. **Mock Vehicle Discovery**: Build fleet filtering, category sorting, car card components, and detail view using typed mock data.
3. **Mock Booking Flow**: Build date-picker, insurance selection, add-on options, and quote breakdown.
4. **Operations Shell**: Lay out high-density desktop views for fleet status, vehicle turnaround, and check-in workflows.
5. **Backend Wiring**: Attach Clerk auth middleware and Supabase RLS database queries once UI flows are validated.
