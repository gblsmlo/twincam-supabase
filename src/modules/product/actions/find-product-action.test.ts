import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product } from '../types'
import { findProductAction } from './find-product-action'

vi.mock('../repository/product-drizzle-repository', () => ({
	productRepository: vi.fn(),
}))

vi.mock('@/shared/errors/result', async () => {
	const actual = await vi.importActual('@/shared/errors/result')
	return actual
})

const mockProducts: Product[] = [
	{
		_id: '550e8400-e29b-41d4-a716-446655440000',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		description: 'Product 1',
		name: 'Test Product 1',
		priceId: '550e8400-e29b-41d4-a716-446655440001',
		updatedAt: new Date('2024-01-01T00:00:00Z'),
	},
	{
		_id: '550e8400-e29b-41d4-a716-446655440002',
		createdAt: new Date('2024-01-02T00:00:00Z'),
		description: 'Product 2',
		name: 'Test Product 2',
		priceId: null,
		updatedAt: new Date('2024-01-02T00:00:00Z'),
	},
]

describe('findProductAction', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should return all products successfully', async () => {
		const { productRepository } = await import('../repository/product-drizzle-repository')
		const mockFindAll = vi.fn().mockResolvedValue(mockProducts)

		vi.mocked(productRepository).mockReturnValue({
			findAll: mockFindAll,
		} as any)

		const result = await findProductAction()

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.products).toEqual(mockProducts)
			expect(result.data.products).toHaveLength(2)
		}
		expect(mockFindAll).toHaveBeenCalledOnce()
	})

	it('should return empty array when no products exist', async () => {
		const { productRepository } = await import('../repository/product-drizzle-repository')
		const mockFindAll = vi.fn().mockResolvedValue([])

		vi.mocked(productRepository).mockReturnValue({
			findAll: mockFindAll,
		} as any)

		const result = await findProductAction()

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.products).toEqual([])
			expect(result.data.products).toHaveLength(0)
		}
	})

	it('should return database error when repository throws', async () => {
		const { productRepository } = await import('../repository/product-drizzle-repository')
		const mockFindAll = vi.fn().mockRejectedValue(new Error('Database query failed'))

		vi.mocked(productRepository).mockReturnValue({
			findAll: mockFindAll,
		} as any)

		const result = await findProductAction()

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.type).toBe('DATABASE_ERROR')
			expect(result.error).toBe('Error')
			expect(result.message).toContain('Database query failed')
		}
	})

	it('should return unknown error for unexpected errors', async () => {
		const { productRepository } = await import('../repository/product-drizzle-repository')
		const mockFindAll = vi.fn().mockRejectedValue('Unexpected error')

		vi.mocked(productRepository).mockReturnValue({
			findAll: mockFindAll,
		} as any)

		const result = await findProductAction()

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.type).toBe('UNKNOWN_ERROR')
			expect(result.error).toBe('Erro desconhecido')
		}
	})
})
