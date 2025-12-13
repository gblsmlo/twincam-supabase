import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { auditFields } from '../helpers'
import { spacesTable } from './space'

export const projectsTable = pgTable('projects', {
	_id: uuid('id').primaryKey().defaultRandom(),
	description: text(),
	name: text().notNull(),
	ownerId: uuid('owner_id')
		.notNull()
		.references(() => authUsers.id, { onDelete: 'cascade' }),
	slug: text().notNull().unique(),
	spaceId: uuid('space_id')
		.notNull()
		.references(() => spacesTable._id, { onDelete: 'cascade' }),
	...auditFields,
})
