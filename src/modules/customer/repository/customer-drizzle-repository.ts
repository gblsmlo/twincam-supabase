import { customersTable, type Database, db } from '@/infra/db'
import { and, eq } from 'drizzle-orm'
import type { Customer, CustomerInsert, CustomerUpdate } from '../types'
import type { CustomerRepository } from './customer-repository'

export class CustomerDrizzleRepository implements CustomerRepository {
	constructor(
		private db: Database,
		private organizationId: string,
	) {}

	async create(input: CustomerInsert): Promise<Customer> {
		const [result] = await this.db
			.insert(customersTable)
			.values({ ...input, organizationId: this.organizationId })
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
			.where(
				and(eq(customersTable._id, id), eq(customersTable.organizationId, this.organizationId)),
			)

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(customersTable)
			.where(
				and(eq(customersTable._id, id), eq(customersTable.organizationId, this.organizationId)),
			)
			.returning({ deletedId: customersTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Customer | null> {
		const [result] = await this.db
			.select()
			.from(customersTable)
			.where(
				and(eq(customersTable._id, id), eq(customersTable.organizationId, this.organizationId)),
			)
			.limit(1)

		return result ?? null
	}

	async findByEmail(email: string): Promise<Customer | null> {
		const [result] = await this.db
			.select()
			.from(customersTable)
			.where(
				and(
					eq(customersTable.email, email),
					eq(customersTable.organizationId, this.organizationId),
				),
			)
			.limit(1)

		return result ?? null
	}

	async findBySpaceId(spaceId: string): Promise<Customer[]> {
		return await this.db
			.select()
			.from(customersTable)
			.where(
				and(
					eq(customersTable.spaceId, spaceId),
					eq(customersTable.organizationId, this.organizationId),
				),
			)
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
			.where(
				and(
					eq(customersTable.status, status),
					eq(customersTable.organizationId, this.organizationId),
				),
			)
	}
}

export const customerRepository = (organizationId: string) =>
	new CustomerDrizzleRepository(db, organizationId)
