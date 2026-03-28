import { invoicesTable } from '@/infra/db'
import { Specification } from '@/shared/patterns/specification'
import { eq, gte, lt, ne, sql } from 'drizzle-orm'
import type { Invoice } from '../types'

export class InvoiceSpecification extends Specification<Invoice> {
	static isOpen(): InvoiceSpecification {
		return new InvoiceSpecification().addCondition(eq(invoicesTable.status, 'open'))
	}

	static isPaid(): InvoiceSpecification {
		return new InvoiceSpecification().addCondition(eq(invoicesTable.status, 'paid'))
	}

	static isOverdue(): InvoiceSpecification {
		return new InvoiceSpecification()
			.addCondition(ne(invoicesTable.status, 'paid'))
			.addCondition(lt(invoicesTable.dueDate, sql`now()`))
	}

	static isOverdueBy(days: number): InvoiceSpecification {
		return new InvoiceSpecification().addCondition(
			lt(invoicesTable.dueDate, sql`now() - interval '${sql.raw(String(days))} days'`),
		)
	}

	static isDueWithin(days: number): InvoiceSpecification {
		return new InvoiceSpecification()
			.addCondition(gte(invoicesTable.dueDate, sql`now()`))
			.addCondition(
				lt(invoicesTable.dueDate, sql`now() + interval '${sql.raw(String(days))} days'`),
			)
	}

	static isPaidSince(days: number): InvoiceSpecification {
		return new InvoiceSpecification().addCondition(
			gte(invoicesTable.paidAt, sql`now() - interval '${sql.raw(String(days))} days'`),
		)
	}

	static findOverdueBy30Days(): InvoiceSpecification {
		return InvoiceSpecification.isOpen().andSpec(InvoiceSpecification.isOverdueBy(30))
	}

	static findUpcomingDue7Days(): InvoiceSpecification {
		return InvoiceSpecification.isOpen().andSpec(InvoiceSpecification.isDueWithin(7))
	}
}
