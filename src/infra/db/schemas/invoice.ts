import { decimal, index, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { organizationsTable } from './organization'
import { subscriptionsTable } from './subscription'

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'open', 'paid', 'void'])

export const invoicesTable = pgTable(
	'invoices',
	{
		_id: uuid('id').primaryKey().defaultRandom(),
		amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
		currency: varchar('currency', { length: 3 }).notNull().default('BRL'),
		dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationsTable._id, { onDelete: 'cascade' }),
		paidAt: timestamp('paid_at', { withTimezone: true }),
		status: invoiceStatusEnum().notNull().default('draft'),
		subscriptionId: uuid('subscription_id')
			.notNull()
			.references(() => subscriptionsTable._id, { onDelete: 'cascade' }),
		...auditFields,
	},
	(table) => [index('idx_invoices_organization_id').on(table.organizationId)],
)
