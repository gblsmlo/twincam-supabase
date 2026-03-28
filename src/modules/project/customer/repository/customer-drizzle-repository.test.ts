import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	customersTable: {
		_id: 'mock-_id',
		email: 'mock-email',
		name: 'mock-name',
		organizationId: 'mock-organizationId',
		spaceId: 'mock-spaceId',
		status: 'mock-status',
	},
	db: {},
}))

import type { Database } from '@/infra/db'
import { customersTable } from '@/infra/db'
import type { Customer, CustomerInsert, CustomerUpdate } from '../types'
import { CustomerDrizzleRepository } from './customer-drizzle-repository'

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440099'

const mockCustomer: Customer = {
	_id: '550e8400-e29b-41d4-a716-446655440000',
	createdAt: new Date(),
	email: 'customer@example.com',
	name: 'Test Customer',
	organizationId: TEST_ORG_ID,
	spaceId: '550e8400-e29b-41d4-a716-446655440001',
	status: 'active',
	updatedAt: new Date(),
}

const mockCustomerInsert: CustomerInsert = {
	email: mockCustomer.email,
	name: mockCustomer.name,
	organizationId: mockCustomer.organizationId,
	spaceId: mockCustomer.spaceId,
}

const mockCustomerUpdate: CustomerUpdate = {
	name: 'Updated Customer Name',
	status: 'inactive',
}

describe('CustomerDrizzleRepository', () => {
	let repository: CustomerDrizzleRepository
	let mockDb: Database

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('create', () => {
		it('should create a new customer successfully', async () => {
			const mockReturning = vi.fn().mockResolvedValue([mockCustomer])
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.create(mockCustomerInsert)

			expect(mockInsert).toHaveBeenCalledWith(customersTable)
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					email: mockCustomerInsert.email,
					organizationId: TEST_ORG_ID,
				}),
			)
			expect(result).toEqual(mockCustomer)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await expect(repository.create(mockCustomerInsert)).rejects.toThrow(
				'Database connection failed',
			)
		})

		it('should override organizationId in input with the repository context', async () => {
			const differentOrgInsert: CustomerInsert = {
				...mockCustomerInsert,
				organizationId: 'different-org-id',
			}
			const mockReturning = vi.fn().mockResolvedValue([mockCustomer])
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await repository.create(differentOrgInsert)

			const setCallArg = mockValues.mock.calls[0][0]
			expect(setCallArg.organizationId).toBe(TEST_ORG_ID)
		})
	})

	describe('update', () => {
		it('should update existing customer successfully', async () => {
			const updatedCustomer = { ...mockCustomer, ...mockCustomerUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedCustomer])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.update(mockCustomer._id, mockCustomerUpdate)

			expect(mockUpdate).toHaveBeenCalledWith(customersTable)
			expect(mockSet).toHaveBeenCalled()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg).toHaveProperty('updatedAt')
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.name).toBe(mockCustomerUpdate.name)
			expect(setCallArg.status).toBe(mockCustomerUpdate.status)

			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(updatedCustomer)
		})

		it('should set updatedAt to current date on update', async () => {
			const dateBefore = new Date()
			const updatedCustomer = { ...mockCustomer, ...mockCustomerUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedCustomer])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await repository.update(mockCustomer._id, mockCustomerUpdate)
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

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await expect(repository.update(mockCustomer._id, mockCustomerUpdate)).rejects.toThrow(
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

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.update('non-existent-id', mockCustomerUpdate)

			expect(result).toBeUndefined()
		})
	})

	describe('delete', () => {
		it('should delete a customer successfully and return deletedId', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockCustomer._id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.delete(mockCustomer._id)

			expect(mockDelete).toHaveBeenCalledWith(customersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockReturning).toHaveBeenCalled()
			expect(result).toEqual({ deletedId: mockCustomer._id })
		})

		it('should propagate error when deletion fails', async () => {
			const dbError = new Error('Delete failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await expect(repository.delete(mockCustomer._id)).rejects.toThrow('Delete failed')
		})

		it('should handle attempt to delete non-existent record', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.delete('non-existent-id')

			expect(result.deletedId).toBeUndefined()
		})
	})

	describe('findById', () => {
		it('should find customer by id successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockCustomer])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findById(mockCustomer._id)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(customersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockCustomer)
		})

		it('should return null when customer is not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findById('non-existent-id')

			expect(result).toBeNull()
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

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await expect(repository.findById(mockCustomer._id)).rejects.toThrow('Query failed')
		})
	})

	describe('findByEmail', () => {
		it('should find customer by email successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockCustomer])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findByEmail(mockCustomer.email)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(customersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockCustomer)
		})

		it('should return null when email is not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findByEmail('nonexistent@example.com')

			expect(result).toBeNull()
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

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await expect(repository.findByEmail(mockCustomer.email)).rejects.toThrow('Query failed')
		})
	})

	describe('findBySpaceId', () => {
		it('should find all customers by spaceId within the organization', async () => {
			const mockCustomers = [
				mockCustomer,
				{ ...mockCustomer, _id: 'another-id', name: 'Another Customer' },
			]
			const mockWhere = vi.fn().mockResolvedValue(mockCustomers)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findBySpaceId(mockCustomer.spaceId)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(customersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(mockCustomers)
			expect(result).toHaveLength(2)
		})

		it('should return empty array when no customers found for spaceId', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findBySpaceId('non-existent-space')

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

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await expect(repository.findBySpaceId(mockCustomer.spaceId)).rejects.toThrow('Query failed')
		})
	})

	describe('findByOrganizationId', () => {
		it('should find all customers by organizationId', async () => {
			const mockCustomers = [mockCustomer, { ...mockCustomer, _id: 'another-id' }]
			const mockWhere = vi.fn().mockResolvedValue(mockCustomers)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findByOrganizationId(TEST_ORG_ID)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(customersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(mockCustomers)
		})

		it('should return empty array when no customers found for organization', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findByOrganizationId('non-existent-org')

			expect(result).toEqual([])
		})
	})

	describe('findAllByStatus', () => {
		it('should find all customers with active status within the organization', async () => {
			const activeCustomers = [mockCustomer, { ...mockCustomer, _id: 'another-id' }]
			const mockWhere = vi.fn().mockResolvedValue(activeCustomers)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findAllByStatus('active')

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(customersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(activeCustomers)
		})

		it('should find all customers with inactive status within the organization', async () => {
			const inactiveCustomer = { ...mockCustomer, status: 'inactive' as const }
			const mockWhere = vi.fn().mockResolvedValue([inactiveCustomer])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findAllByStatus('inactive')

			expect(result).toEqual([inactiveCustomer])
		})

		it('should return empty array when no customers found with given status', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			const result = await repository.findAllByStatus('inactive')

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

			repository = new CustomerDrizzleRepository(TEST_ORG_ID, mockDb)

			await expect(repository.findAllByStatus('active')).rejects.toThrow('Query failed')
		})
	})
})
