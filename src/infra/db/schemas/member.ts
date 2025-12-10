import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { auditFields } from '../helpers'
import { spacesTable } from './space'

export const membersTable = pgTable('members', {
	_id: uuid('id').primaryKey().defaultRandom(),
	role: text().notNull().default('member'),
	spaceId: uuid('space_id')
		.notNull()
		.references(() => spacesTable._id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => authUsers.id, { onDelete: 'cascade' }),
	...auditFields,
})
