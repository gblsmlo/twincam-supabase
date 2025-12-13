'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { type SignUpFormData, signUpSchema } from '../schemas'

type SignUpOutput = {
	redirectTo: string
}

const REDIRECT_TO = '/auth/login'

export const signUpAction = async (formData: SignUpFormData): Promise<Result<SignUpOutput>> => {
	const validated = signUpSchema.safeParse(formData)

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

		const { error: authError } = await supabase.auth.signUp({
			email: validated.data.email,
			options: {
				data: {
					display_name: validated.data.name,
					full_name: validated.data.name,
				},
				emailRedirectTo: REDIRECT_TO,
			},
			password: validated.data.password,
		})

		if (authError) {
			return failure({
				error: authError.name || 'Erro no cadastro',
				message: authError.message || 'Não foi possível criar a conta.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		return success({
			redirectTo: REDIRECT_TO,
		})
	} catch (error) {
		if (error instanceof Error) {
			return failure({
				error: error.name,
				message: error.message,
				type: 'UNKNOWN_ERROR',
			})
		}

		return failure({
			error: 'UnknownError',
			message: 'An unknown error occurred.',
			type: 'UNKNOWN_ERROR',
		})
	}
}
