CREATE TABLE "members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"ownerId" uuid NOT NULL,
	"organizationId" uuid NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organizationId_orgs_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_orgs_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;