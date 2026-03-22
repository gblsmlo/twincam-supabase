-- Migration: Drop standalone users table in favor of auth.users + app_metadata
-- The is_platform_admin flag now lives in auth.users.raw_app_meta_data

-- Drop the standalone users table (reverses 0007)
DROP INDEX IF EXISTS "idx_users_is_platform_admin";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_users_email";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_id_users_id_fk";
--> statement-breakpoint
DROP TABLE IF EXISTS "users";
--> statement-breakpoint

-- Helper function: check if a user is platform admin via app_metadata
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'is_platform_admin')::boolean,
    false
  )
$$;
--> statement-breakpoint

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
