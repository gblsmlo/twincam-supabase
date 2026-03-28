import { subscriptionsTable } from '@/infra/db'
import { Specification } from '@/shared/patterns/specification'
import { eq, gte, isNotNull, lt, sql } from 'drizzle-orm'
import type { Subscription } from '../types'

export class SubscriptionSpecification extends Specification<Subscription> {
	static isActive(): SubscriptionSpecification {
		return new SubscriptionSpecification().addCondition(eq(subscriptionsTable.status, 'active'))
	}

	static isTrialEnding(days: number): SubscriptionSpecification {
		return new SubscriptionSpecification()
			.addCondition(eq(subscriptionsTable.status, 'active'))
			.addCondition(isNotNull(subscriptionsTable.trialEndsAt))
			.addCondition(gte(subscriptionsTable.trialEndsAt, sql`now()`))
			.addCondition(
				lt(subscriptionsTable.trialEndsAt, sql`now() + interval '${sql.raw(String(days))} days'`),
			)
	}

	static isSuspended(): SubscriptionSpecification {
		return new SubscriptionSpecification().addCondition(eq(subscriptionsTable.status, 'suspended'))
	}

	static isPastDue(): SubscriptionSpecification {
		return new SubscriptionSpecification().addCondition(eq(subscriptionsTable.status, 'past_due'))
	}
}
