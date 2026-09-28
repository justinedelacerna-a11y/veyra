# Veyra Customer Promises vs. Backend Reality: Business Claim Review

This document audits the customer-facing claims and value propositions displayed on Veyra's marketing and booking interfaces, comparing them against the necessary backend architecture, database schemas, and operational requirements needed to fulfill each promise without brand or legal exposure.

---

## 1. Audit Summary Matrix

| Marketing / UI Claim | Location in UI | Backend Requirement | Operational Dependency | Status / Gap Analysis |
|---|---|---|---|---|
| **"Guaranteed Exact Models"** (Never "Or Similar") | `trust-reassurance.tsx`, vehicle catalog | Assign specific `vehicle_model_id` (and eventually specific `fleet_vehicle_id` VIN); strict availability check | Fleet dispatch discipline; buffer time between bookings for cleaning and maintenance | **Achievable:** Data model is model-specific, not ACRISS category based. Requires emergency substitution policy if assigned vehicle breaks down. |
| **"24/7 Roadside Concierge"** | `trust-reassurance.tsx`, footer, support | `incident_reports` table, mobile tow dispatch tracking, SMS notification bridge | 24/7 contracted roadside assistance vendor (e.g., Automobile Association Philippines / AAP) or round-the-clock staff rotation | **Gap:** Requires operational partner contract and dispatch ticketing system before launch. |
| **"Free Cancellation Up to 24h"** | `trust-reassurance.tsx`, cancellation modal | Timestamp comparison (`pickup_time - NOW() >= 24 hours`); automated PayMongo full refund dispatch | Banking timeline: 5–10 business days for credit card reversal | **Achievable:** Encoded directly into reservation state machine and refund transaction boundary. |
| **"Instant Booking Confirmation"** | Hero, search results | Automated payment webhook processing and automated reservation confirmation | PayMongo gateway uptime and reliable webhook pipeline | **Achievable:** Webhook handler transitions state and issues confirmation voucher in < 3 seconds. |
| **"Transparent Pricing — Zero Hidden Fees"** | Pricing breakdown, checkout summary | Immutable `quote_snapshots` with explicit line items: base rate, VAT, optional coverage, security deposit | Strict policy prohibiting at-the-counter surprise add-ons | **Achievable:** Quote snapshot engine locks all fees in minor units (centavos). |
| **"Airport VIP Meet & Greet"** | Location details, checkout options | Optional flight number tracking field (`reservations.flight_number`); arrival buffer logic | Branch staff airport badge access and flight radar tracking | **Gap:** Needs `flight_number` column in `reservations` schema and branch flight tracking standard operating procedure. |

---

## 2. In-Depth Operational Gap Analysis & Solutions

### 2.1 "Guaranteed Exact Models"
* **The Marketing Promise:** Traditional car rental companies book generic categories ("Compact or similar", "Midsize SUV or similar"). Veyra promises the customer will receive the exact make, model, and trim they selected (e.g., BMW 3 Series M-Sport, not a generic sedan).
* **Backend Architectural Enforcement:**
  1. `quotes` and `reservations` link to specific `vehicle_model_id` rows, never generic vehicle classes.
  2. Availability engine computes capacity strictly at the specific model level.
  3. Pre-allocation locks a specific physical unit (`fleet_vehicle_id`) 24 hours prior to pickup.
* **Failure Scenario (Vehicle Damaged by Previous Renter):**
  * If the exact car is returned damaged or mechanically disabled 2 hours before the next scheduled pickup:
  * Backend triggers the **"Model Guarantee Disruption Protocol"**:
    * Automatically upgrades customer to a higher-tier vehicle at zero extra cost.
    * Generates a ₱2,500 customer goodwill credit toward future rentals.
    * Dispatches automated SMS notification offering choice between complimentary upgrade or 100% immediate refund.

---

### 2.2 "Free Cancellation Up to 24 Hours Before Pickup"
* **The Marketing Promise:** 100% money-back guarantee if cancelled at least 24 hours before scheduled pickup time.
* **Backend Architectural Enforcement:**
  ```typescript
  // Enforced in Server Action / API Route
  const hoursUntilPickup = differenceInHours(reservation.startTime, new Date());
  
  if (hoursUntilPickup >= 24) {
    // 100% Refund of base rental, extras, and security deposit
    refundAmount = reservation.totalPaidCentavos;
    feeAmount = 0;
  } else if (hoursUntilPickup > 0) {
    // Late cancellation fee: 1 day rental charged, remainder refunded
    feeAmount = reservation.oneDayRateCentavos;
    refundAmount = reservation.totalPaidCentavos - feeAmount;
  } else {
    // Post-pickup / No-show: 0% refund
    feeAmount = reservation.totalPaidCentavos;
    refundAmount = 0;
  }
  ```
* **Customer UX Clarity:** The UI must display the exact local cut-off timestamp (e.g., *"Free cancellation until Oct 14, 2026, 10:00 AM PHT"*) rather than a vague relative phrase.

---

### 2.3 "24/7 Roadside Concierge"
* **The Marketing Promise:** Immediate breakdown, flat tire, and emergency support anywhere in the operational territory.
* **Backend Architecture:**
  * Endpoint: `POST /api/v1/customer/assistance/request`
  * Captures: GPS coordinates, vehicle issue category (`FLAT_TIRE`, `DEAD_BATTERY`, `ACCIDENT`, `KEY_LOCKOUT`), customer callback number.
  * Dispatches alert webhook to Operations on-call team and creates tracking ticket in internal admin.
* **Operational Readiness Prerequisite:**
  * Must finalize a service level agreement (SLA) with a nationwide towing and roadside provider (e.g., AAP) guaranteeing <45-minute dispatch in Metro Manila and Cebu before launching this claim publicly.

---

### 2.4 "Airport VIP Meet & Greet"
* **The Marketing Promise:** Personal airport terminal curbside delivery with staff holding a name sign.
* **Backend Schema Requirement:**
  * Ensure `reservations` table includes:
    * `flight_number`: VARCHAR(16)
    * `airline`: VARCHAR(64)
    * `terminal_number`: VARCHAR(16)
  * Buffer logic in availability engine: Adds 90 minutes of post-arrival buffer to protect against flight delays without triggering immediate no-show cancellation.
