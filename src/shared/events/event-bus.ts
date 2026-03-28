import type { DomainEvent } from './domain-event'

type DomainEventHandler<T extends DomainEvent> = (event: T) => Promise<void>

export class EventBus {
	private handlers: Map<string, DomainEventHandler<DomainEvent>[]> = new Map()

	subscribe<T extends DomainEvent>(eventType: string, handler: DomainEventHandler<T>): void {
		const existing = this.handlers.get(eventType) ?? []
		this.handlers.set(eventType, [...existing, handler as DomainEventHandler<DomainEvent>])
	}

	async publish<T extends DomainEvent>(event: T): Promise<void> {
		const handlers = this.handlers.get(event.type) ?? []
		for (const handler of handlers) {
			try {
				await handler(event)
			} catch (error) {
				console.error(`Handler failed for ${event.type}:`, error)
			}
		}
	}
}

export const eventBus = new EventBus()
