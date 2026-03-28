import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	subscriptionsTable: {
		_id: 'mock-_id',
		customerId: 'mock-customerId',
		organizationId: 'mock-organizationId',
		status: 'mock-status',
		trialEndsAt: 'mock-trialEndsAt',
	},
}))

vi.mock('drizzle-orm', () => ({
	and: vi.fn((...args: unknown[]) => ({ args, type: 'and' })),
	eq: vi.fn((col: unknown, val: unknown) => ({ col, type: 'eq', val })),
	gte: vi.fn((col: unknown, val: unknown) => ({ col, type: 'gte', val })),
	isNotNull: vi.fn((col: unknown) => ({ col, type: 'isNotNull' })),
	lt: vi.fn((col: unknown, val: unknown) => ({ col, type: 'lt', val })),
	sql: Object.assign(
		vi.fn((...args: unknown[]) => ({ args, type: 'sql' })),
		{
			raw: vi.fn((s: string) => s),
		},
	),
}))

import { subscriptionsTable } from '@/infra/db'
import { eq, gte, isNotNull, lt, sql } from 'drizzle-orm'
import { SubscriptionSpecification } from './subscription-specification'

describe('SubscriptionSpecification', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('toWhereClause', () => {
		it('should return undefined when no conditions are added', () => {
			const spec = new SubscriptionSpecification()
			expect(spec.toWhereClause()).toBeUndefined()
		})
	})

	describe('isActive', () => {
		it('should call eq with status column and "active"', () => {
			SubscriptionSpecification.isActive()
			expect(eq).toHaveBeenCalledWith(subscriptionsTable.status, 'active')
		})

		it('should produce a spec with a where clause', () => {
			const spec = SubscriptionSpecification.isActive()
			expect(spec.toWhereClause()).toBeDefined()
		})
	})

	describe('isTrialEnding', () => {
		it('should call eq with status column and "active"', () => {
			SubscriptionSpecification.isTrialEnding(7)
			expect(eq).toHaveBeenCalledWith(subscriptionsTable.status, 'active')
		})

		it('should call isNotNull with trialEndsAt column', () => {
			SubscriptionSpecification.isTrialEnding(7)
			expect(isNotNull).toHaveBeenCalledWith(subscriptionsTable.trialEndsAt)
		})

		it('should call gte with trialEndsAt for lower bound', () => {
			SubscriptionSpecification.isTrialEnding(7)
			expect(gte).toHaveBeenCalledWith(subscriptionsTable.trialEndsAt, expect.anything())
		})

		it('should call lt with trialEndsAt for upper bound', () => {
			SubscriptionSpecification.isTrialEnding(7)
			expect(lt).toHaveBeenCalledWith(subscriptionsTable.trialEndsAt, expect.anything())
		})

		it('should include the days count in the sql expression', () => {
			SubscriptionSpecification.isTrialEnding(14)
			expect(vi.mocked(sql).raw).toHaveBeenCalledWith('14')
		})

		it('should produce a spec with a where clause', () => {
			const spec = SubscriptionSpecification.isTrialEnding(7)
			expect(spec.toWhereClause()).toBeDefined()
		})
	})

	describe('isSuspended', () => {
		it('should call eq with status column and "suspended"', () => {
			SubscriptionSpecification.isSuspended()
			expect(eq).toHaveBeenCalledWith(subscriptionsTable.status, 'suspended')
		})

		it('should produce a spec with a where clause', () => {
			const spec = SubscriptionSpecification.isSuspended()
			expect(spec.toWhereClause()).toBeDefined()
		})
	})

	describe('isPastDue', () => {
		it('should call eq with status column and "past_due"', () => {
			SubscriptionSpecification.isPastDue()
			expect(eq).toHaveBeenCalledWith(subscriptionsTable.status, 'past_due')
		})

		it('should produce a spec with a where clause', () => {
			const spec = SubscriptionSpecification.isPastDue()
			expect(spec.toWhereClause()).toBeDefined()
		})
	})
})
