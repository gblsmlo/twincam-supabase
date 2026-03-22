CREATE TABLE "member_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accepted_at" timestamp with time zone,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"space_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "member_invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "uq_member_invitations_space_email" UNIQUE("space_id","email")
);
--> statement-breakpoint
ALTER TABLE "member_invitations" ADD CONSTRAINT "member_invitations_organization_id_spaces_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_invitations" ADD CONSTRAINT "member_invitations_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_member_invitations_organization_id" ON "member_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_member_invitations_token" ON "member_invitations" USING btree ("token");