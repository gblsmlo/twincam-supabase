import { type Database, db, subscriptionsTable } from '@/infra/db'
import { and, eq } from 'drizzle-orm'
import type { Subscription, SubscriptionInsert, SubscriptionUpdate } from '../types'
import type { SubscriptionRepository } from './subscription-repository'

export class SubscriptionDrizzleRepository implements SubscriptionRepository {
	constructor(private db: Database) {}

	async create(input: SubscriptionInsert): Promise<Subscription> {
		const [result] = await this.db.insert(subscriptionsTable).values(input)

		return result
	}

	async update(id: string, input: SubscriptionUpdate): Promise<Subscription> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db
			.update(subscriptionsTable)
			.set(update)
			.where(eq(subscriptionsTable._id, id))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(subscriptionsTable)
			.where(eq(subscriptionsTable._id, id))
			.returning({ deletedId: subscriptionsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Subscription | null> {
		const [result] = await this.db
			.select()
			.from(subscriptionsTable)
			.where(eq(subscriptionsTable._id, id))
			.limit(1)

		return result
	}

	async findByCustomerId(customerId: string): Promise<Subscription[]> {
		const results = await this.db
			.select()
			.from(subscriptionsTable)
			.where(eq(subscriptionsTable.customerId, customerId))

		return results
	}

	async findActiveByCustomerId(customerId: string): Promise<Subscription | null> {
		const [result] = await this.db
			.select()
			.from(subscriptionsTable)
			.where(
				and(eq(subscriptionsTable.customerId, customerId), eq(subscriptionsTable.status, 'active')),
			)
			.limit(1)

		return result
	}

	async findByStatus(status: 'active' | 'canceled' | 'past_due'): Promise<Subscription[]> {
		const results = await this.db
			.select()
			.from(subscriptionsTable)
			.where(eq(subscriptionsTable.status, status))

		return results
	}
}

export const subscriptionRepository = () => new SubscriptionDrizzleRepository(db)
