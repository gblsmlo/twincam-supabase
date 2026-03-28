import type { SubscriptionSpecification } from '../specifications/subscription-specification'
import type { Subscription, SubscriptionInsert, SubscriptionUpdate } from '../types'

/**
 * Repository scoped to a specific organization.
 * All queries are automatically filtered by the organizationId provided
 * at construction time via the factory function.
 */
export interface SubscriptionRepository {
	create(input: SubscriptionInsert): Promise<Subscription>
	update(id: string, input: SubscriptionUpdate): Promise<Subscription>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Subscription | null>
	findByCustomerId(customerId: string): Promise<Subscription[]>
	findActiveByCustomerId(customerId: string): Promise<Subscription | null>
	findByStatus(status: 'active' | 'canceled' | 'past_due'): Promise<Subscription[]>
	findByOrganizationId(organizationId: string): Promise<Subscription[]>
	findBySpecification(spec: SubscriptionSpecification): Promise<Subscription[]>
}
