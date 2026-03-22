import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { auditFields } from '../helpers'

export const usersTable = pgTable(
	'users',
	{
		_id: uuid('id')
			.primaryKey()
			.references(() => authUsers.id, { onDelete: 'cascade' }),
		email: text().notNull().unique(),
		isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
		...auditFields,
	},
	(table) => [
		index('idx_users_email').on(table.email),
		index('idx_users_is_platform_admin').on(table.isPlatformAdmin),
	],
)
