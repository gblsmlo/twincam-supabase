import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { auditFields } from '../helpers'
import { user } from './user'

export const account = pgTable('account', {
	accessToken: text('access_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	accountId: text('account_id').notNull(),
	id: text('id')
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	idToken: text('id_token'),
	password: text('password'),
	providerId: text('provider_id').notNull(),
	refreshToken: text('refresh_token'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	...auditFields,
})
