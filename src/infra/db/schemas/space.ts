import { foreignKey, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'
import { auditFields } from '../helpers'

export const spacesTable = pgTable(
	'spaces',
	{
		_id: uuid('id').primaryKey().defaultRandom(),
		description: text(),
		hierarchyLevel: integer('hierarchy_level').notNull().default(1),
		hierarchyPath: text('hierarchy_path').notNull().default(''),
		name: text().notNull(),
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => authUsers.id, { onDelete: 'cascade' }),
		parentOrganizationId: uuid('parent_organization_id'),
		slug: text().notNull(),
		...auditFields,
	},
	(table) => [
		foreignKey({
			columns: [table.parentOrganizationId],
			foreignColumns: [table._id],
			name: 'spaces_parent_organization_id_fk',
		}).onDelete('restrict'),
		index('idx_spaces_hierarchy_path').on(table.hierarchyPath),
		index('idx_spaces_parent_org_id').on(table.parentOrganizationId),
	],
)
