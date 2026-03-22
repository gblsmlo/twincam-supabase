import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	productsTable: {
		_id: 'mock-_id',
		createdAt: 'mock-createdAt',
		description: 'mock-description',
		name: 'mock-name',
		organizationId: 'mock-organizationId',
		priceId: 'mock-priceId',
		updatedAt: 'mock-updatedAt',
	},
}))

import type { Database } from '@/infra/db'
import { productsTable } from '@/infra/db'
import type { Product, ProductInsert, ProductUpdate } from '../types'
import { ProductDrizzleRepository } from './product-drizzle-repository'

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440099'

const mockProduct: Product = {
	_id: '550e8400-e29b-41d4-a716-446655440300',
	createdAt: new Date('2024-01-01T00:00:00Z'),
	description: 'Test product description',
	name: 'Test Product',
	organizationId: TEST_ORG_ID,
	priceId: '550e8400-e29b-41d4-a716-446655440400',
	updatedAt: new Date('2024-01-01T00:00:00Z'),
}

const mockProductInsert: ProductInsert = {
	description: mockProduct.description,
	name: mockProduct.name,
	organizationId: mockProduct.organizationId,
	priceId: mockProduct.priceId,
}

const mockProductUpdate: ProductUpdate = {
	description: 'Updated description',
	name: 'Updated Product Name',
}

describe('ProductDrizzleRepository', () => {
	let repository: ProductDrizzleRepository
	let mockDb: Database

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('create', () => {
		it('should create a new product successfully', async () => {
			const mockReturning = vi.fn().mockResolvedValue([mockProduct])
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.create(mockProductInsert)

			expect(mockInsert).toHaveBeenCalledWith(productsTable)
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					description: mockProductInsert.description,
					organizationId: TEST_ORG_ID,
				}),
			)
			expect(result).toEqual(mockProduct)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.create(mockProductInsert)).rejects.toThrow(
				'Database connection failed',
			)
		})

		it('should create product without organizationId when no org context', async () => {
			const globalProductInsert: ProductInsert = {
				description: mockProduct.description,
				name: mockProduct.name,
			}
			const globalProduct = { ...mockProduct, organizationId: null }

			const mockReturning = vi.fn().mockResolvedValue([globalProduct])
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.create(globalProductInsert)

			expect(result).toEqual(globalProduct)
			expect(mockValues).toHaveBeenCalledWith(globalProductInsert)
		})
	})

	describe('update', () => {
		it('should update existing product successfully', async () => {
			const updatedProduct = { ...mockProduct, ...mockProductUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedProduct])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.update(mockProduct._id, mockProductUpdate)

			expect(mockUpdate).toHaveBeenCalledWith(productsTable)
			expect(mockSet).toHaveBeenCalled()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg).toHaveProperty('updatedAt')
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.name).toBe(mockProductUpdate.name)
			expect(setCallArg.description).toBe(mockProductUpdate.description)

			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(updatedProduct)
		})

		it('should set updatedAt with current date', async () => {
			const dateBefore = new Date()
			const updatedProduct = { ...mockProduct, ...mockProductUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedProduct])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			await repository.update(mockProduct._id, mockProductUpdate)
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

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.update(mockProduct._id, mockProductUpdate)).rejects.toThrow(
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

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.update('non-existent-id', mockProductUpdate)

			expect(result).toBeUndefined()
		})
	})

	describe('delete', () => {
		it('should delete a product successfully and return deletedId', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockProduct._id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.delete(mockProduct._id)

			expect(mockDelete).toHaveBeenCalledWith(productsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockReturning).toHaveBeenCalled()
			expect(result).toEqual({ deletedId: mockProduct._id })
		})

		it('should propagate error when delete fails', async () => {
			const dbError = new Error('Delete failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.delete(mockProduct._id)).rejects.toThrow('Delete failed')
		})

		it('should handle attempt to delete non-existent record', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.delete('non-existent-id')

			expect(result.deletedId).toBeUndefined()
		})
	})

	describe('findById', () => {
		it('should find product by id successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockProduct])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findById(mockProduct._id)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(productsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockProduct)
		})

		it('should return null when no product is found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

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

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.findById(mockProduct._id)).rejects.toThrow('Query failed')
		})
	})

	describe('findByPriceId', () => {
		it('should find products by priceId successfully', async () => {
			const mockWhere = vi.fn().mockResolvedValue([mockProduct])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByPriceId(mockProduct.priceId!)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(productsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([mockProduct])
		})

		it('should return empty array when no products found', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByPriceId('non-existent-price')

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

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.findByPriceId(mockProduct.priceId!)).rejects.toThrow('Query failed')
		})

		it('should return multiple products when found', async () => {
			const secondProduct: Product = {
				...mockProduct,
				_id: '550e8400-e29b-41d4-a716-446655440301',
				name: 'Second Product',
			}
			const mockWhere = vi.fn().mockResolvedValue([mockProduct, secondProduct])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByPriceId(mockProduct.priceId!)

			expect(result).toHaveLength(2)
			expect(result).toEqual([mockProduct, secondProduct])
		})
	})

	describe('findByOrganizationId', () => {
		it('should find all products for an organization', async () => {
			const mockWhere = vi.fn().mockResolvedValue([mockProduct])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByOrganizationId(TEST_ORG_ID)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(productsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([mockProduct])
		})

		it('should return empty array when no products found for organization', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByOrganizationId('non-existent-org')

			expect(result).toEqual([])
		})
	})

	describe('findAll', () => {
		it('should find all products scoped to organization when org context set', async () => {
			const mockWhere = vi.fn().mockResolvedValue([mockProduct])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findAll()

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(productsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([mockProduct])
		})

		it('should find all global products when no org context', async () => {
			const mockFrom = vi.fn().mockResolvedValue([mockProduct])
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.findAll()

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(productsTable)
			expect(result).toEqual([mockProduct])
		})

		it('should return empty array when no products exist', async () => {
			const mockFrom = vi.fn().mockResolvedValue([])
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.findAll()

			expect(result).toEqual([])
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockFrom = vi.fn().mockRejectedValue(dbError)
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			await expect(repository.findAll()).rejects.toThrow('Query failed')
		})

		it('should return multiple products', async () => {
			const secondProduct: Product = {
				...mockProduct,
				_id: '550e8400-e29b-41d4-a716-446655440302',
				name: 'Another Product',
			}
			const thirdProduct: Product = {
				...mockProduct,
				_id: '550e8400-e29b-41d4-a716-446655440303',
				name: 'Third Product',
			}
			const mockFrom = vi.fn().mockResolvedValue([mockProduct, secondProduct, thirdProduct])
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.findAll()

			expect(result).toHaveLength(3)
			expect(result).toEqual([mockProduct, secondProduct, thirdProduct])
		})
	})
})
