import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { auditFields } from '../helpers'
import { user } from './user'

export const session = pgTable('session', {
	expiresAt: timestamp('expires_at').notNull(),
	id: text('id')
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	ipAddress: text('ip_address'),
	token: text('token').notNull().unique(),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	...auditFields,
})
