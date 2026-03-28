import type { SubscriptionRepository } from '@/modules/subscription/repository/subscription-repository'
import { failure, type Result, success } from '@/shared/errors/result'
import { eventBus } from '@/shared/events'
import { InvoiceOverdueEvent, InvoicePaidEvent } from '../events/invoice-events'
import type { InvoiceRepository } from '../repository/invoice-repository'
import type { Invoice } from '../types'

export class InvoiceGenerationService {
	constructor(
		private readonly invoiceRepo: InvoiceRepository,
		private readonly subscriptionRepo: SubscriptionRepository,
	) {}

	async generateInvoiceForSubscription(
		subscriptionId: string,
		amount: string,
	): Promise<Result<Invoice>> {
		const subscription = await this.subscriptionRepo.findById(subscriptionId)

		if (!subscription) {
			return failure({
				message: 'Assinatura não encontrada.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() + 30)

		try {
			const invoice = await this.invoiceRepo.create({
				amount,
				currency: 'BRL',
				dueDate,
				organizationId: subscription.organizationId,
				status: 'open',
				subscriptionId: subscription._id,
			})

			return success(invoice)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível gerar a fatura.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async markAsPaid(invoiceId: string): Promise<Result<Invoice>> {
		const invoice = await this.invoiceRepo.findById(invoiceId)

		if (!invoice) {
			return failure({
				message: 'Fatura não encontrada.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		if (invoice.status === 'paid') {
			return failure({
				message: 'A fatura já está paga.',
				type: 'VALIDATION_ERROR',
			})
		}

		if (invoice.status === 'void') {
			return failure({
				message: 'Não é possível pagar uma fatura cancelada.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const paidAt = new Date()
			const updated = await this.invoiceRepo.update(invoiceId, {
				paidAt,
				status: 'paid',
			})

			await eventBus.publish(
				new InvoicePaidEvent(invoice._id, {
					amount: invoice.amount,
					organizationId: invoice.organizationId,
					paidAt,
					subscriptionId: invoice.subscriptionId,
				}),
			)

			return success(updated)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível registrar o pagamento da fatura.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async processOverdueInvoices(): Promise<Result<Invoice[]>> {
		try {
			const overdueInvoices = await this.invoiceRepo.findOverdue()

			for (const invoice of overdueInvoices) {
				await eventBus.publish(
					new InvoiceOverdueEvent(invoice._id, {
						amount: invoice.amount,
						dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
						organizationId: invoice.organizationId,
						subscriptionId: invoice.subscriptionId,
					}),
				)
			}

			return success(overdueInvoices)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível processar as faturas em atraso.',
				type: 'DATABASE_ERROR',
			})
		}
	}
}
