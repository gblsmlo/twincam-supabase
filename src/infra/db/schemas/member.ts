import { index, pgEnum, pgTable, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { auditFields } from '../helpers'
import { spacesTable } from './space'

export const memberRoleEnum = pgEnum('member_role', ['admin', 'member', 'owner'])

export const membersTable = pgTable(
	'members',
	{
		_id: uuid('id').primaryKey().defaultRandom(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => spacesTable._id, { onDelete: 'cascade' }),
		role: memberRoleEnum('role').notNull().default('member'),
		spaceId: uuid('space_id')
			.notNull()
			.references(() => spacesTable._id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => authUsers.id, { onDelete: 'cascade' }),
		...auditFields,
	},
	(table) => [index('idx_members_organization_id').on(table.organizationId)],
)
