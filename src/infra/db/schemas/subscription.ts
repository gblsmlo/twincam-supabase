import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { customersTable } from './customer'
import { pricesTable } from './price'

export const subscriptionsTable = pgTable('subscriptions', {
	_id: uuid('id').primaryKey().defaultRandom(),
	customerId: uuid('customer_id')
		.notNull()
		.references(() => customersTable._id, { onDelete: 'cascade' }),
	finishedAt: timestamp('finished_at', { withTimezone: true }),
	planName: text('plan_name').notNull(),
	priceId: uuid('price_id').references(() => pricesTable._id, { onDelete: 'set null' }),
	startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
	status: text('status').notNull().default('active'),
	trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
	...auditFields,
})
