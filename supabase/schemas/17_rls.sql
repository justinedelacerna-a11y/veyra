-- ============================================================
-- Veyra -- Row-Level Security Policies (17)
-- SECURITY MODEL:
--   1. Primary authorization: Next.js Server Actions / Route Handlers
--   2. RLS: Database-level enforcement layer (defense-in-depth)
-- PATTERN: Clerk Native Third-Party Auth
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_classes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_features       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_extras           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_extras     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_drivers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue     ENABLE ROW LEVEL SECURITY;

-- EXPLICIT REVOKES: Belt-and-suspenders protection
REVOKE INSERT, UPDATE, DELETE ON public.webhook_events  FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_events    FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments        FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.refunds         FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.deposits        FROM authenticated;

-- 1. USERS
CREATE POLICY "users: own row select"       ON public.users FOR SELECT TO authenticated USING (id = veyra_private.current_user_id());
CREATE POLICY "users: admin select all"     ON public.users FOR SELECT TO authenticated USING (veyra_private.is_admin());
CREATE POLICY "users: support select"       ON public.users FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support', 'finance', 'admin', 'superadmin'));

-- 2. CUSTOMERS
CREATE POLICY "customers: own row select"   ON public.customers FOR SELECT TO authenticated USING (user_id = veyra_private.current_user_id());
CREATE POLICY "customers: staff select"     ON public.customers FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support', 'finance', 'admin', 'superadmin'));
CREATE POLICY "customers: own row update"   ON public.customers FOR UPDATE TO authenticated USING (user_id = veyra_private.current_user_id()) WITH CHECK (user_id = veyra_private.current_user_id());
CREATE POLICY "customers: admin update"     ON public.customers FOR UPDATE TO authenticated USING (veyra_private.is_admin()) WITH CHECK (veyra_private.is_admin());

-- 3. STAFF_USERS
CREATE POLICY "staff_users: own row select" ON public.staff_users FOR SELECT TO authenticated USING (user_id = veyra_private.current_user_id());
CREATE POLICY "staff_users: admin select"   ON public.staff_users FOR SELECT TO authenticated USING (veyra_private.is_admin());

-- 4. BRANCHES
CREATE POLICY "branches: anon read active"  ON public.branches FOR SELECT TO anon         USING (status = 'active');
CREATE POLICY "branches: auth read"         ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "branches: admin write"       ON public.branches FOR ALL    TO authenticated USING (veyra_private.is_admin()) WITH CHECK (veyra_private.is_admin());

-- 5. LOCATIONS
CREATE POLICY "locations: anon read active" ON public.locations FOR SELECT TO anon         USING (status = 'active');
CREATE POLICY "locations: auth read"        ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "locations: admin write"      ON public.locations FOR ALL    TO authenticated USING (veyra_private.is_admin()) WITH CHECK (veyra_private.is_admin());

-- 6. VEHICLE_CLASSES
CREATE POLICY "vehicle_classes: anon read"          ON public.vehicle_classes FOR SELECT TO anon         USING (true);
CREATE POLICY "vehicle_classes: auth read"          ON public.vehicle_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicle_classes: fleet mgr write"    ON public.vehicle_classes FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));

-- 7. VEHICLES (sensitive — no anon access; use vehicle_catalog view)
CREATE POLICY "vehicles: fleet mgr write"
  ON public.vehicles FOR ALL TO authenticated
  USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'))
  WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));

CREATE POLICY "vehicles: staff read"
  ON public.vehicles FOR SELECT TO authenticated
  USING (veyra_private.current_staff_role() IN ('fleet_manager','support','admin','superadmin'));

CREATE POLICY "vehicles: branch staff read own branch"
  ON public.vehicles FOR SELECT TO authenticated
  USING (
    veyra_private.current_staff_role() IN ('branch_staff','branch_manager')
    AND branch_id = veyra_private.current_branch_id()
  );

CREATE POLICY "vehicles: branch staff status update"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND branch_id = veyra_private.current_branch_id())
  WITH CHECK (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND branch_id = veyra_private.current_branch_id());

-- 8. VEHICLE_FEATURES
CREATE POLICY "vehicle_features: anon read"       ON public.vehicle_features FOR SELECT TO anon         USING (true);
CREATE POLICY "vehicle_features: auth read"        ON public.vehicle_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicle_features: fleet mgr write"  ON public.vehicle_features FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));

-- 9. VEHICLE_PHOTOS
CREATE POLICY "vehicle_photos: anon marketing"     ON public.vehicle_photos FOR SELECT TO anon         USING (type = 'marketing');
CREATE POLICY "vehicle_photos: staff read all"     ON public.vehicle_photos FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);
CREATE POLICY "vehicle_photos: customer marketing" ON public.vehicle_photos FOR SELECT TO authenticated USING (type = 'marketing' AND veyra_private.current_staff_role() IS NULL AND veyra_private.current_customer_id() IS NOT NULL);
CREATE POLICY "vehicle_photos: fleet mgr write"    ON public.vehicle_photos FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "vehicle_photos: branch staff upload" ON public.vehicle_photos FOR INSERT TO authenticated WITH CHECK (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND type IN ('inspection','damage'));

-- 10. AVAILABILITY_BLOCKS
CREATE POLICY "availability_blocks: fleet read"    ON public.availability_blocks FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "availability_blocks: branch read"   ON public.availability_blocks FOR SELECT TO authenticated
  USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.branch_id = veyra_private.current_branch_id()));
CREATE POLICY "availability_blocks: fleet write"   ON public.availability_blocks FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "availability_blocks: br mgr insert" ON public.availability_blocks FOR INSERT TO authenticated
  WITH CHECK (veyra_private.current_staff_role() = 'branch_manager' AND type IN ('cleaning','hold') AND EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.branch_id = veyra_private.current_branch_id()));

-- 11. EXTRAS
CREATE POLICY "extras: anon read active"       ON public.extras FOR SELECT TO anon         USING (is_active = true);
CREATE POLICY "extras: auth read"              ON public.extras FOR SELECT TO authenticated USING (true);
CREATE POLICY "extras: finance admin write"    ON public.extras FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));

-- 12. RATE_PLANS
CREATE POLICY "rate_plans: staff read"         ON public.rate_plans FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);
CREATE POLICY "rate_plans: finance admin write" ON public.rate_plans FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));

-- 13. QUOTES (immutable after creation)
CREATE POLICY "quotes: own select"             ON public.quotes FOR SELECT TO authenticated USING (customer_id = veyra_private.current_customer_id());
CREATE POLICY "quotes: staff select"           ON public.quotes FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support','finance','branch_staff','branch_manager','admin','superadmin'));
CREATE POLICY "quotes: own insert"             ON public.quotes FOR INSERT TO authenticated WITH CHECK (customer_id = veyra_private.current_customer_id());
CREATE POLICY "quote_extras: own select"       ON public.quote_extras FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "quote_extras: staff select"     ON public.quote_extras FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);

-- 14. RESERVATIONS
CREATE POLICY "reservations: own select"
  ON public.reservations FOR SELECT TO authenticated USING (customer_id = veyra_private.current_customer_id());

CREATE POLICY "reservations: branch staff select"
  ON public.reservations FOR SELECT TO authenticated
  USING (
    veyra_private.current_staff_role() IN ('branch_staff','branch_manager')
    AND (pickup_location_id IN (SELECT id FROM public.locations WHERE branch_id = veyra_private.current_branch_id())
      OR return_location_id IN (SELECT id FROM public.locations WHERE branch_id = veyra_private.current_branch_id()))
  );

CREATE POLICY "reservations: org staff select"
  ON public.reservations FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support','finance','admin','superadmin'));

CREATE POLICY "reservations: customer insert"
  ON public.reservations FOR INSERT TO authenticated WITH CHECK (customer_id = veyra_private.current_customer_id());

CREATE POLICY "reservations: customer cancel"
  ON public.reservations FOR UPDATE TO authenticated
  USING (customer_id = veyra_private.current_customer_id() AND status IN ('draft','quote_created','confirmed'))
  WITH CHECK (customer_id = veyra_private.current_customer_id() AND status = 'cancelled');

CREATE POLICY "reservations: branch mgr update"
  ON public.reservations FOR UPDATE TO authenticated
  USING (veyra_private.current_staff_role() = 'branch_manager' AND pickup_location_id IN (SELECT id FROM public.locations WHERE branch_id = veyra_private.current_branch_id()))
  WITH CHECK (veyra_private.current_staff_role() = 'branch_manager');

CREATE POLICY "reservations: branch staff update"
  ON public.reservations FOR UPDATE TO authenticated
  USING (veyra_private.current_staff_role() = 'branch_staff' AND pickup_location_id IN (SELECT id FROM public.locations WHERE branch_id = veyra_private.current_branch_id()))
  WITH CHECK (veyra_private.current_staff_role() = 'branch_staff');

CREATE POLICY "reservations: admin update"
  ON public.reservations FOR UPDATE TO authenticated USING (veyra_private.is_admin()) WITH CHECK (veyra_private.is_admin());

-- Reservation sub-tables
CREATE POLICY "reservation_extras: own select"       ON public.reservation_extras  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "reservation_extras: staff select"     ON public.reservation_extras  FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);
CREATE POLICY "reservation_drivers: own select"      ON public.reservation_drivers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "reservation_drivers: staff select"    ON public.reservation_drivers FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IS NOT NULL);
CREATE POLICY "reservation_drivers: customer insert" ON public.reservation_drivers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id() AND r.status IN ('draft','quote_created','held','confirmed')));

-- 15. PAYMENTS / REFUNDS / DEPOSITS (read-only for clients; write = service_role only)
CREATE POLICY "payments: own select"   ON public.payments FOR SELECT TO authenticated USING (customer_id = veyra_private.current_customer_id());
CREATE POLICY "payments: finance read" ON public.payments FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));
CREATE POLICY "refunds: own select"    ON public.refunds  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND p.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "refunds: finance read"  ON public.refunds  FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));
CREATE POLICY "deposits: own select"   ON public.deposits FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "deposits: finance read" ON public.deposits FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('finance','admin','superadmin'));

-- 16. CUSTOMER_DOCUMENTS (support/admin approve; no branch staff or fleet access)
CREATE POLICY "customer_documents: own select"   ON public.customer_documents FOR SELECT TO authenticated USING (customer_id = veyra_private.current_customer_id());
CREATE POLICY "customer_documents: support read" ON public.customer_documents FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('support','admin','superadmin'));
CREATE POLICY "customer_documents: own insert"   ON public.customer_documents FOR INSERT TO authenticated WITH CHECK (customer_id = veyra_private.current_customer_id());
CREATE POLICY "customer_documents: support update" ON public.customer_documents FOR UPDATE TO authenticated USING (veyra_private.current_staff_role() IN ('support','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('support','admin','superadmin'));

-- 17. INSPECTIONS
CREATE POLICY "inspections: own reservation select" ON public.inspections FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "inspections: staff select"           ON public.inspections FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','support','admin','superadmin'));
CREATE POLICY "inspections: branch staff write"     ON public.inspections FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','admin','superadmin'));
CREATE POLICY "check_items: staff write"            ON public.inspection_check_items FOR ALL TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','admin','superadmin'));

-- 18. DAMAGE_REPORTS
CREATE POLICY "damage_reports: own select"     ON public.damage_reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.customer_id = veyra_private.current_customer_id()));
CREATE POLICY "damage_reports: staff select"   ON public.damage_reports FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager','fleet_manager','finance','support','admin','superadmin'));
CREATE POLICY "damage_reports: br mgr write"   ON public.damage_reports FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('branch_manager','fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('branch_manager','fleet_manager','admin','superadmin'));
CREATE POLICY "damage_reports: finance update" ON public.damage_reports FOR UPDATE TO authenticated USING (veyra_private.current_staff_role() = 'finance') WITH CHECK (veyra_private.current_staff_role() = 'finance');

-- 19. MAINTENANCE_RECORDS
CREATE POLICY "maintenance: branch staff read"  ON public.maintenance_records FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('branch_staff','branch_manager') AND branch_id = veyra_private.current_branch_id());
CREATE POLICY "maintenance: fleet read"         ON public.maintenance_records FOR SELECT TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "maintenance: fleet write"        ON public.maintenance_records FOR ALL    TO authenticated USING (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin')) WITH CHECK (veyra_private.current_staff_role() IN ('fleet_manager','admin','superadmin'));
CREATE POLICY "maintenance: branch mgr write"   ON public.maintenance_records FOR ALL    TO authenticated USING (veyra_private.current_staff_role() = 'branch_manager' AND branch_id = veyra_private.current_branch_id()) WITH CHECK (veyra_private.current_staff_role() = 'branch_manager' AND branch_id = veyra_private.current_branch_id());

-- 20. WEBHOOK_EVENTS (no client policies; service_role only)

-- 21. AUDIT_EVENTS (append-only; SELECT only for authenticated)
CREATE POLICY "audit_events: own actor select" ON public.audit_events FOR SELECT TO authenticated USING (actor_id = veyra_private.current_user_id());
CREATE POLICY "audit_events: admin select all" ON public.audit_events FOR SELECT TO authenticated USING (veyra_private.is_admin());

-- 22. NOTIFICATION_QUEUE
CREATE POLICY "notification_queue: own select"  ON public.notification_queue FOR SELECT TO authenticated USING (user_id = veyra_private.current_user_id());
CREATE POLICY "notification_queue: admin select" ON public.notification_queue FOR SELECT TO authenticated USING (veyra_private.is_admin());
