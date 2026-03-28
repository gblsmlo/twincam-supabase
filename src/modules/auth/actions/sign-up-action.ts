'use server'

import { createClient } from '@/lib/supabase/server'
import { customerRepository } from '@/modules/customer/repository/customer-drizzle-repository'
import { memberRepository } from '@/modules/member'
import { organizationRepository } from '@/modules/organization/repository/organization-drizzle-repository'
import { OnboardingService } from '@/modules/organization/services/onboarding-service'
import { subscriptionRepository } from '@/modules/subscription'
import { failure, isFailure, type Result, success } from '@/shared/errors/result'
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

		const { data, error: authError } = await supabase.auth.signUp({
			email: validated.data.email,
			options: {
				data: {
					username: validated.data.name,
				},
				emailRedirectTo: REDIRECT_TO,
			},
			password: validated.data.password,
		})

		if (authError || !data.user) {
			return failure({
				error: authError?.name || 'Erro no cadastro',
				message: authError?.message || 'Não foi possível criar a conta.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		// Onboarding: cria Organization + Membership + Billing
		const onboardingService = new OnboardingService({
			customerRepository: customerRepository(data.user.id),
			memberRepository: memberRepository(data.user.id),
			organizationRepository: organizationRepository(),
			subscriptionRepository: subscriptionRepository(data.user.id),
		})

		const onboardResult = await onboardingService.onboardNewUser(
			data.user.id,
			validated.data.organizationName,
			validated.data.organizationSlug,
			validated.data.email,
			validated.data.name,
		)

		if (isFailure(onboardResult)) {
			return onboardResult
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
			message: 'Ocorreu um erro desconhecido.',
			type: 'UNKNOWN_ERROR',
		})
	}
}
