import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	subscriptionsTable: {
		customerId: 'mock-customerId',
		endedAt: 'mock-endedAt',
		id: 'mock-id',
		planName: 'mock-planName',
		priceId: 'mock-priceId',
		startedAt: 'mock-startedAt',
		status: 'mock-status',
		trialEndsAt: 'mock-trialEndsAt',
	},
}))

import type { Database } from '@/infra/db'
import { subscriptionsTable } from '@/infra/db'
import type { Subscription, SubscriptionInsert, SubscriptionUpdate } from '../types'
import { SubscriptionDrizzleRepository } from './subscription-drizzle-repository'

const mockSubscription: Subscription = {
	_id: '550e8400-e29b-41d4-a716-446655440000',
	createdAt: new Date(),
	customerId: '550e8400-e29b-41d4-a716-446655440001',
	finishedAt: null,
	planName: 'Pro Plan',
	priceId: '550e8400-e29b-41d4-a716-446655440002',
	startedAt: new Date(),
	status: 'active',
	trialEndsAt: null,
	updatedAt: new Date(),
}

const mockSubscriptionInsert: SubscriptionInsert = {
	_id: mockSubscription._id,
	customerId: mockSubscription.customerId,
	planName: mockSubscription.planName,
	priceId: mockSubscription.priceId,
}

const mockSubscriptionUpdate: SubscriptionUpdate = {
	finishedAt: new Date(),
	status: 'canceled',
}

describe('SubscriptionDrizzleRepository', () => {
	let repository: SubscriptionDrizzleRepository
	let mockDb: Database

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('create', () => {
		it('should create a new subscription successfully', async () => {
			const mockValues = vi.fn().mockResolvedValue([mockSubscription])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.create(mockSubscriptionInsert)

			expect(mockInsert).toHaveBeenCalledWith(subscriptionsTable)
			expect(mockValues).toHaveBeenCalledWith(mockSubscriptionInsert)
			expect(result).toEqual(mockSubscription)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockValues = vi.fn().mockRejectedValue(dbError)
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			await expect(repository.create(mockSubscriptionInsert)).rejects.toThrow(
				'Database connection failed',
			)
		})

		it('should create subscription with only required fields', async () => {
			const minimalInsert: SubscriptionInsert = {
				_id: mockSubscription._id,
				customerId: mockSubscription.customerId,
				planName: mockSubscription.planName,
			}
			const minimalSubscription = { ...mockSubscription, priceId: null }

			const mockValues = vi.fn().mockResolvedValue([minimalSubscription])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.create(minimalInsert)

			expect(result).toEqual(minimalSubscription)
			expect(mockValues).toHaveBeenCalledWith(minimalInsert)
		})
	})

	describe('update', () => {
		it('should update existing subscription successfully', async () => {
			const updatedSubscription = { ...mockSubscription, ...mockSubscriptionUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedSubscription])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.update(mockSubscription._id, mockSubscriptionUpdate)

			expect(mockUpdate).toHaveBeenCalledWith(subscriptionsTable)
			expect(mockSet).toHaveBeenCalled()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg).toHaveProperty('updatedAt')
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.status).toBe(mockSubscriptionUpdate.status)
			expect(setCallArg.finishedAt).toBe(mockSubscriptionUpdate.finishedAt)

			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(updatedSubscription)
		})

		it('should set updatedAt to current date on update', async () => {
			const dateBefore = new Date()
			const updatedSubscription = { ...mockSubscription, ...mockSubscriptionUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedSubscription])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			await repository.update(mockSubscription._id, mockSubscriptionUpdate)
			const dateAfter = new Date()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.updatedAt.getTime()).toBeGreaterThanOrEqual(dateBefore.getTime())
			expect(setCallArg.updatedAt.getTime()).toBeLessThanOrEqual(dateAfter.getTime())
		})

		it('should propagate error when update fails', async () => {
			const dbError = new Error('Update failed')
			const mockWhere = vi.fn().mockRejectedValue(dbError)
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			await expect(repository.update(mockSubscription._id, mockSubscriptionUpdate)).rejects.toThrow(
				'Update failed',
			)
		})

		it('should return undefined when no record is found', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.update('non-existent-id', mockSubscriptionUpdate)

			expect(result).toBeUndefined()
		})
	})

	describe('delete', () => {
		it('should delete a subscription successfully and return deletedId', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockSubscription._id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.delete(mockSubscription._id)

			expect(mockDelete).toHaveBeenCalledWith(subscriptionsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockReturning).toHaveBeenCalled()
			expect(result).toEqual({ deletedId: mockSubscription._id })
		})

		it('should propagate error when deletion fails', async () => {
			const dbError = new Error('Delete failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			await expect(repository.delete(mockSubscription._id)).rejects.toThrow('Delete failed')
		})

		it('should handle attempt to delete non-existent record', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.delete('non-existent-id')

			expect(result.deletedId).toBeUndefined()
		})
	})

	describe('findById', () => {
		it('should find subscription by id successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findById(mockSubscription._id)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(subscriptionsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockSubscription)
		})

		it('should return undefined when subscription is not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findById('non-existent-id')

			expect(result).toBeUndefined()
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockLimit = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			await expect(repository.findById(mockSubscription._id)).rejects.toThrow('Query failed')
		})
	})

	describe('findByCustomerId', () => {
		it('should find all subscriptions by customerId successfully', async () => {
			const mockSubscriptions = [
				mockSubscription,
				{ ...mockSubscription, id: 'another-id', planName: 'Basic Plan' },
			]
			const mockWhere = vi.fn().mockResolvedValue(mockSubscriptions)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findByCustomerId(mockSubscription.customerId)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(subscriptionsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(mockSubscriptions)
			expect(result).toHaveLength(2)
		})

		it('should return empty array when no subscriptions found for customerId', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findByCustomerId('non-existent-customer')

			expect(result).toEqual([])
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockWhere = vi.fn().mockRejectedValue(dbError)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			await expect(repository.findByCustomerId(mockSubscription.customerId)).rejects.toThrow(
				'Query failed',
			)
		})
	})

	describe('findActiveByCustomerId', () => {
		it('should find active subscription by customerId successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findActiveByCustomerId(mockSubscription.customerId)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(subscriptionsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockSubscription)
		})

		it('should return undefined when no active subscription found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findActiveByCustomerId('customer-without-active-subscription')

			expect(result).toBeUndefined()
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockLimit = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			await expect(repository.findActiveByCustomerId(mockSubscription.customerId)).rejects.toThrow(
				'Query failed',
			)
		})
	})

	describe('findByStatus', () => {
		it('should find all subscriptions with active status', async () => {
			const activeSubscriptions = [mockSubscription, { ...mockSubscription, id: 'another-id' }]
			const mockWhere = vi.fn().mockResolvedValue(activeSubscriptions)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findByStatus('active')

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(subscriptionsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(activeSubscriptions)
		})

		it('should find all subscriptions with canceled status', async () => {
			const canceledSubscription = { ...mockSubscription, status: 'canceled' as const }
			const mockWhere = vi.fn().mockResolvedValue([canceledSubscription])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findByStatus('canceled')

			expect(result).toEqual([canceledSubscription])
		})

		it('should find all subscriptions with past_due status', async () => {
			const pastDueSubscription = { ...mockSubscription, status: 'past_due' as const }
			const mockWhere = vi.fn().mockResolvedValue([pastDueSubscription])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findByStatus('past_due')

			expect(result).toEqual([pastDueSubscription])
		})

		it('should return empty array when no subscriptions found with given status', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			const result = await repository.findByStatus('past_due')

			expect(result).toEqual([])
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockWhere = vi.fn().mockRejectedValue(dbError)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SubscriptionDrizzleRepository(mockDb)

			await expect(repository.findByStatus('active')).rejects.toThrow('Query failed')
		})
	})
})
