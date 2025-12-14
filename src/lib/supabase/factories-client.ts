'use client'

import { failure, type Result, success } from '@/shared/errors'
import type { Session } from '@supabase/supabase-js'
import { createClient } from './client'

export function makeSupabaseClient() {
	const supabase = createClient()

	return supabase
}

type MakeSupabaseSessionOutput = {
	session: Session | null
}

export async function makeSupabaseSession(): Promise<Result<MakeSupabaseSessionOutput>> {
	const supabase = createClient()
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession()

	if (error) {
		return failure({
			error: error,
			message: 'Error fetching session',
			type: 'AUTHORIZATION_ERROR',
		})
	}

	if (!session) {
		return failure({
			message: 'No active session found',
			type: 'AUTHORIZATION_ERROR',
		})
	}

	return success({
		session,
	})
}
