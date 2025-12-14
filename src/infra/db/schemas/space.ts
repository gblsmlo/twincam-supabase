import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { auditFields } from '../helpers'

export const spacesTable = pgTable('spaces', {
	_id: uuid('id').primaryKey().defaultRandom(),
	description: text(),
	name: text().notNull(),
	ownerId: uuid('owner_id')
		.notNull()
		.references(() => authUsers.id, { onDelete: 'cascade' }),
	slug: text().notNull(),
	...auditFields,
})
