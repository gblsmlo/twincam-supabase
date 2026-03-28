'use server'

import { invoiceRepository } from '@/modules/invoice/repository/invoice-drizzle-repository'
import { failure, type Result } from '@/shared/errors/result'
import { subscriptionRepository } from '../repository/subscription-drizzle-repository'
import { subscriptionCreateSchema } from '../schemas'
import { SubscriptionDomainService } from '../services/subscription-domain-service'
import type { Subscription } from '../types'

export async function createSubscription(
	organizationId: string,
	input: {
		customerId: string
		planName: string
		priceId?: string
		trialEndsAt?: Date
	},
): Promise<Result<Subscription>> {
	const validated = subscriptionCreateSchema.safeParse({
		...input,
		organizationId,
		status: 'trial',
	})

	if (!validated.success) {
		return failure({
			details: validated.error.issues,
			error: validated.error.name,
			message: 'Dados inválidos. Verifique os campos e tente novamente.',
			type: 'VALIDATION_ERROR',
		})
	}

	const service = new SubscriptionDomainService(
		subscriptionRepository(organizationId),
		invoiceRepository(organizationId),
	)

	return service.createSubscription({
		customerId: input.customerId,
		organizationId,
		planName: input.planName,
		priceId: input.priceId,
		trialEndsAt: input.trialEndsAt,
	})
}
