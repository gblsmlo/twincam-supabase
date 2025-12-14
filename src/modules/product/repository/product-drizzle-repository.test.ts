import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	productsTable: {
		createdAt: 'mock-createdAt',
		description: 'mock-description',
		id: 'mock-id',
		name: 'mock-name',
		priceId: 'mock-priceId',
		updatedAt: 'mock-updatedAt',
	},
}))

import type { Database } from '@/infra/db'
import { productsTable } from '@/infra/db'
import type { Product, ProductInsert, ProductUpdate } from '../types'
import { ProductDrizzleRepository } from './product-drizzle-repository'

const mockProduct: Product = {
	createdAt: new Date('2024-01-01T00:00:00Z'),
	description: 'Test product description',
	id: '550e8400-e29b-41d4-a716-446655440300',
	name: 'Test Product',
	priceId: '550e8400-e29b-41d4-a716-446655440400',
	updatedAt: new Date('2024-01-01T00:00:00Z'),
}

const mockProductInsert: ProductInsert = {
	description: mockProduct.description,
	id: mockProduct.id,
	name: mockProduct.name,
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
			const mockValues = vi.fn().mockResolvedValue([mockProduct])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.create(mockProductInsert)

			expect(mockInsert).toHaveBeenCalledWith(productsTable)
			expect(mockValues).toHaveBeenCalledWith(mockProductInsert)
			expect(result).toEqual(mockProduct)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockValues = vi.fn().mockRejectedValue(dbError)
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			await expect(repository.create(mockProductInsert)).rejects.toThrow(
				'Database connection failed',
			)
		})

		it('should create product with only required fields', async () => {
			const minimalInsert: ProductInsert = {
				description: mockProduct.description,
				id: mockProduct.id,
				name: mockProduct.name,
			}
			const minimalProduct = { ...mockProduct, priceId: null }

			const mockValues = vi.fn().mockResolvedValue([minimalProduct])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.create(minimalInsert)

			expect(result).toEqual(minimalProduct)
			expect(mockValues).toHaveBeenCalledWith(minimalInsert)
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

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.update(mockProduct.id, mockProductUpdate)

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

			repository = new ProductDrizzleRepository(mockDb)

			await repository.update(mockProduct.id, mockProductUpdate)
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

			repository = new ProductDrizzleRepository(mockDb)

			await expect(repository.update(mockProduct.id, mockProductUpdate)).rejects.toThrow(
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

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.update('non-existent-id', mockProductUpdate)

			expect(result).toBeUndefined()
		})
	})

	describe('delete', () => {
		it('should delete a product successfully and return deletedId', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockProduct.id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.delete(mockProduct.id)

			expect(mockDelete).toHaveBeenCalledWith(productsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockReturning).toHaveBeenCalled()
			expect(result).toEqual({ deletedId: mockProduct.id })
		})

		it('should propagate error when delete fails', async () => {
			const dbError = new Error('Delete failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			await expect(repository.delete(mockProduct.id)).rejects.toThrow('Delete failed')
		})

		it('should handle attempt to delete non-existent record', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

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

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.findById(mockProduct.id)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(productsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockProduct)
		})

		it('should return undefined when no product is found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

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

			repository = new ProductDrizzleRepository(mockDb)

			await expect(repository.findById(mockProduct.id)).rejects.toThrow('Query failed')
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

			repository = new ProductDrizzleRepository(mockDb)

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

			repository = new ProductDrizzleRepository(mockDb)

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

			repository = new ProductDrizzleRepository(mockDb)

			await expect(repository.findByPriceId(mockProduct.priceId!)).rejects.toThrow('Query failed')
		})

		it('should return multiple products when found', async () => {
			const secondProduct: Product = {
				...mockProduct,
				id: '550e8400-e29b-41d4-a716-446655440301',
				name: 'Second Product',
			}
			const mockWhere = vi.fn().mockResolvedValue([mockProduct, secondProduct])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProductDrizzleRepository(mockDb)

			const result = await repository.findByPriceId(mockProduct.priceId!)

			expect(result).toHaveLength(2)
			expect(result).toEqual([mockProduct, secondProduct])
		})
	})

	describe('findAll', () => {
		it('should find all products successfully', async () => {
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
				id: '550e8400-e29b-41d4-a716-446655440302',
				name: 'Another Product',
			}
			const thirdProduct: Product = {
				...mockProduct,
				id: '550e8400-e29b-41d4-a716-446655440303',
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
