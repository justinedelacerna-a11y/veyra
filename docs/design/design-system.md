# Veyra Design System & Application Shell Specifications

This document defines the foundational design tokens, component architecture, layout primitives, and behavioral standards established for the Veyra platform.

---

## 1. Architectural Philosophy & Principles

Veyra is engineered as a modern, calm, and trustworthy luxury mobility platform. The visual and interaction design prioritizes clarity, content hierarchy, and operational efficiency over superficial decoration.

### Core Principles
1. **Content Hierarchy Before Decoration**: Essential data (vehicle model, specifications, pickup instructions, pricing) is always visible and clear.
2. **Clear Action Distinction**: Primary CTAs (e.g. "Browse Fleet", "Confirm Reservation") stand out distinctly from secondary or ghost actions.
3. **Multi-Modal Status System**: Statuses never rely on color alone; each status level pairs an explicit semantic token with a Remix Icon and precise copy.
4. **Accessible by Default**: Keyboard navigability, semantic HTML landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`), and ARIA attributes (handled by Base UI primitives) ensure universal usability.
5. **No Premature Complexity**: We operate in frontend-first mock mode before connecting live backend or database systems.

---

## 2. Design Tokens & Styling Foundation

The styling foundation is integrated with Tailwind CSS v4 using CSS variables and the shadcn `b3ZzWgYd8d` preset.

### Color Tokens & Palette
- **Base Palette**: `mist` (clean, neutral, high-contrast grays)
- **Primary Accent**: Emerald / Sage Green (`oklch(0.508 0.118 165.612)` in light mode, `oklch(0.432 0.095 166.913)` in dark mode)
- **Secondary**: Subtle slate tint (`oklch(0.967 0.001 286.375)`)
- **Muted & Borders**: Neutral grays (`--border: oklch(0.925 0.005 214.3)`)
- **Destructive**: Rose / crimson (`oklch(0.577 0.245 27.325)`)
- **Radius**: Default `0.625rem` (10px) with calculated sub-tokens:
  - `--radius-sm`: 6px
  - `--radius-md`: 8px
  - `--radius-lg`: 10px
  - `--radius-xl`: 14px

### Typography Tokens
- **Heading Font**: Geist (`var(--font-heading)`)
- **Body & Controls**: Inter (`var(--font-sans)`)
- **Monospace & Telemetry**: Geist Mono (`var(--font-mono)`)

| Semantic Level | Font Family | Size | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | Geist | 3rem – 3.75rem (`text-5xl` to `text-6xl`) | Bold (700) | Tight (`-0.03em`) | Hero headlines |
| **H1** | Geist | 2rem – 2.25rem (`text-3xl` to `text-4xl`) | Bold (700) | Tight (`-0.025em`) | Page titles (`PageHeader`) |
| **H2** | Geist | 1.5rem – 1.75rem (`text-xl` to `text-2xl`) | SemiBold (600) | Tight (`-0.02em`) | Section headers |
| **H3** | Geist | 1.125rem – 1.25rem (`text-base` to `text-lg`) | SemiBold (600) | Normal | Card & panel titles |
| **Body** | Inter | 0.875rem – 1rem (`text-sm` to `text-base`) | Regular (400) | Normal | Paragraphs & descriptions |
| **Small / Control** | Inter | 0.8125rem – 0.875rem (`text-xs` to `text-sm`) | Medium (500) | Normal | Buttons, tabs, table cells |
| **Caption / Meta** | Inter / Mono | 0.6875rem – 0.75rem (`text-[11px]` to `text-xs`) | Medium (500) | Wide (`0.05em`) | Badges, timestamps, plates |

---

## 3. Layout Primitives (`src/components/layout/`)

- [`PageContainer`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/layout/page-container.tsx): Centralized container ensuring responsive padding (`px-4 sm:px-6 lg:px-8`) and standard content bounds (`sm: max-w-3xl`, `md: max-w-5xl`, `lg: max-w-7xl`, `xl: max-w-screen-2xl`).
- [`Section`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/layout/section.tsx): Semantic `<section>` element managing vertical spacing rhythm (`none`, `sm`, `md`, `lg`, `xl`).
- [`Stack`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/layout/stack.tsx): Flexbox wrapper strictly using `gap-*` (no legacy space utilities) with direction and alignment tokens.
- [`Grid`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/layout/grid.tsx): Responsive grid columns supporting standard counts (1, 2, 3, 4, 6, 12, and `responsive-cards`).
- [`PageHeader`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/layout/page-header.tsx): Standardized top area for pages with title, subtitle, optional breadcrumb, and action buttons.

---

## 4. Semantic Status Language (`src/components/common/`)

[`StatusBadge`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/common/status-badge.tsx) establishes the status language:

| Status | Visual Tone | Icon | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **`success`** | Emerald subtle tint | `RiCheckboxCircleLine` | Confirmed booking, vehicle ready, clean condition |
| **`pending`** | Orange / Amber subtle | `RiTimeLine` | Turnaround in queue, quote review, awaiting key release |
| **`warning`** | Yellow / Amber tint | `RiAlertLine` | Inspection due, maintenance flag, upcoming service |
| **`error`** | Destructive / Crimson | `RiCloseCircleLine` | Overdue return, reservation cancelled, inspection failure |
| **`info`** | Sky Blue tint | `RiInformationLine` | Documentation needed, identity notice, informational message |
| **`neutral`** | Muted slate | `RiRecordCircleLine` | Inactive vehicle, draft quotation, offline hub |

---

## 5. Reusable Common Feedback Primitives

- [`EmptyState`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/common/empty-state.tsx): Built on shadcn's `Empty` primitive with standard presets (`vehicles`, `reservations`, `notifications`, `search`, `general`).
- [`ErrorState`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/common/error-state.tsx): Built on shadcn's `Alert` primitive with inline and full-card modes, supporting retry actions.
- [`LoadingState`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/common/loading-state.tsx): Centralized loading skeleton and spinner patterns for cards, tables, and detail screens.

---

## 6. Customer Application Shell (`src/components/shell/customer/`)

The customer shell is visual, spacious, and conversion-friendly:
- [`CustomerHeader`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/shell/customer/customer-header.tsx): Sticky header with elevation blur, brand mark, horizontal navigation, mock account dropdown menu, primary CTA, and mobile trigger.
- [`CustomerMobileNav`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/shell/customer/customer-mobile-nav.tsx): Accessible slide-out `Sheet` navigation drawer with touch-friendly links, account overview, and quick booking button.
- [`CustomerFooter`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/shell/customer/customer-footer.tsx): Multi-column footer covering Fleet, Experiences, Support, Policies, and legal notices.
- [`CustomerShell`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/shell/customer/customer-shell.tsx): Orchestrates header, content landmark (`#main-content`), and footer.

---

## 7. Administrative Application Shell (`src/components/shell/admin/`)

The admin shell is dense, structured, and operational:
- [`AdminSidebar`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/shell/admin/admin-sidebar.tsx): Desktop fixed/sticky sidebar with collapsible toggle, grouped modules (Operations, Customers, System), badge notifications, and mobile drawer adaptation.
- [`AdminHeader`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/shell/admin/admin-header.tsx): High-density operational bar with dynamic breadcrumbs, live hub health indicator, quick search shortcut (`⌘K`), notifications trigger, and staff profile dropdown.
- [`AdminShell`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/shell/admin/admin-shell.tsx): Cohesive shell wrapping administrative pages at `/admin`.

### Administrative Page Primitives (`src/components/admin/primitives/`)
- [`MetricCard`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/admin/primitives/metric-card.tsx): KPI metrics with upward/downward trends, badges, and contextual comparison.
- [`FilterBar`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/admin/primitives/filter-bar.tsx): Search input, status select, refresh button, clear trigger, and record counter.
- [`DataTableWrapper`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/admin/primitives/data-table-wrapper.tsx): Horizontal overflow container with pagination controls and loading/empty handling.
- [`DetailPanel`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/admin/primitives/detail-panel.tsx): Side-panel slide-over drawer for operational vehicle and booking inspections.
- [`ConfirmationDialog`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/admin/primitives/confirmation-dialog.tsx): Accessible dialog for confirming sensitive administrative actions.
- [`SectionHeader`](file:///c:/Users/Niqsy/Desktop/veyra/src/components/admin/primitives/section-header.tsx): Concise section divider with badge and action slots.

---

## 8. Customer vs. Admin Design Distinction

| Characteristic | Customer Portal (`/`, `/vehicles`) | Admin Operations Portal (`/admin/*`) |
| :--- | :--- | :--- |
| **Tone** | Emotional, refined, aspirational | Tactical, precise, information-dense |
| **Whitespace** | Generous (`py-12`, `py-16`, spacious grids) | Compact (`p-4`, `p-6`, tight grids) |
| **Navigation** | Top horizontal bar + mobile drawer | Persistent multi-group sidebar + top breadcrumb bar |
| **Information Density** | Low to medium (scannable cards, key highlights) | High (data tables, KPI metrics, telemetry badges) |
| **Primary Actions** | "Find a Car", "Book Vehicle", "Reserve" | "Inspect", "Export Manifest", "Flag Maintenance" |

---

## 9. Responsive & Accessibility Conventions

### Breakpoint Matrix
- **Mobile (320px – 430px)**: Single column layouts, mobile sheets for navigation, touch target controls (`min-h-[36px]`), stacked action buttons.
- **Tablet (768px – 1023px)**: 2-column grids, compact sidebar mode, condensed tables with horizontal scroll containers.
- **Desktop (1024px – 1440px+)**: Multi-column grids (3–4 cols), persistent sidebar, side-panel inspection drawers.

### Accessibility Standards
- All interactive elements use standard HTML button/link primitives or Base UI accessible triggers via `render`.
- Overlays (Dialogs and Sheets) always include accessible `Title` and `Description` elements.
- Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) are strictly used.
- Keyboard navigation flows logically with visible `focus-visible:ring-3` indicators.
