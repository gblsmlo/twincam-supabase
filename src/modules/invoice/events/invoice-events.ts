import type { DomainEvent } from '@/shared/events'

export class InvoiceOverdueEvent implements DomainEvent {
	readonly id = crypto.randomUUID()
	readonly type = 'invoice.overdue'
	readonly aggregateType = 'Invoice'
	readonly occurredAt = new Date()

	constructor(
		readonly aggregateId: string,
		readonly data: {
			amount: string
			dueDate: Date
			organizationId: string
			subscriptionId: string
		},
	) {}
}

export class InvoicePaidEvent implements DomainEvent {
	readonly id = crypto.randomUUID()
	readonly type = 'invoice.paid'
	readonly aggregateType = 'Invoice'
	readonly occurredAt = new Date()

	constructor(
		readonly aggregateId: string,
		readonly data: {
			amount: string
			organizationId: string
			paidAt: Date
			subscriptionId: string
		},
	) {}
}
