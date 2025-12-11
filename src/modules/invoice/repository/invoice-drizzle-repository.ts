import { type Database, db, invoicesTable, subscriptionsTable } from '@/infra/db'
import { and, desc, eq, lt, ne } from 'drizzle-orm'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types'
import type { InvoiceRepository } from './invoice-repository'

export class InvoiceDrizzleRepository implements InvoiceRepository {
	constructor(private db: Database) {}

	async create(input: InvoiceInsert): Promise<Invoice> {
		const [result] = await this.db.insert(invoicesTable).values(input)

		return result
	}

	async update(id: string, input: InvoiceUpdate): Promise<Invoice> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db
			.update(invoicesTable)
			.set(update)
			.where(eq(invoicesTable._id, id))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(invoicesTable)
			.where(eq(invoicesTable._id, id))
			.returning({ deletedId: invoicesTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Invoice | null> {
		const [result] = await this.db
			.select()
			.from(invoicesTable)
			.where(eq(invoicesTable._id, id))
			.limit(1)

		return result
	}

	async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
		const results = await this.db
			.select()
			.from(invoicesTable)
			.where(eq(invoicesTable.subscriptionId, subscriptionId))

		return results
	}

	async findOverdue(): Promise<Invoice[]> {
		const now = new Date()

		const results = await this.db
			.select()
			.from(invoicesTable)
			.where(and(ne(invoicesTable.status, 'paid'), lt(invoicesTable.dueDate, now)))

		return results
	}

	async findLatestByCustomerId(customerId: string): Promise<Invoice | null> {
		const [result] = await this.db
			.select({
				amount: invoicesTable.amount,
				createdAt: invoicesTable.createdAt,
				currency: invoicesTable.currency,
				dueDate: invoicesTable.dueDate,
				id: invoicesTable._id,
				paidAt: invoicesTable.paidAt,
				status: invoicesTable.status,
				subscriptionId: invoicesTable.subscriptionId,
				updatedAt: invoicesTable.updatedAt,
			})
			.from(invoicesTable)
			.innerJoin(subscriptionsTable, eq(invoicesTable.subscriptionId, subscriptionsTable._id))
			.where(eq(subscriptionsTable.customerId, customerId))
			.orderBy(desc(invoicesTable.createdAt))
			.limit(1)

		return result
	}
}

export const invoiceRepository = () => new InvoiceDrizzleRepository(db)
