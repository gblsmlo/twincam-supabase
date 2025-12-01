'use server'

import { authServer } from '@infra/auth/server'
import { handleAuthError } from '@shared/errors/error-handler'
import { failure, type Result, success } from '@shared/errors/result'
import { type SignInFormData, signInSchema } from '../schemas'

type SignInOutput = {
	redirectTo: string
}

export const signInAction = async (formData: SignInFormData): Promise<Result<SignInOutput>> => {
	const validatedFields = signInSchema.safeParse(formData)

	if (!validatedFields.success) {
		return failure({
			details: validatedFields.error.flatten().fieldErrors,
			error: 'Dados Inválidos',
			message: 'Por favor, corrija os campos destacados.',
			type: 'VALIDATION_ERROR',
		})
	}

	const input: typeof validatedFields.data = {
		email: validatedFields.data.email,
		password: validatedFields.data.password,
	}

	const response = await authServer.api.signInEmail({
		asResponse: true,
		body: input,
	})

	const data = await response.json()

	if (!response.ok) {
		return failure({
			error: data.code || 'Erro na autenticação',
			message: data.message || 'Não foi authenticar o usuário.',
			type: 'AUTHORIZATION_ERROR',
		})
	}

	try {
		return success({
			redirectTo: '/dashboard',
		})
	} catch (error) {
		return handleAuthError(error)
	}
}
