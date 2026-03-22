import type { Product, ProductInsert, ProductUpdate } from '../types'

/**
 * Repository scoped to a specific organization.
 * All queries are automatically filtered by the organizationId provided
 * at construction time via the factory function.
 */
export interface ProductRepository {
	create(input: ProductInsert): Promise<Product>
	update(id: string, input: ProductUpdate): Promise<Product>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Product | null>
	findByPriceId(priceId: string): Promise<Product[]>
	findByOrganizationId(organizationId: string): Promise<Product[]>
	findAll(): Promise<Product[]>
}
