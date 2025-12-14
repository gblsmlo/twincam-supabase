'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors'
import { revalidatePath } from 'next/cache'

type Output = {
	redirectTo: string
}

export async function signOutAction(): Promise<Result<Output>> {
	const supabase = await createClient()
	const { error } = await supabase.auth.signOut()

	if (error) {
		return failure({
			error: error.name,
			message: error.message || 'Não foi possível deslogar o usuário.',
			type: 'AUTHORIZATION_ERROR',
		})
	}

	revalidatePath('/dashboard')

	return success({
		redirectTo: '/auth/login',
	})
}
