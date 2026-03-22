import { type Database, db, subscriptionsTable } from '@/infra/db'
import { and, eq } from 'drizzle-orm'
import type { Subscription, SubscriptionInsert, SubscriptionUpdate } from '../types'
import type { SubscriptionRepository } from './subscription-repository'

export class SubscriptionDrizzleRepository implements SubscriptionRepository {
	constructor(
		private db: Database,
		private organizationId: string,
	) {}

	async create(input: SubscriptionInsert): Promise<Subscription> {
		const [result] = await this.db
			.insert(subscriptionsTable)
			.values({ ...input, organizationId: this.organizationId })
			.returning()

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
			.where(
				and(
					eq(subscriptionsTable._id, id),
					eq(subscriptionsTable.organizationId, this.organizationId),
				),
			)

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(subscriptionsTable)
			.where(
				and(
					eq(subscriptionsTable._id, id),
					eq(subscriptionsTable.organizationId, this.organizationId),
				),
			)
			.returning({ deletedId: subscriptionsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Subscription | null> {
		const [result] = await this.db
			.select()
			.from(subscriptionsTable)
			.where(
				and(
					eq(subscriptionsTable._id, id),
					eq(subscriptionsTable.organizationId, this.organizationId),
				),
			)
			.limit(1)

		return result ?? null
	}

	async findByCustomerId(customerId: string): Promise<Subscription[]> {
		return this.db
			.select()
			.from(subscriptionsTable)
			.where(
				and(
					eq(subscriptionsTable.customerId, customerId),
					eq(subscriptionsTable.organizationId, this.organizationId),
				),
			)
	}

	async findActiveByCustomerId(customerId: string): Promise<Subscription | null> {
		const [result] = await this.db
			.select()
			.from(subscriptionsTable)
			.where(
				and(
					eq(subscriptionsTable.customerId, customerId),
					eq(subscriptionsTable.status, 'active'),
					eq(subscriptionsTable.organizationId, this.organizationId),
				),
			)
			.limit(1)

		return result ?? null
	}

	async findByStatus(status: 'active' | 'canceled' | 'past_due'): Promise<Subscription[]> {
		return this.db
			.select()
			.from(subscriptionsTable)
			.where(
				and(
					eq(subscriptionsTable.status, status),
					eq(subscriptionsTable.organizationId, this.organizationId),
				),
			)
	}

	async findByOrganizationId(organizationId: string): Promise<Subscription[]> {
		return this.db
			.select()
			.from(subscriptionsTable)
			.where(eq(subscriptionsTable.organizationId, organizationId))
	}
}

export const subscriptionRepository = (organizationId: string) =>
	new SubscriptionDrizzleRepository(db, organizationId)
