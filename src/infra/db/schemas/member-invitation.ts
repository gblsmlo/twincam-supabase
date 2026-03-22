import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { memberRoleEnum } from './member'
import { spacesTable } from './space'

export const memberInvitationsTable = pgTable(
	'member_invitations',
	{
		_id: uuid('id').primaryKey().defaultRandom(),
		acceptedAt: timestamp('accepted_at', { withTimezone: true }),
		email: text().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => spacesTable._id, { onDelete: 'cascade' }),
		role: memberRoleEnum('role').notNull().default('MEMBER'),
		spaceId: uuid('space_id')
			.notNull()
			.references(() => spacesTable._id, { onDelete: 'cascade' }),
		token: text().notNull().unique(),
		...auditFields,
	},
	(table) => [
		index('idx_member_invitations_organization_id').on(table.organizationId),
		index('idx_member_invitations_token').on(table.token),
		unique('uq_member_invitations_space_email').on(table.spaceId, table.email),
	],
)
