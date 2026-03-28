import type { DomainEvent } from '@/shared/events'

export class SubscriptionCreatedEvent implements DomainEvent {
	readonly id = crypto.randomUUID()
	readonly type = 'subscription.created'
	readonly aggregateType = 'Subscription'
	readonly occurredAt = new Date()

	constructor(
		readonly aggregateId: string,
		readonly data: {
			customerId: string
			organizationId: string
			planName: string
			startedAt: Date
		},
	) {}
}

export class SubscriptionCancelledEvent implements DomainEvent {
	readonly id = crypto.randomUUID()
	readonly type = 'subscription.cancelled'
	readonly aggregateType = 'Subscription'
	readonly occurredAt = new Date()

	constructor(
		readonly aggregateId: string,
		readonly data: {
			customerId: string
			organizationId: string
			reason: string
		},
	) {}
}

export class SubscriptionRenewedEvent implements DomainEvent {
	readonly id = crypto.randomUUID()
	readonly type = 'subscription.renewed'
	readonly aggregateType = 'Subscription'
	readonly occurredAt = new Date()

	constructor(
		readonly aggregateId: string,
		readonly data: {
			customerId: string
			newFinishedAt: Date
			organizationId: string
		},
	) {}
}
