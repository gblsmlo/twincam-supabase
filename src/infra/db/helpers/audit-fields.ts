import { text, timestamp } from 'drizzle-orm/pg-core'

export const auditFields = {
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.$onUpdate(() => new Date())
		.notNull(),
}

export const auditFieldsWithDeletedAt = {
	...auditFields,
	deletedAt: timestamp('deleted_at', { withTimezone: true }),
}

export const auditFieldsWithDeletedAtAndCreatedBy = {
	...auditFieldsWithDeletedAt,
	createdBy: text('created_by').notNull(),
}

export const auditFieldsWithDeletedAtAndCreatedByAndUpdatedBy = {
	...auditFieldsWithDeletedAtAndCreatedBy,
	updatedBy: text('updated_by').notNull(),
}
