import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { customersTable } from './customer'
import { pricesTable } from './price'

export const subscriptionsTable = pgTable('subscriptions', {
	customerId: uuid('customer_id')
		.notNull()
		.references(() => customersTable.id, { onDelete: 'cascade' }),
	endedAt: timestamp('ended_at', { withTimezone: true }),
	id: uuid('id').primaryKey(),
	planName: text('plan_name').notNull(),
	priceId: uuid('price_id').references(() => pricesTable.id, { onDelete: 'set null' }),
	startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
	status: text('status').notNull().default('active'),
	trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
	...auditFields,
})
