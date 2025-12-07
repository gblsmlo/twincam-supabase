''

import { createClient } from '@/lib/supabase/server'

export const getClaimsAction = async () => {
	const supabase = await createClient()
	const { data, error } = await supabase.auth.getClaims()

	const isAuthenticated = !data?.claims?.claims

	return {
		data,
		error,
		isAuthenticated,
	}
}
