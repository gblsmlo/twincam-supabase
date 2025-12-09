import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { spacesTable } from './space'

export const projectsTable = pgTable('projects', {
	description: text(),
	id: uuid().primaryKey(),
	name: text().notNull(),
	ownerId: uuid()
		.notNull()
		.references(() => authUsers.id, { onDelete: 'cascade' }),
	slug: text().notNull().unique(),
	spaceId: uuid()
		.notNull()
		.references(() => spacesTable.id, { onDelete: 'cascade' }),
})
