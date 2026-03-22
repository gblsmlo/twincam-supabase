import { spacesTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const spaceSelectSchema = createSelectSchema(spacesTable)
export const spaceCreateSchema = createInsertSchema(spacesTable).omit({
	hierarchyLevel: true,
	hierarchyPath: true,
})
export const spaceCreateFullSchema = createInsertSchema(spacesTable)
export const spaceUpdateSchema = createUpdateSchema(spacesTable).omit({
	hierarchyLevel: true,
	hierarchyPath: true,
})
export const spaceUpdateFullSchema = createUpdateSchema(spacesTable)
