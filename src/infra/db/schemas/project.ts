import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { auditFields } from '../helpers'
import { organizationsTable } from './organization'

export const projectsTable = pgTable(
	'projects',
	{
		_id: uuid('id').primaryKey().defaultRandom(),
		description: text(),
		name: text().notNull(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationsTable._id, { onDelete: 'cascade' }),
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => authUsers.id, { onDelete: 'cascade' }),
		slug: text().notNull().unique(),
		spaceId: uuid('space_id')
			.notNull()
			.references(() => organizationsTable._id, { onDelete: 'cascade' }),
		...auditFields,
	},
	(table) => [index('idx_projects_organization_id').on(table.organizationId)],
)
