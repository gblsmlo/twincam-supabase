import { db, subscriptionsTable } from '@/infra/db'
import { BaseRepository } from '@/infra/repositories'
import { and, eq } from 'drizzle-orm'
import type { Subscription, SubscriptionInsert, SubscriptionUpdate } from '../types'
import type { SubscriptionRepository } from './subscription-repository'

export class SubscriptionDrizzleRepository
	extends BaseRepository
	implements SubscriptionRepository
{
	async create(input: SubscriptionInsert): Promise<Subscription> {
		const [result] = await this.db
			.insert(subscriptionsTable)
			.values(this.injectOrgId(input))
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
			.where(this.withOrgFilter(subscriptionsTable.organizationId, eq(subscriptionsTable._id, id)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(subscriptionsTable)
			.where(this.withOrgFilter(subscriptionsTable.organizationId, eq(subscriptionsTable._id, id)))
			.returning({ deletedId: subscriptionsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Subscription | null> {
		const [result] = await this.db
			.select()
			.from(subscriptionsTable)
			.where(this.withOrgFilter(subscriptionsTable.organizationId, eq(subscriptionsTable._id, id)))
			.limit(1)

		return result ?? null
	}

	async findByCustomerId(customerId: string): Promise<Subscription[]> {
		return this.db
			.select()
			.from(subscriptionsTable)
			.where(
				this.withOrgFilter(
					subscriptionsTable.organizationId,
					eq(subscriptionsTable.customerId, customerId),
				),
			)
	}

	async findActiveByCustomerId(customerId: string): Promise<Subscription | null> {
		const [result] = await this.db
			.select()
			.from(subscriptionsTable)
			.where(
				this.withOrgFilter(
					subscriptionsTable.organizationId,
					and(
						eq(subscriptionsTable.customerId, customerId),
						eq(subscriptionsTable.status, 'active'),
					),
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
				this.withOrgFilter(
					subscriptionsTable.organizationId,
					eq(subscriptionsTable.status, status),
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
	new SubscriptionDrizzleRepository(organizationId, db)
