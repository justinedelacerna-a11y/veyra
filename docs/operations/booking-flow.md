# Veyra Customer Booking Architecture & Flow

## 1. Executive Summary

Phase 4 implements the complete end-to-end customer booking flow for Veyra in **frontend-first** mode. The customer transitions seamlessly from Vehicle Details into a dedicated, distraction-free multi-step booking funnel:

```
[Vehicle Details] 
       │
       ▼
01 Vehicle ──► 02 Options ──► 03 Driver ──► 04 Review ──► 05 Payment ──► 06 Confirmation
```

All pricing, option selections, and driver credentials are orchestrated through a central client-side state machine (`BookingProvider`) with `sessionStorage` persistence, allowing customers to navigate backward and forward, edit earlier sections, and refresh pages without losing context.

---

## 2. Customer Journey & Step Routing

| Step | Route | Primary Objective | Key Actions & Inclusions |
| :--- | :--- | :--- | :--- |
| **01 Vehicle** | `/booking` | Confirm vehicle specs & handover station | Review model specifications, doors, luggage, engine, pickup/return dates. Action: "Change Car" returns to catalog. |
| **02 Options** | `/booking/options` | Configure add-ons & excess protection | Selectable cards for Full Protection Waiver, Additional Driver, In-Car Wi-Fi, Child Seat, and Unlimited Mileage. |
| **03 Driver** | `/booking/driver` | Enter verified driver credentials | Semantic form with client-side validation for first/last name, email, phone, birth date (21+ minimum), and driver license number. |
| **04 Review** | `/booking/review` | Verify complete itinerary & terms | Comprehensive breakdown of vehicle, dates, locations, selected options, and driver details with modular `[Edit]` buttons for each section. |
| **05 Payment** | `/booking/payment` | Select payment method & policies | Payment Agreement & Handover. When `PAYMENTS_ENABLED=false`, payment is deferred with `payment_status='pending'`. Enforces terms & cancellation policy acknowledgement. |
| **06 Confirmation** | `/booking/confirmation` | View booking reference & next steps | Displays authoritative booking reference (e.g., `VYR-2026-ABCD`), airport valet handover instructions, payment pending status, printable summary, and customer portal links. |

---

## 3. Booking State Concept & Data Model

The booking state is governed by `BookingDraft` in [`src/features/booking/types.ts`](file:///c:/Users/Niqsy/Desktop/veyra/src/features/booking/types.ts):

```typescript
export interface BookingDraft {
  vehicleId: string
  pickupLocationId: string
  returnLocationId: string
  pickupDate: string
  pickupTime: string
  returnDate: string
  returnTime: string
  selectedExtras: string[] // ExtraOption IDs
  driver: DriverDetails
  paymentMethod: "card" | "e-wallet" | "counter"
  agreedToTerms: boolean
  agreedToCancellation: boolean
  bookingReference?: string
}
```

### State Lifecycle
1. **Initialization (`initializing`)**: Initialized from URL query parameters passed from `/vehicles/[id]` or `/search` (`vehicleId`, `pickup`, `returnLoc`, `from`, `to`). Restores existing drafts from `sessionStorage` (`veyra_booking_draft_v1`) if available.
2. **Editing (`editing`)**: Reactive updates when selecting/unselecting add-ons, altering dates, or typing driver details.
3. **Validating (`validating`)**:
   - `validateDriverStep()`: Validates required name lengths (>= 2 chars), email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), phone length (>= 10 digits), minimum age (21+ years old), and license number.
   - `validatePaymentStep()`: Requires explicit acknowledgement of rental policies and refundable security deposit terms.
4. **Confirmation (`confirmed`)**: Generates deterministic mock booking reference (`VYR-DEMO-XXXX`) and transitions customer to the confirmation screen.

---

## 4. Centralized Mock Pricing Engine

All pricing is encapsulated inside [`src/features/booking/lib/pricing.ts`](file:///c:/Users/Niqsy/Desktop/veyra/src/features/booking/lib/pricing.ts):

$$\text{Base Rental} = \text{Vehicle Daily Rate} \times \max(1, \text{Rental Duration in Days})$$

$$\text{Extras Subtotal} = \sum_{\text{extra} \in \text{Selected}} (\text{Extra Daily Rate} \times \text{Rental Duration})$$

$$\text{Total Rental Price} = \text{Base Rental} + \text{Extras Subtotal}$$

### Strict Separation of Security Deposit
The **Refundable Security Deposit** (e.g. ₱10,000–₱25,000 depending on vehicle tier) is **strictly separated** from the rental price total. It is not added to the rental subtotal; it is clearly communicated as a pre-authorization hold processed on physical key handover.

---

## 5. Future Backend Integration Boundaries

The frontend booking architecture is intentionally decoupled to ease future backend integrations:

```
┌───────────────────────────────────────┐
│     UI Layer (React Components)       │
│  VehicleStep, OptionsStep, DriverStep │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│       Booking Context & State         │  ◄── Client-side draft synchronization
│         (useBooking() Hook)           │
└──────────────────┬────────────────────┘
                   │
         [Integration Boundary]
                   │
     ┌─────────────┴─────────────┐
     ▼                           ▼
[Phase 4: Mock Engine]     [Future Phases: Server Backend]
- Local storage sync       - Clerk authenticated user session
- In-memory pricing        - Supabase Postgres RPC quote calculation
- Simulated reference      - Server-authoritative inventory hold
                           - Real payment gateway webhook (Stripe/PayMongo)
```

---

## 6. Key UX & Accessibility Decisions

1. **Distraction-Free Layout**:
   - Replaced general navigation menus with [`BookingHeader`](file:///c:/Users/Niqsy/Desktop/veyra/src/features/booking/components/booking-header.tsx) to prevent accidental abandonment.
   - Provided an explicit "Exit" dialog to safeguard unsaved draft progress.
2. **Persistent Stepper (`BookingProgress`)**:
   - Visual progress bar on mobile; semantic ordered list (`<ol>`) on desktop with `aria-current="step"`.
   - Completed steps allow immediate click-back navigation.
3. **Two-Column Desktop / Bottom Drawer Mobile (`BookingSummary`)**:
   - Desktop: Sticky right sidebar displaying vehicle thumbnail, itinerary, add-ons, and pricing.
   - Mobile: Fixed bottom bar displaying the estimated total with a slide-up sheet drawer for the detailed breakdown.
4. **Non-Destructive Section Editing**:
   - On the `/booking/review` step, each section includes an individual `[Edit]` button routing back to that exact step without resetting previously entered inputs.
5. **Clear Mock / Prototype Notices**:
   - Zero ambiguous claims: Explicit badges clarify that no actual credit card transactions or document uploads occur.
