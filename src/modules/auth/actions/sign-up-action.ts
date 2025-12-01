'use server'

import { authServer } from '@infra/auth/server'
import { handleAuthError } from '@shared/errors/error-handler'
import { failure, type Result, success } from '@shared/errors/result'
import { type SignUpFormData, signUpSchema } from '../schemas'

type SignUpOutput = {
	redirectTo: string
}

export const signUpAction = async (formData: SignUpFormData): Promise<Result<SignUpOutput>> => {
	const validatedFields = signUpSchema.safeParse(formData)

	if (!validatedFields.success) {
		return failure({
			details: validatedFields.error.flatten().fieldErrors,
			error: 'Dados Inválidos',
			message: 'Por favor, corrija os campos destacados.',
			type: 'VALIDATION_ERROR',
		})
	}

	const input = {
		email: validatedFields.data.email,
		name: validatedFields.data.name,
		password: validatedFields.data.password,
	}

	try {
		const response = await authServer.api.signUpEmail({
			asResponse: true,
			body: input,
		})

		const data = await response.json()

		const { code, message } = data

		if (!response.ok) {
			return failure({
				error: code || 'Erro no cadastro',
				message: message || 'Não foi possível criar a conta.',
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
