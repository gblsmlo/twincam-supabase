'use server'

import { invoiceRepository } from '@/modules/invoice/repository/invoice-drizzle-repository'
import type { Result } from '@/shared/errors/result'
import { subscriptionRepository } from '../repository/subscription-drizzle-repository'
import { SubscriptionDomainService } from '../services/subscription-domain-service'
import type { Subscription } from '../types'

export async function cancelSubscription(
	organizationId: string,
	subscriptionId: string,
	reason: string,
): Promise<Result<Subscription>> {
	const service = new SubscriptionDomainService(
		subscriptionRepository(organizationId),
		invoiceRepository(organizationId),
	)

	return service.cancelSubscription(subscriptionId, reason)
}
