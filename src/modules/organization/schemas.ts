import { organizationsTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const organizationSelectSchema = createSelectSchema(organizationsTable)
export const organizationCreateSchema = createInsertSchema(organizationsTable).omit({
	hierarchyLevel: true,
	hierarchyPath: true,
})
export const organizationCreateFullSchema = createInsertSchema(organizationsTable)
export const organizationUpdateSchema = createUpdateSchema(organizationsTable).omit({
	hierarchyLevel: true,
	hierarchyPath: true,
})
export const organizationUpdateFullSchema = createUpdateSchema(organizationsTable)
