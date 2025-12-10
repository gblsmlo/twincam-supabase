import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { spacesTable } from './space'

export const customerStatusEnum = pgEnum('customer_status', ['active', 'inactive'])

export const customersTable = pgTable('customers', {
	email: text().notNull(),
	id: uuid().primaryKey(),
	name: text().notNull(),
	spaceId: uuid()
		.notNull()
		.references(() => spacesTable.id, { onDelete: 'cascade' }),
	status: customerStatusEnum().notNull().default('active'),
	...auditFields,
})
