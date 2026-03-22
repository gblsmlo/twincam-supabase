import { type Database, db, productsTable } from '@/infra/db'
import { and, eq } from 'drizzle-orm'
import type { Product, ProductInsert, ProductUpdate } from '../types'
import type { ProductRepository } from './product-repository'

export class ProductDrizzleRepository implements ProductRepository {
	constructor(
		private db: Database,
		private organizationId?: string | null,
	) {}

	async create(input: ProductInsert): Promise<Product> {
		const values = this.organizationId ? { ...input, organizationId: this.organizationId } : input

		const [result] = await this.db.insert(productsTable).values(values).returning()

		return result
	}

	async update(id: string, input: ProductUpdate): Promise<Product> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const whereClause = this.organizationId
			? and(eq(productsTable._id, id), eq(productsTable.organizationId, this.organizationId))
			: eq(productsTable._id, id)

		const [result] = await this.db.update(productsTable).set(update).where(whereClause)

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const whereClause = this.organizationId
			? and(eq(productsTable._id, id), eq(productsTable.organizationId, this.organizationId))
			: eq(productsTable._id, id)

		const [result] = await this.db
			.delete(productsTable)
			.where(whereClause)
			.returning({ deletedId: productsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Product | null> {
		const whereClause = this.organizationId
			? and(eq(productsTable._id, id), eq(productsTable.organizationId, this.organizationId))
			: eq(productsTable._id, id)

		const [result] = await this.db.select().from(productsTable).where(whereClause).limit(1)

		return result ?? null
	}

	async findByPriceId(priceId: string): Promise<Product[]> {
		const whereClause = this.organizationId
			? and(
					eq(productsTable.priceId, priceId),
					eq(productsTable.organizationId, this.organizationId),
				)
			: eq(productsTable.priceId, priceId)

		return await this.db.select().from(productsTable).where(whereClause)
	}

	async findByOrganizationId(organizationId: string): Promise<Product[]> {
		return await this.db
			.select()
			.from(productsTable)
			.where(eq(productsTable.organizationId, organizationId))
	}

	async findAll(): Promise<Product[]> {
		if (this.organizationId) {
			return await this.db
				.select()
				.from(productsTable)
				.where(eq(productsTable.organizationId, this.organizationId))
		}

		return await this.db.select().from(productsTable)
	}
}

export const productRepository = (organizationId?: string | null) =>
	new ProductDrizzleRepository(db, organizationId)
