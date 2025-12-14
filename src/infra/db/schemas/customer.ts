import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { spacesTable } from './space'

export const customerStatusEnum = pgEnum('customer_status', ['active', 'inactive'])

export const customersTable = pgTable('customers', {
	_id: uuid('id').primaryKey().defaultRandom(),
	email: text().notNull(),
	name: text('').notNull(),
	spaceId: uuid()
		.notNull()
		.references(() => spacesTable._id, { onDelete: 'cascade' }),
	status: customerStatusEnum().notNull().default('active'),
	...auditFields,
})
