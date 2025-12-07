'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, handleAuthError, type Result, success } from '@/shared/errors'
import { type SignInFormData, signInSchema } from '../schemas'

type Output = {
	redirectTo: string
}

export const signInAction = async (formData: SignInFormData): Promise<Result<Output>> => {
	const validated = signInSchema.safeParse(formData)

	if (!validated.success) {
		return failure({
			details: validated.error.cause,
			error: validated.error.name,
			message: validated.error.message,
			type: 'VALIDATION_ERROR',
		})
	}

	try {
		const supabase = await createClient()

		const { error: authError } = await supabase.auth.signInWithPassword({
			email: validated.data.email,
			password: validated.data.password,
		})

		if (authError) {
			return failure({
				error: authError.name,
				message: authError.message || 'Não foi authenticar o usuário.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		return success({
			redirectTo: '/dashboard',
		})
	} catch (error) {
		return handleAuthError(error)
	}
}
