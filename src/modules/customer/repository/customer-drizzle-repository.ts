import { customersTable, db } from '@/infra/db'
import { BaseRepository } from '@/infra/repositories'
import { eq } from 'drizzle-orm'
import type { Customer, CustomerInsert, CustomerUpdate } from '../types'
import type { CustomerRepository } from './customer-repository'

export class CustomerDrizzleRepository extends BaseRepository implements CustomerRepository {
	async create(input: CustomerInsert): Promise<Customer> {
		const [result] = await this.db
			.insert(customersTable)
			.values(this.injectOrgId(input))
			.returning()

		return result
	}

	async update(id: string, input: CustomerUpdate): Promise<Customer> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db
			.update(customersTable)
			.set(update)
			.where(this.withOrgFilter(customersTable.organizationId, eq(customersTable._id, id)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(customersTable)
			.where(this.withOrgFilter(customersTable.organizationId, eq(customersTable._id, id)))
			.returning({ deletedId: customersTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Customer | null> {
		const [result] = await this.db
			.select()
			.from(customersTable)
			.where(this.withOrgFilter(customersTable.organizationId, eq(customersTable._id, id)))
			.limit(1)

		return result ?? null
	}

	async findByEmail(email: string): Promise<Customer | null> {
		const [result] = await this.db
			.select()
			.from(customersTable)
			.where(this.withOrgFilter(customersTable.organizationId, eq(customersTable.email, email)))
			.limit(1)

		return result ?? null
	}

	async findBySpaceId(spaceId: string): Promise<Customer[]> {
		return await this.db
			.select()
			.from(customersTable)
			.where(this.withOrgFilter(customersTable.organizationId, eq(customersTable.spaceId, spaceId)))
	}

	async findByOrganizationId(organizationId: string): Promise<Customer[]> {
		return await this.db
			.select()
			.from(customersTable)
			.where(eq(customersTable.organizationId, organizationId))
	}

	async findAllByStatus(status: 'active' | 'inactive'): Promise<Customer[]> {
		return await this.db
			.select()
			.from(customersTable)
			.where(this.withOrgFilter(customersTable.organizationId, eq(customersTable.status, status)))
	}
}

export const customerRepository = (organizationId: string) =>
	new CustomerDrizzleRepository(organizationId, db)
