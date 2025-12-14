import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product, ProductInsert } from '../types'
import { createProductAction } from './create-product-action'

vi.mock('../repository/product-drizzle-repository', () => ({
	productRepository: vi.fn(),
}))

vi.mock('@/shared/errors/result', async () => {
	const actual = await vi.importActual('@/shared/errors/result')
	return actual
})

const mockProduct: Product = {
	_id: '550e8400-e29b-41d4-a716-446655440000',
	createdAt: new Date('2024-01-01T00:00:00Z'),
	description: 'Test product description',
	name: 'Test Product',
	priceId: '550e8400-e29b-41d4-a716-446655440001',
	updatedAt: new Date('2024-01-01T00:00:00Z'),
}

const validInput: ProductInsert = {
	description: 'Test product description',
	name: 'Test Product',
	priceId: '550e8400-e29b-41d4-a716-446655440001',
}

describe('createProductAction', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should create a product successfully with valid input', async () => {
		const { productRepository } = await import('../repository/product-drizzle-repository')
		const mockCreate = vi.fn().mockResolvedValue(mockProduct)

		vi.mocked(productRepository).mockReturnValue({
			create: mockCreate,
		} as any)

		const result = await createProductAction(validInput)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.product).toEqual(mockProduct)
		}
		expect(mockCreate).toHaveBeenCalledWith(validInput)
	})

	it('should return validation error for invalid input', async () => {
		const invalidInput = {
			description: null, // Should be string
			name: 123, // Should be string
		} as any

		const result = await createProductAction(invalidInput)

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.type).toBe('VALIDATION_ERROR')
			expect(result.message).toContain('Dados inválidos')
		}
	})

	it('should return database error when repository throws', async () => {
		const { productRepository } = await import('../repository/product-drizzle-repository')
		const mockCreate = vi.fn().mockRejectedValue(new Error('Database connection failed'))

		vi.mocked(productRepository).mockReturnValue({
			create: mockCreate,
		} as any)

		const result = await createProductAction(validInput)

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.type).toBe('DATABASE_ERROR')
			expect(result.error).toBe('Error')
			expect(result.message).toContain('Database connection failed')
		}
	})

	it('should return unknown error for unexpected errors', async () => {
		const { productRepository } = await import('../repository/product-drizzle-repository')
		const mockCreate = vi.fn().mockRejectedValue('Unexpected error')

		vi.mocked(productRepository).mockReturnValue({
			create: mockCreate,
		} as any)

		const result = await createProductAction(validInput)

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.type).toBe('UNKNOWN_ERROR')
			expect(result.error).toBe('Erro desconhecido')
		}
	})

	it('should handle product without priceId', async () => {
		const { productRepository } = await import('../repository/product-drizzle-repository')
		const inputWithoutPrice = {
			description: 'Test product',
			name: 'Test',
		}
		const productWithoutPrice = { ...mockProduct, priceId: null }
		const mockCreate = vi.fn().mockResolvedValue(productWithoutPrice)

		vi.mocked(productRepository).mockReturnValue({
			create: mockCreate,
		} as any)

		const result = await createProductAction(inputWithoutPrice as ProductInsert)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.product.priceId).toBeNull()
		}
	})
})
