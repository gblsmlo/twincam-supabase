import type { CustomerStatusChangedEvent } from '@/modules/customer/events/customer-events'
import { invoiceRepository } from '@/modules/invoice/repository/invoice-drizzle-repository'
import { subscriptionRepository } from '@/modules/subscription/repository/subscription-drizzle-repository'
import { SubscriptionDomainService } from '../services/subscription-domain-service'

export async function onCustomerDeactivated(event: CustomerStatusChangedEvent): Promise<void> {
	if (event.data.newStatus !== 'inactive') return

	const { organizationId } = event.data
	const subRepo = subscriptionRepository(organizationId)

	const activeSubscriptions = await subRepo.findByStatus('active')
	const customerSubscriptions = activeSubscriptions.filter(
		(sub) => sub.customerId === event.aggregateId,
	)

	if (customerSubscriptions.length === 0) return

	const service = new SubscriptionDomainService(subRepo, invoiceRepository(organizationId))

	for (const sub of customerSubscriptions) {
		const result = await service.suspendSubscription(sub._id)
		if (!result.success) {
			console.error(
				`Falha ao suspender assinatura ${sub._id} após desativação do cliente:`,
				result.message,
			)
		}
	}
}
