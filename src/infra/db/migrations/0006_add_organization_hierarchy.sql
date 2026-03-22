ALTER TABLE "spaces" ADD COLUMN "hierarchy_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "hierarchy_path" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "parent_organization_id" uuid;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_parent_organization_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."spaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_spaces_hierarchy_path" ON "spaces" USING btree ("hierarchy_path");--> statement-breakpoint
CREATE INDEX "idx_spaces_parent_org_id" ON "spaces" USING btree ("parent_organization_id");

-- ============================================================
-- HIERARCHY CONSTRAINTS & BACKFILL
-- ============================================================

-- Prevent an organization from being its own parent
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_no_self_parent"
  CHECK (parent_organization_id IS NULL OR parent_organization_id != id);

-- Backfill: set hierarchy_path = id for all existing root organizations
UPDATE "spaces" SET hierarchy_path = id::text WHERE hierarchy_path = '';