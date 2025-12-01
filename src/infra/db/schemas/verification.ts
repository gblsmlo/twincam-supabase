import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { auditFields } from '../helpers'

export const verification = pgTable('verification', {
	expiresAt: timestamp('expires_at').notNull(),
	id: text('id')
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	...auditFields,
})
