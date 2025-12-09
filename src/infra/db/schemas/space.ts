import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'

export const spacesTable = pgTable('spaces', {
	description: text(),
	id: uuid().primaryKey(),
	name: text().notNull(),
	ownerId: uuid()
		.notNull()
		.references(() => authUsers.id, { onDelete: 'cascade' }),
	slug: text().notNull(),
})
