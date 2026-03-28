'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { subscriptionRepository } from '../repository/subscription-drizzle-repository'
import type { Subscription } from '../types'

export async function findActiveSubscriptions(
	organizationId: string,
): Promise<Result<Subscription[]>> {
	try {
		const repo = subscriptionRepository(organizationId)
		const subscriptions = await repo.findByStatus('active')
		return success(subscriptions)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Erro desconhecido',
			message: 'Não foi possível buscar as assinaturas ativas.',
			type: 'DATABASE_ERROR',
		})
	}
}
