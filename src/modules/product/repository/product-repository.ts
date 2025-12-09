import type { Product, ProductInsert, ProductUpdate } from '../types'

export interface ProductRepository {
	create(input: ProductInsert): Promise<Product>
	update(id: string, input: ProductUpdate): Promise<Product>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Product | null>
	findByPriceId(priceId: string): Promise<Product[]>
	findAll(): Promise<Product[]>
}
