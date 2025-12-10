ALTER TABLE "invoices" RENAME COLUMN "subscriptionId" TO "subscription_id";--> statement-breakpoint
ALTER TABLE "members" RENAME COLUMN "spaceId" TO "space_id";--> statement-breakpoint
ALTER TABLE "members" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "ownerId" TO "owner_id";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "spaceId" TO "space_id";--> statement-breakpoint
ALTER TABLE "spaces" RENAME COLUMN "ownerId" TO "owner_id";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "ended_at" TO "finished_at";--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_subscriptionId_subscriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "members_spaceId_spaces_id_fk";
--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "members_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_ownerId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_spaceId_spaces_id_fk";
--> statement-breakpoint
ALTER TABLE "spaces" DROP CONSTRAINT "spaces_ownerId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "prices" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;