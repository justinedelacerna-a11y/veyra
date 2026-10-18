# Veyra — Capstone Presentation Guide (10–15 Minutes)

This presentation guide provides a structured, repeatable demonstration script for academic evaluators, faculty panelists, and technical reviewers. It showcases Veyra’s architecture, customer booking journey, simulated multi-method payment module, and back-office administrative fleet logistics.

---

## Presentation Overview & Timing

| Segment | Topic | Focus | Target Duration |
| :--- | :--- | :--- | :---: |
| **Introduction** | Project Purpose & Problem Statement | Car rental logistics in Butuan City, Agusan del Norte | 1–2 mins |
| **Part A** | Customer Booking Journey | Vehicle selection, duration calculation, Butuan map, KYC & Terms | 4–5 mins |
| **Part B** | Simulated Multi-Method Payments | GCash/Maya demo, error simulation, retry, and watermark receipt | 3–4 mins |
| **Part C** | Back-Office Admin Fleet Operations | Review & approval, vehicle handover, customer timeline sync, return & completion | 4–5 mins |
| **Conclusion & Q&A** | Technical Architecture & Architecture Invariants | Clerk auth, Supabase RLS, optimistic concurrency, financial isolation | 2–3 mins |

---

## Part A — Customer Booking Journey (4–5 Minutes)

### Step 1: Introduce Veyra and Its Purpose
- **Screen:** Homepage ([`https://veyra-tau-one.vercel.app`](https://veyra-tau-one.vercel.app/) or local `http://localhost:3000`).
- **Action:** Scroll through the hero section highlighting the tagline: *"Local Car Rental in Butuan City, Agusan del Norte"*.
- **Suggested Narration:**
  > *"Good morning, esteemed panel. Today, we are presenting Veyra, an end-to-end car rental platform tailored specifically for Butuan City and Agusan del Norte. In regional car rentals, customers typically face friction with non-guaranteed vehicle models, opaque pricing, ambiguous pickup points, and manual paperwork. Veyra solves this by digitizing the entire rental lifecycle—from barangay-level coordination and instant duration pricing to digital KYC verification and formal operational handovers."*

---

### Step 2: Browse Vehicles & Show Authentic Photography
- **Screen:** Navigate to `/vehicles` or the Featured Fleet section.
- **Action:** Filter by category (Sedans, Hatchbacks, MPVs). Highlight that exact models are guaranteed with zero arbitrary substitutions. Show real vehicle photos served via Supabase Storage.
- **Suggested Narration:**
  > *"Here in our vehicle catalogue, customers browse our active fleet—economical sedans, compact hatchbacks, and 7-seater MPVs starting at affordable regional rates (₱1,300 to ₱2,500/day). Each vehicle showcases authentic photography and complete technical specifications (transmission, fuel type, seating, and luggage capacity). Notice our 'Guaranteed Models' standard: what the customer selects is the exact vehicle prepared for handover."*

---

### Step 3: Select a Vehicle & Choose Custom Rental Duration
- **Screen:** Vehicle detail page (e.g., `/vehicles/a0000000-0000-0000-0000-000000000003` — 2024 Toyota Vios).
- **Action:** Click "Book Now". Adjust the rental duration from 3 days to 5 days, or enter an extended duration (e.g., 14 days or 30 days).
- **Suggested Narration:**
  > *"One of Veyra's key architectural features is flexible, customer-selected rental duration. Rather than forcing rigid daily slots, customers can choose anywhere from single-day travel to 30, 60, or extended monthly rentals. As we adjust the duration, the system calculates the return timestamp across 24-hour cycles and recalculates the live quote server-side to prevent client tampering."*

---

### Step 4: Full Butuan City Map & Barangay Coordinate Selection
- **Screen:** Booking pickup location step.
- **Action:** Open the Butuan City map view. Select a pickup hub (e.g., *Barangay Libertad Hub* or *Barangay San Vicente Hub*). Check the "Deliver to custom address" option and type a street address (e.g., *"Montilla Boulevard, Brgy. Dagohoy"*).
- **Suggested Narration:**
  > *"Veyra is localized down to Butuan City's official barangay network. We maintain 8 operational hubs across key transit points—including Bancasi Airport, SM City Butuan, Robinsons Place, and terminal hubs. If a customer requires delivery to their residence or hotel, our geospatial validator confirms that the address falls within our 35-kilometer Butuan City service perimeter."*

---

### Step 5: KYC Verification & Terms of Service Acceptance
- **Screen:** Checkout driver & verification review.
- **Action:** 
  1. Highlight the KYC driver's license status: verified customers proceed seamlessly; unverified customers upload their license directly into private Supabase storage.
  2. Point out that optional documents (proof of billing) do not block mobility when a valid driver's license is verified.
  3. Scroll to the Terms of Service checkbox and click "Review Terms".
- **Suggested Narration:**
  > *"Safety and regulatory compliance are integral to Veyra. Customers must upload an official driver's license, which is stored in a private Supabase Storage bucket protected by strict Row-Level Security. Furthermore, before booking, customers must explicitly accept our 17-clause rental agreement. When accepted, Veyra cryptographically hashes the client's IP address using SHA-256 and records it in an immutable audit ledger without exposing raw customer IP addresses."*

---

## Part B — Simulated Multi-Method Payments (3–4 Minutes)

### Step 1: Select GCash Demo or Maya Demo
- **Screen:** Payment Selection screen (`/booking/payment` or `/booking/demo-checkout`).
- **Action:** Display the available payment methods: **GCash (Demo)**, **Maya (Demo)**, **Card (Demo)**, **Bank Transfer (Demo)**, and **Pay at Pickup**. Click on **GCash (Demo)**.
- **Suggested Narration:**
  > *"For our academic capstone demonstration, Veyra incorporates a multi-method demo payment module. This replicates the real-world Philippine payment landscape—supporting GCash, Maya, cards, and bank transfers—while ensuring zero financial risk. Notice our prominent warning banner stating that no real money is involved."*

---

### Step 2: Demonstrate a Failed Transaction & Self-Service Retry
- **Screen:** Demo Payment Simulation modal/screen.
- **Action:** Click **Simulate Failed Payment (Insufficient Balance)**. Show the red error alert indicating payment failure. Click **Retry Payment**.
- **Suggested Narration:**
  > *"Reliable software must handle failure gracefully. Here, we simulate a common edge case: insufficient e-wallet funds. The system catches the decline, records a failed transaction in our payment audit ledger, keeps the reservation in a recoverable state, and allows the customer to retry without restarting their booking."*

---

### Step 3: Simulate Successful Payment & Verify Demo Receipt
- **Screen:** Re-attempt with GCash Demo and click **Simulate Successful Payment**.
- **Action:** The simulation completes. The screen transitions to the Confirmation / Receipt page. Highlight the watermark label: `"DEMO — NO REAL MONEY INVOLVED"`.
- **Suggested Narration:**
  > *"Upon clicking 'Simulate Successful Payment', the server processes the webhook simulation, generates an authoritative reference code, marks the payment as captured, and produces an itemized demo receipt. Notice the clear watermark 'DEMO — NO REAL MONEY INVOLVED'. In our database, this transaction is flagged with 'is_demo: true' so it is strictly excluded from actual company revenue figures."*

---

### Step 4: Show the Customer Reservation Timeline in Pending Review
- **Screen:** Customer Reservation Details (`/account/reservations/[id]`).
- **Action:** Review the customer milestone timeline. Show that **Awaiting Admin Approval** is active. Explain that paying does NOT automatically confirm or activate the car.
- **Suggested Narration:**
  > *"Notice the customer timeline. Even though payment succeeded, the car is NOT yet handed over or confirmed. The reservation enters 'Pending Approval' for staff review. This prevents vehicle availability collisions and gives fleet operations full oversight."*

---

## Part C — Back-Office Admin Fleet Operations (4–5 Minutes)

### Step 1: Sign in with Authorized Admin Account
- **Screen:** Navigate to `/admin`.
- **Action:** Access the Admin Dashboard using an authorized administrator session (`justine.delacerna@urios.edu.ph` / Superadmin).
- **Suggested Narration:**
  > *"Now we transition to the administrative operations console. Role-based access control ensures only staff accounts can access these routes; unauthenticated users or customers attempting to access `/admin` are immediately redirected."*

---

### Step 2: Review & Approve the Submitted Reservation
- **Screen:** `/admin/reservations` $\rightarrow$ Open the pending reservation.
- **Action:** Inspect the reservation details (vehicle, customer KYC status, payment confirmation, pickup hub). Click **Approve Reservation**.
- **Suggested Narration:**
  > *"Under the Reservations queue, staff review the incoming booking. All customer documents and payment logs are verified. Once the fleet manager approves the booking, the reservation transitions to 'Confirmed'. The customer's account timeline updates immediately to show 'Booking Confirmed' and 'Pickup & Key Handover — Current Stage'."*

---

### Step 3: Conduct Pre-Trip Inspection & Record Vehicle Handover
- **Screen:** Admin Reservation Details $\rightarrow$ Click **Handover (Start Rental)**.
- **Action:** 
  1. Enter odometer reading (e.g., `14,500 km`).
  2. Enter fuel level (e.g., `100%`).
  3. Confirm customer presence and pre-trip inspection notes.
  4. Click **Confirm Handover**.
- **Suggested Narration:**
  > *"When the customer arrives at the designated Butuan City hub, staff perform a physical pre-trip inspection. Staff record the current odometer reading and fuel percentage. Once staff clicks 'Confirm Handover', our system creates a formal inspection record with status 'pass', sets 'actual_pickup_at', switches the vehicle to 'rented', and transitions the reservation to 'Active'."*

---

### Step 4: Verify the Customer Timeline Displays "Active Rental — Current Stage"
- **Screen:** Switch to customer view (`/account/reservations/[id]`).
- **Action:** Refresh the page. Highlight the milestone:
  - Milestone *Pickup & Key Handover*: Marked with green checkmark (Completed).
  - Milestone *Active Rental*: Highlighted with pulsing indicator and badge: **CURRENT STAGE**.
- **Suggested Narration:**
  > *"Switching back to the customer view and refreshing the page, we see the immediate real-time synchronization. The Pickup stage is marked completed with the exact handover timestamp, and 'Active Rental' is now displayed as the current stage. The customer has full peace of mind that their trip is officially underway."*

---

### Step 5: Vehicle Return & Final Inspection
- **Screen:** Back to Admin console $\rightarrow$ Click **Record Return**.
- **Action:** 
  1. Record return odometer (e.g., `14,850 km`).
  2. Record return fuel (e.g., `95%`).
  3. Confirm damage status is `no_damage`.
  4. Submit return. Show transition to `return_inspection`.
  5. Click **Finalize Inspection & Release Hold**. Show transition to `completed`.
- **Suggested Narration:**
  > *"When the vehicle is returned, staff conduct the post-trip return inspection. Once damages are verified as absent and fuel is checked, the inspection is signed off. The reservation transitions to 'Completed', releasing any refundable security deposit hold and immediately returning the vehicle to 'available' status in fleet inventory."*

---

### Step 6: KYC Document Review & Demo Payment Ledger Audit
- **Screen:** 
  1. Navigate to `/admin/customers` $\rightarrow$ Show customer KYC review portal with short-lived signed URLs.
  2. Navigate to `/admin/payments` $\rightarrow$ Show the Demo Payment Ledger.
- **Action:** Point out that demo payments are totaled under "Simulated Payment Volume" and strictly excluded from real captured revenue.
- **Suggested Narration:**
  > *"Finally, here in our administrative governance screens, staff can securely review customer KYC driver's licenses via 5-minute temporary signed URLs without exposing private storage buckets. In the Payment Ledger, notice our strict financial isolation: all simulated transactions are grouped under 'Simulated Payment Volume (Demo)' and completely isolated from genuine revenue figures."*

---

## Conclusion & Key Architectural Highlights (1–2 Minutes)

1. **Production-Grade Next.js 16 App Router & React 19:** Server components for performance; server actions with optimistic concurrency locks for data consistency.
2. **Clerk Authentication & Role-Based Access Control:** Strict segregation between public users, verified customers, branch staff, and superadmins.
3. **Supabase PostgreSQL & Row-Level Security:** 12 synchronized migrations, check constraints enforcing valid inspection statuses (`pass`), and private storage buckets.
4. **Comprehensive Test Suite:** 204 automated tests across 32 suites verifying all lifecycle transitions, edge cases, and security boundaries.

---

## Anticipated Panel Questions & Answers

### Q1: "Why use simulated payments instead of PayMongo live mode?"
> **Answer:** *"For academic demonstrations and thesis defense, real-money processing introduces live credit-card liabilities, financial fees, and security compliance burdens. Our simulated payment provider mimics the full payment lifecycle—including webhooks, failed payment handling, retry mechanisms, and receipt generation—while enforcing absolute financial safety and isolation."*

### Q2: "How do you prevent two customers from booking the same car at the same time?"
> **Answer:** *"Availability is checked at quotation and strictly re-validated upon booking creation. Furthermore, our database uses optimistic concurrency locking (`.eq('status', res.status)`) during approval and handover transitions so concurrent requests cannot corrupt state or double-book vehicles."*

### Q3: "What happens if a customer uploads an invalid file for KYC?"
> **Answer:** *"The server action strictly validates file size (maximum 10 MB) and MIME types (JPEG, PNG, WebP, PDF). Files are assigned unpredictable UUIDs in private storage. Furthermore, staff can reject the document with a recorded reason, which immediately alerts the customer on their account screen."*
