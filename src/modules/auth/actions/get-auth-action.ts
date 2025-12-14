'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors'

type Output = {
	isAuthenticated: boolean
	userId?: string
}

export const getAuthGuardAction = async (): Promise<Result<Output>> => {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.getClaims()

	if (!data || !data.claims) {
		return failure({
			message: error?.message || 'Failed to get auth claims.',
			type: 'AUTHORIZATION_ERROR',
		})
	}

	if (error) {
		return failure({
			error,
			message: 'An authorization error occurred.',
			type: 'AUTHORIZATION_ERROR',
		})
	}

	return success({
		isAuthenticated: true,
	})
}
