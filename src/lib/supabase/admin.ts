import { env } from '@/infra/env'
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client com service_role key.
 * Uso EXCLUSIVO para operacoes admin (set app_metadata, manage users).
 * NUNCA expor ao client-side.
 */
export const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
	auth: { autoRefreshToken: false, persistSession: false },
})
