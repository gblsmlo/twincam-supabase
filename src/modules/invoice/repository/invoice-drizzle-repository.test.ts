import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	invoicesTable: {
		amount: 'mock-amount',
		createdAt: 'mock-createdAt',
		currency: 'mock-currency',
		dueDate: 'mock-dueDate',
		id: 'mock-id',
		paidAt: 'mock-paidAt',
		status: 'mock-status',
		subscriptionId: 'mock-subscriptionId',
		updatedAt: 'mock-updatedAt',
	},
	subscriptionsTable: {
		customerId: 'mock-customerId',
		id: 'mock-subscription-id',
	},
}))

import type { Database } from '@/infra/db'
import { invoicesTable, subscriptionsTable } from '@/infra/db'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types'
import { InvoiceDrizzleRepository } from './invoice-drizzle-repository'

const mockInvoice: Invoice = {
	amount: '99.99',
	createdAt: new Date(),
	currency: 'BRL',
	dueDate: new Date('2025-02-15'),
	id: '550e8400-e29b-41d4-a716-446655440000',
	paidAt: null,
	status: 'open',
	subscriptionId: '550e8400-e29b-41d4-a716-446655440001',
	updatedAt: new Date(),
}

const mockInvoiceInsert: InvoiceInsert = {
	amount: mockInvoice.amount,
	dueDate: mockInvoice.dueDate,
	id: mockInvoice.id,
	subscriptionId: mockInvoice.subscriptionId,
}

const mockInvoiceUpdate: InvoiceUpdate = {
	paidAt: new Date(),
	status: 'paid',
}

describe('InvoiceDrizzleRepository', () => {
	let repository: InvoiceDrizzleRepository
	let mockDb: Database

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('create', () => {
		it('should create a new invoice successfully', async () => {
			const mockValues = vi.fn().mockResolvedValue([mockInvoice])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.create(mockInvoiceInsert)

			expect(mockInsert).toHaveBeenCalledWith(invoicesTable)
			expect(mockValues).toHaveBeenCalledWith(mockInvoiceInsert)
			expect(result).toEqual(mockInvoice)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockValues = vi.fn().mockRejectedValue(dbError)
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			await expect(repository.create(mockInvoiceInsert)).rejects.toThrow(
				'Database connection failed',
			)
		})

		it('should create invoice with only required fields', async () => {
			const minimalInsert: InvoiceInsert = {
				amount: mockInvoice.amount,
				dueDate: mockInvoice.dueDate,
				id: mockInvoice.id,
				subscriptionId: mockInvoice.subscriptionId,
			}
			const minimalInvoice = { ...mockInvoice }

			const mockValues = vi.fn().mockResolvedValue([minimalInvoice])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.create(minimalInsert)

			expect(result).toEqual(minimalInvoice)
			expect(mockValues).toHaveBeenCalledWith(minimalInsert)
		})
	})

	describe('update', () => {
		it('should update existing invoice successfully', async () => {
			const updatedInvoice = { ...mockInvoice, ...mockInvoiceUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedInvoice])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.update(mockInvoice.id, mockInvoiceUpdate)

			expect(mockUpdate).toHaveBeenCalledWith(invoicesTable)
			expect(mockSet).toHaveBeenCalled()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg).toHaveProperty('updatedAt')
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.status).toBe(mockInvoiceUpdate.status)
			expect(setCallArg.paidAt).toBe(mockInvoiceUpdate.paidAt)

			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(updatedInvoice)
		})

		it('should set updatedAt to current date on update', async () => {
			const dateBefore = new Date()
			const updatedInvoice = { ...mockInvoice, ...mockInvoiceUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedInvoice])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			await repository.update(mockInvoice.id, mockInvoiceUpdate)
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

			repository = new InvoiceDrizzleRepository(mockDb)

			await expect(repository.update(mockInvoice.id, mockInvoiceUpdate)).rejects.toThrow(
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

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.update('non-existent-id', mockInvoiceUpdate)

			expect(result).toBeUndefined()
		})
	})

	describe('delete', () => {
		it('should delete an invoice successfully and return deletedId', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockInvoice.id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.delete(mockInvoice.id)

			expect(mockDelete).toHaveBeenCalledWith(invoicesTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockReturning).toHaveBeenCalled()
			expect(result).toEqual({ deletedId: mockInvoice.id })
		})

		it('should propagate error when deletion fails', async () => {
			const dbError = new Error('Delete failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			await expect(repository.delete(mockInvoice.id)).rejects.toThrow('Delete failed')
		})

		it('should handle attempt to delete non-existent record', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.delete('non-existent-id')

			expect(result.deletedId).toBeUndefined()
		})
	})

	describe('findById', () => {
		it('should find invoice by id successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockInvoice])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.findById(mockInvoice.id)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(invoicesTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockInvoice)
		})

		it('should return undefined when invoice is not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

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

			repository = new InvoiceDrizzleRepository(mockDb)

			await expect(repository.findById(mockInvoice.id)).rejects.toThrow('Query failed')
		})
	})

	describe('findBySubscriptionId', () => {
		it('should find all invoices by subscriptionId successfully', async () => {
			const mockInvoices = [mockInvoice, { ...mockInvoice, amount: '199.99', id: 'another-id' }]
			const mockWhere = vi.fn().mockResolvedValue(mockInvoices)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.findBySubscriptionId(mockInvoice.subscriptionId)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(invoicesTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(mockInvoices)
			expect(result).toHaveLength(2)
		})

		it('should return empty array when no invoices found for subscriptionId', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.findBySubscriptionId('non-existent-subscription')

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

			repository = new InvoiceDrizzleRepository(mockDb)

			await expect(repository.findBySubscriptionId(mockInvoice.subscriptionId)).rejects.toThrow(
				'Query failed',
			)
		})
	})

	describe('findOverdue', () => {
		it('should find all overdue invoices successfully', async () => {
			const overdueInvoice = {
				...mockInvoice,
				dueDate: new Date('2024-01-01'),
				status: 'open' as const,
			}
			const mockWhere = vi.fn().mockResolvedValue([overdueInvoice])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.findOverdue()

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(invoicesTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([overdueInvoice])
		})

		it('should return empty array when no overdue invoices exist', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.findOverdue()

			expect(result).toEqual([])
		})

		it('should not include paid invoices even if past due date', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.findOverdue()

			expect(mockWhere).toHaveBeenCalled()
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

			repository = new InvoiceDrizzleRepository(mockDb)

			await expect(repository.findOverdue()).rejects.toThrow('Query failed')
		})
	})

	describe('findLatestByCustomerId', () => {
		it('should find latest invoice by customerId successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockInvoice])
			const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
			const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere })
			const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.findLatestByCustomerId('customer-id')

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(invoicesTable)
			expect(mockInnerJoin).toHaveBeenCalled()
			expect(mockWhere).toHaveBeenCalled()
			expect(mockOrderBy).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockInvoice)
		})

		it('should return undefined when no invoices found for customerId', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
			const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere })
			const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			const result = await repository.findLatestByCustomerId('non-existent-customer')

			expect(result).toBeUndefined()
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockLimit = vi.fn().mockRejectedValue(dbError)
			const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
			const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere })
			const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			await expect(repository.findLatestByCustomerId('customer-id')).rejects.toThrow('Query failed')
		})

		it('should use inner join with subscriptions table', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockInvoice])
			const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
			const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere })
			const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new InvoiceDrizzleRepository(mockDb)

			await repository.findLatestByCustomerId('customer-id')

			expect(mockInnerJoin).toHaveBeenCalledWith(subscriptionsTable, expect.anything())
		})
	})
})
