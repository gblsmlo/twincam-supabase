import type { InvoiceRepository } from '@/modules/invoice/repository/invoice-repository'
import { failure, type Result, success } from '@/shared/errors/result'
import { eventBus } from '@/shared/events'
import {
	SubscriptionCancelledEvent,
	SubscriptionCreatedEvent,
	SubscriptionRenewedEvent,
} from '../events/subscription-events'
import type { SubscriptionRepository } from '../repository/subscription-repository'
import type { Subscription } from '../types'

export class SubscriptionDomainService {
	constructor(
		private readonly subscriptionRepo: SubscriptionRepository,
		private readonly invoiceRepo: InvoiceRepository,
	) {}

	async createSubscription(params: {
		customerId: string
		organizationId: string
		planName: string
		priceId?: string
		trialEndsAt?: Date
	}): Promise<Result<Subscription>> {
		try {
			const subscription = await this.subscriptionRepo.create({
				customerId: params.customerId,
				organizationId: params.organizationId,
				planName: params.planName,
				priceId: params.priceId,
				status: 'trial',
				trialEndsAt: params.trialEndsAt,
			})

			await eventBus.publish(
				new SubscriptionCreatedEvent(subscription._id, {
					customerId: subscription.customerId,
					organizationId: subscription.organizationId,
					planName: subscription.planName,
					startedAt: subscription.startedAt ?? new Date(),
				}),
			)

			return success(subscription)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível criar a assinatura.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async activateSubscription(subscriptionId: string): Promise<Result<Subscription>> {
		const subscription = await this.subscriptionRepo.findById(subscriptionId)

		if (!subscription) {
			return failure({
				message: 'Assinatura não encontrada.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		const isTrial = subscription.status === 'trial'
		const trialStillRunning =
			isTrial && subscription.trialEndsAt && new Date(subscription.trialEndsAt) > new Date()

		if (!trialStillRunning) {
			return failure({
				message:
					'Não é possível ativar a assinatura: período de trial encerrado ou pagamento não recebido.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const updated = await this.subscriptionRepo.update(subscriptionId, { status: 'active' })
			return success(updated)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível ativar a assinatura.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async suspendSubscription(subscriptionId: string): Promise<Result<Subscription>> {
		const subscription = await this.subscriptionRepo.findById(subscriptionId)

		if (!subscription) {
			return failure({
				message: 'Assinatura não encontrada.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		if (subscription.status !== 'active') {
			return failure({
				message: 'Apenas assinaturas ativas podem ser suspensas.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const updated = await this.subscriptionRepo.update(subscriptionId, { status: 'suspended' })
			return success(updated)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível suspender a assinatura.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async cancelSubscription(subscriptionId: string, reason: string): Promise<Result<Subscription>> {
		const subscription = await this.subscriptionRepo.findById(subscriptionId)

		if (!subscription) {
			return failure({
				message: 'Assinatura não encontrada.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		if (subscription.status === 'canceled') {
			return failure({
				message: 'A assinatura já foi cancelada.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const updated = await this.subscriptionRepo.update(subscriptionId, {
				finishedAt: new Date(),
				status: 'canceled',
			})

			await eventBus.publish(
				new SubscriptionCancelledEvent(subscription._id, {
					customerId: subscription.customerId,
					organizationId: subscription.organizationId,
					reason,
				}),
			)

			return success(updated)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível cancelar a assinatura.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async renewSubscription(subscriptionId: string, amount: string): Promise<Result<Subscription>> {
		const subscription = await this.subscriptionRepo.findById(subscriptionId)

		if (!subscription) {
			return failure({
				message: 'Assinatura não encontrada.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		if (subscription.status !== 'active') {
			return failure({
				message: 'Apenas assinaturas ativas podem ser renovadas.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const currentFinishedAt = subscription.finishedAt
				? new Date(subscription.finishedAt)
				: new Date()
			const newFinishedAt = new Date(currentFinishedAt)
			newFinishedAt.setMonth(newFinishedAt.getMonth() + 1)

			const updated = await this.subscriptionRepo.update(subscriptionId, {
				finishedAt: newFinishedAt,
			})

			const dueDate = new Date()
			dueDate.setDate(dueDate.getDate() + 30)

			await this.invoiceRepo.create({
				amount,
				currency: 'BRL',
				dueDate,
				organizationId: subscription.organizationId,
				status: 'open',
				subscriptionId: subscription._id,
			})

			await eventBus.publish(
				new SubscriptionRenewedEvent(subscription._id, {
					customerId: subscription.customerId,
					newFinishedAt,
					organizationId: subscription.organizationId,
				}),
			)

			return success(updated)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível renovar a assinatura.',
				type: 'DATABASE_ERROR',
			})
		}
	}
}
