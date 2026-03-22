import type { Product, ProductInsert, ProductUpdate } from '../types'

/**
 * Repository optionally scoped to a specific organization.
 * When an organizationId is provided at construction time via the factory function,
 * all queries are filtered by that organization.
 * When no organizationId is provided, global (non-tenant-scoped) products are returned.
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
