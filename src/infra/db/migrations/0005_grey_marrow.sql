ALTER TABLE "customers" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_spaces_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_spaces_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_spaces_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_spaces_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_spaces_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_spaces_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customers_organization_id" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_organization_id" ON "invoices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_members_organization_id" ON "members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_products_organization_id" ON "products" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_projects_organization_id" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_organization_id" ON "subscriptions" USING btree ("organization_id");

-- ============================================================
-- ROW LEVEL SECURITY — Organization Isolation
-- NOTE: For existing rows without organization_id, backfill
-- before enabling RLS:
--   UPDATE <table> SET organization_id = (SELECT id FROM spaces LIMIT 1)
--   WHERE organization_id IS NULL;
-- ============================================================

-- Enable RLS on all business tables
ALTER TABLE "members"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices"      ENABLE ROW LEVEL SECURITY;

-- ── members ──────────────────────────────────────────────────
CREATE POLICY "members_org_isolation_select" ON "members"
  FOR SELECT USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "members_org_isolation_insert" ON "members"
  FOR INSERT WITH CHECK (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "members_org_isolation_update" ON "members"
  FOR UPDATE USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "members_org_isolation_delete" ON "members"
  FOR DELETE USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ── customers ────────────────────────────────────────────────
CREATE POLICY "customers_org_isolation_select" ON "customers"
  FOR SELECT USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "customers_org_isolation_insert" ON "customers"
  FOR INSERT WITH CHECK (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "customers_org_isolation_update" ON "customers"
  FOR UPDATE USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "customers_org_isolation_delete" ON "customers"
  FOR DELETE USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ── projects ─────────────────────────────────────────────────
CREATE POLICY "projects_org_isolation_select" ON "projects"
  FOR SELECT USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "projects_org_isolation_insert" ON "projects"
  FOR INSERT WITH CHECK (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "projects_org_isolation_update" ON "projects"
  FOR UPDATE USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "projects_org_isolation_delete" ON "projects"
  FOR DELETE USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ── products (nullable org_id — global OR tenant-scoped) ─────
-- Global products (organization_id IS NULL) are visible to all.
-- Tenant products are only visible to their organization.
CREATE POLICY "products_org_isolation_select" ON "products"
  FOR SELECT USING (
    organization_id IS NULL
    OR organization_id = current_setting('app.current_organization_id')::uuid
  );

CREATE POLICY "products_org_isolation_insert" ON "products"
  FOR INSERT WITH CHECK (
    organization_id IS NULL
    OR organization_id = current_setting('app.current_organization_id')::uuid
  );

CREATE POLICY "products_org_isolation_update" ON "products"
  FOR UPDATE USING (
    organization_id IS NULL
    OR organization_id = current_setting('app.current_organization_id')::uuid
  );

CREATE POLICY "products_org_isolation_delete" ON "products"
  FOR DELETE USING (
    organization_id IS NULL
    OR organization_id = current_setting('app.current_organization_id')::uuid
  );

-- ── subscriptions ────────────────────────────────────────────
CREATE POLICY "subscriptions_org_isolation_select" ON "subscriptions"
  FOR SELECT USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "subscriptions_org_isolation_insert" ON "subscriptions"
  FOR INSERT WITH CHECK (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "subscriptions_org_isolation_update" ON "subscriptions"
  FOR UPDATE USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "subscriptions_org_isolation_delete" ON "subscriptions"
  FOR DELETE USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ── invoices ─────────────────────────────────────────────────
CREATE POLICY "invoices_org_isolation_select" ON "invoices"
  FOR SELECT USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "invoices_org_isolation_insert" ON "invoices"
  FOR INSERT WITH CHECK (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "invoices_org_isolation_update" ON "invoices"
  FOR UPDATE USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "invoices_org_isolation_delete" ON "invoices"
  FOR DELETE USING (organization_id = current_setting('app.current_organization_id')::uuid);
