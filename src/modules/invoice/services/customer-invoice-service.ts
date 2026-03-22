import type { SubscriptionRepository } from '@/modules/subscription/repository/subscription-repository'
import type { InvoiceRepository } from '../repository/invoice-repository'
import type { Invoice } from '../types'

export class CustomerInvoiceService {
	constructor(
		private readonly subscriptionRepo: SubscriptionRepository,
		private readonly invoiceRepo: InvoiceRepository,
	) {}

	async getLatestInvoiceForCustomer(customerId: string): Promise<Invoice | null> {
		const subscriptions = await this.subscriptionRepo.findByCustomerId(customerId)

		if (subscriptions.length === 0) {
			return null
		}

		const invoicesPerSubscription = await Promise.all(
			subscriptions.map((sub) => this.invoiceRepo.findBySubscriptionId(sub._id)),
		)

		const allInvoices = invoicesPerSubscription.flat()

		if (allInvoices.length === 0) {
			return null
		}

		allInvoices.sort((a, b) => {
			const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
			const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
			return dateB - dateA
		})

		return allInvoices[0]
	}
}
