import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { auditFields } from '../helpers'
import { spacesTable } from './space'

export const membersTable = pgTable('members', {
	id: uuid().primaryKey(),
	role: text().notNull().default('member'),
	spaceId: uuid()
		.notNull()
		.references(() => spacesTable.id, { onDelete: 'cascade' }),
	userId: uuid()
		.notNull()
		.references(() => authUsers.id, { onDelete: 'cascade' }),
	...auditFields,
})
