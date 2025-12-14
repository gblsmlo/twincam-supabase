import { type Database, db, productsTable } from '@/infra/db'
import { eq } from 'drizzle-orm'
import type { Product, ProductInsert, ProductUpdate } from '../types'
import type { ProductRepository } from './product-repository'

export class ProductDrizzleRepository implements ProductRepository {
	constructor(private db: Database) {}

	async create(input: ProductInsert): Promise<Product> {
		const [result] = await this.db.insert(productsTable).values(input)

		return result
	}

	async update(id: string, input: ProductUpdate): Promise<Product> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db
			.update(productsTable)
			.set(update)
			.where(eq(productsTable._id, id))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(productsTable)
			.where(eq(productsTable._id, id))
			.returning({ deletedId: productsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Product | null> {
		const [result] = await this.db
			.select()
			.from(productsTable)
			.where(eq(productsTable._id, id))
			.limit(1)

		return result
	}

	async findByPriceId(priceId: string): Promise<Product[]> {
		const results = await this.db
			.select()
			.from(productsTable)
			.where(eq(productsTable.priceId, priceId))

		return results
	}

	async findAll(): Promise<Product[]> {
		const results = await this.db.select().from(productsTable)

		return results
	}
}

export const productRepository = () => new ProductDrizzleRepository(db)
