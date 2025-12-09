ALTER TABLE "orgs" RENAME TO "spaces";--> statement-breakpoint
ALTER TABLE "members" RENAME COLUMN "organizationId" TO "spaceId";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "organizationId" TO "spaceId";--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "members_organizationId_orgs_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_organizationId_orgs_id_fk";
--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "ownerId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_spaceId_spaces_id_fk" FOREIGN KEY ("spaceId") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_spaceId_spaces_id_fk" FOREIGN KEY ("spaceId") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;