export interface DomainEvent {
	id: string
	type: string
	aggregateId: string
	aggregateType: string
	occurredAt: Date
	data: unknown
}
