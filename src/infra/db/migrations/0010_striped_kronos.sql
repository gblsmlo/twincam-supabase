DO $$ BEGIN
  CREATE TYPE "public"."member_role" AS ENUM('admin', 'member', 'owner');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."member_role";--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "role" SET DATA TYPE "public"."member_role" USING "role"::"public"."member_role";--> statement-breakpoint
ALTER TABLE "member_invitations" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."member_role";--> statement-breakpoint
ALTER TABLE "member_invitations" ALTER COLUMN "role" SET DATA TYPE "public"."member_role" USING "role"::"public"."member_role";