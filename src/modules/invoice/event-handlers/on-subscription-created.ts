import { invoiceRepository } from '@/modules/invoice/repository/invoice-drizzle-repository'
import type { SubscriptionCreatedEvent } from '@/modules/subscription/events/subscription-events'
import { subscriptionRepository } from '@/modules/subscription/repository/subscription-drizzle-repository'
import { InvoiceGenerationService } from '../services/invoice-generation-service'

export async function onSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<void> {
	const { organizationId, planName } = event.data

	const service = new InvoiceGenerationService(
		invoiceRepository(organizationId),
		subscriptionRepository(organizationId),
	)

	const result = await service.generateInvoiceForSubscription(
		event.aggregateId,
		'0.00', // amount to be updated when price lookup is implemented
	)

	if (!result.success) {
		console.error(
			`Falha ao gerar fatura para assinatura ${event.aggregateId} (${planName}):`,
			result.message,
		)
	}
}
