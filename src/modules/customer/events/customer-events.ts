import type { DomainEvent } from '@/shared/events'

export class CustomerStatusChangedEvent implements DomainEvent {
	readonly id = crypto.randomUUID()
	readonly type = 'customer.status_changed'
	readonly aggregateType = 'Customer'
	readonly occurredAt = new Date()

	constructor(
		readonly aggregateId: string,
		readonly data: {
			newStatus: 'active' | 'inactive'
			organizationId: string
		},
	) {}
}
