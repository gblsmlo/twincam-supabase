import { decimal, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { subscriptionsTable } from './subscription'

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'open', 'paid', 'void'])

export const invoicesTable = pgTable('invoices', {
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	currency: varchar('currency', { length: 3 }).notNull().default('BRL'),
	dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
	id: uuid().primaryKey(),
	paidAt: timestamp('paid_at', { withTimezone: true }),
	status: invoiceStatusEnum().notNull().default('draft'),
	subscriptionId: uuid()
		.notNull()
		.references(() => subscriptionsTable.id, { onDelete: 'cascade' }),
	...auditFields,
})
