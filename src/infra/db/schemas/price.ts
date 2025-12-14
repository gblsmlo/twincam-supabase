import { decimal, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'

export const pricesTable = pgTable('prices', {
	_id: uuid('id').primaryKey().defaultRandom(),
	amount: decimal('amount', { precision: 10, scale: 2 }).unique().notNull(),
	currency: varchar('currency', { length: 3 }).notNull().default('BRL'),
	...auditFields,
})
