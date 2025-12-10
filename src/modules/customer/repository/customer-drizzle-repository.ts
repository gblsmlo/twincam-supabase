import { customersTable, type Database, db } from '@/infra/db'
import { eq } from 'drizzle-orm'
import type { Customer, CustomerInsert, CustomerUpdate } from '../types'
import type { CustomerRepository } from './customer-repository'

export class CustomerDrizzleRepository implements CustomerRepository {
	constructor(private db: Database) {}

	async create(input: CustomerInsert): Promise<Customer> {
		const [result] = await this.db.insert(customersTable).values(input)

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
			.where(eq(customersTable.id, id))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(customersTable)
			.where(eq(customersTable.id, id))
			.returning({ deletedId: customersTable.id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Customer | null> {
		const [result] = await this.db
			.select()
			.from(customersTable)
			.where(eq(customersTable.id, id))
			.limit(1)

		return result
	}

	async findByEmail(email: string): Promise<Customer | null> {
		const [result] = await this.db
			.select()
			.from(customersTable)
			.where(eq(customersTable.email, email))
			.limit(1)

		return result
	}

	async findBySpaceId(spaceId: string): Promise<Customer[]> {
		const results = await this.db
			.select()
			.from(customersTable)
			.where(eq(customersTable.spaceId, spaceId))

		return results
	}

	async findAllByStatus(status: 'active' | 'inactive'): Promise<Customer[]> {
		const results = await this.db
			.select()
			.from(customersTable)
			.where(eq(customersTable.status, status))

		return results
	}
}

export const customerRepository = () => new CustomerDrizzleRepository(db)
