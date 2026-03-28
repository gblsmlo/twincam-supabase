import { db, invoicesTable } from '@/infra/db'
import { BaseRepository } from '@/infra/repositories'
import { eq } from 'drizzle-orm'
import { InvoiceSpecification } from '../specifications/invoice-specification'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types'
import type { InvoiceRepository } from './invoice-repository'

export class InvoiceDrizzleRepository extends BaseRepository implements InvoiceRepository {
	async create(input: InvoiceInsert): Promise<Invoice> {
		const [result] = await this.db.insert(invoicesTable).values(this.injectOrgId(input)).returning()

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
			.where(this.withOrgFilter(invoicesTable.organizationId, eq(invoicesTable._id, id)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(invoicesTable)
			.where(this.withOrgFilter(invoicesTable.organizationId, eq(invoicesTable._id, id)))
			.returning({ deletedId: invoicesTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Invoice | null> {
		const [result] = await this.db
			.select()
			.from(invoicesTable)
			.where(this.withOrgFilter(invoicesTable.organizationId, eq(invoicesTable._id, id)))
			.limit(1)

		return result ?? null
	}

	async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
		return await this.db
			.select()
			.from(invoicesTable)
			.where(
				this.withOrgFilter(
					invoicesTable.organizationId,
					eq(invoicesTable.subscriptionId, subscriptionId),
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
		return this.findBySpecification(InvoiceSpecification.isOverdue())
	}

	async findBySpecification(spec: InvoiceSpecification): Promise<Invoice[]> {
		return await this.db
			.select()
			.from(invoicesTable)
			.where(this.withOrgFilter(invoicesTable.organizationId, spec.toWhereClause()))
	}
}

export const invoiceRepository = (organizationId: string) =>
	new InvoiceDrizzleRepository(organizationId, db)
