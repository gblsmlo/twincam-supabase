import { type Database, db, invoicesTable, subscriptionsTable } from '@/infra/db'
import { and, desc, eq, lt, ne } from 'drizzle-orm'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types'
import type { InvoiceRepository } from './invoice-repository'

export class InvoiceDrizzleRepository implements InvoiceRepository {
	constructor(
		private db: Database,
		private organizationId: string,
	) {}

	async create(input: InvoiceInsert): Promise<Invoice> {
		const [result] = await this.db
			.insert(invoicesTable)
			.values({ ...input, organizationId: this.organizationId })
			.returning()

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
			.where(and(eq(invoicesTable._id, id), eq(invoicesTable.organizationId, this.organizationId)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(invoicesTable)
			.where(and(eq(invoicesTable._id, id), eq(invoicesTable.organizationId, this.organizationId)))
			.returning({ deletedId: invoicesTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Invoice | null> {
		const [result] = await this.db
			.select()
			.from(invoicesTable)
			.where(and(eq(invoicesTable._id, id), eq(invoicesTable.organizationId, this.organizationId)))
			.limit(1)

		return result ?? null
	}

	async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
		return await this.db
			.select()
			.from(invoicesTable)
			.where(
				and(
					eq(invoicesTable.subscriptionId, subscriptionId),
					eq(invoicesTable.organizationId, this.organizationId),
				),
			)
	}

	async findByOrganizationId(organizationId: string): Promise<Invoice[]> {
		return await this.db
			.select()
			.from(invoicesTable)
			.where(eq(invoicesTable.organizationId, organizationId))
	}

	async findOverdue(): Promise<Invoice[]> {
		const now = new Date()

		return await this.db
			.select()
			.from(invoicesTable)
			.where(
				and(
					ne(invoicesTable.status, 'paid'),
					lt(invoicesTable.dueDate, now),
					eq(invoicesTable.organizationId, this.organizationId),
				),
			)
	}

	async findLatestByCustomerId(customerId: string): Promise<Invoice | null> {
		const [result] = await this.db
			.select({
				_id: invoicesTable._id,
				amount: invoicesTable.amount,
				createdAt: invoicesTable.createdAt,
				currency: invoicesTable.currency,
				dueDate: invoicesTable.dueDate,
				organizationId: invoicesTable.organizationId,
				paidAt: invoicesTable.paidAt,
				status: invoicesTable.status,
				subscriptionId: invoicesTable.subscriptionId,
				updatedAt: invoicesTable.updatedAt,
			})
			.from(invoicesTable)
			.innerJoin(subscriptionsTable, eq(invoicesTable.subscriptionId, subscriptionsTable._id))
			.where(
				and(
					eq(subscriptionsTable.customerId, customerId),
					eq(invoicesTable.organizationId, this.organizationId),
				),
			)
			.orderBy(desc(invoicesTable.createdAt))
			.limit(1)

		return result ?? null
	}
}

export const invoiceRepository = (organizationId: string) =>
	new InvoiceDrizzleRepository(db, organizationId)
