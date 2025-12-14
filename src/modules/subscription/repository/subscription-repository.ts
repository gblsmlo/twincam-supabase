import type { Subscription, SubscriptionInsert, SubscriptionUpdate } from '../types'

export interface SubscriptionRepository {
	create(input: SubscriptionInsert): Promise<Subscription>
	update(id: string, input: SubscriptionUpdate): Promise<Subscription>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Subscription | null>
	findByCustomerId(customerId: string): Promise<Subscription[]>
	findActiveByCustomerId(customerId: string): Promise<Subscription | null>
	findByStatus(status: 'active' | 'canceled' | 'past_due'): Promise<Subscription[]>
}
