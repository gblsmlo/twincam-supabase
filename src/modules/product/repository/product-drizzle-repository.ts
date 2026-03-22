import { db, productsTable } from '@/infra/db'
import { BaseRepository } from '@/infra/repositories'
import { eq } from 'drizzle-orm'
import type { Product, ProductInsert, ProductUpdate } from '../types'
import type { ProductRepository } from './product-repository'

export class ProductDrizzleRepository extends BaseRepository implements ProductRepository {
	async create(input: ProductInsert): Promise<Product> {
		const [result] = await this.db.insert(productsTable).values(this.injectOrgId(input)).returning()

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
			.where(this.withOrgFilter(productsTable.organizationId, eq(productsTable._id, id)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(productsTable)
			.where(this.withOrgFilter(productsTable.organizationId, eq(productsTable._id, id)))
			.returning({ deletedId: productsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Product | null> {
		const [result] = await this.db
			.select()
			.from(productsTable)
			.where(this.withOrgFilter(productsTable.organizationId, eq(productsTable._id, id)))
			.limit(1)

		return result ?? null
	}

	async findByPriceId(priceId: string): Promise<Product[]> {
		return await this.db
			.select()
			.from(productsTable)
			.where(this.withOrgFilter(productsTable.organizationId, eq(productsTable.priceId, priceId)))
	}

	async findByOrganizationId(organizationId: string): Promise<Product[]> {
		return await this.db
			.select()
			.from(productsTable)
			.where(eq(productsTable.organizationId, organizationId))
	}

	async findAll(): Promise<Product[]> {
		return await this.db
			.select()
			.from(productsTable)
			.where(eq(productsTable.organizationId, this.organizationId))
	}
}

export const productRepository = (organizationId: string) =>
	new ProductDrizzleRepository(organizationId, db)
