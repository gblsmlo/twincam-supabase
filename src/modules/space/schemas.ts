import { spacesTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const spaceSelectSchema = createSelectSchema(spacesTable)
export const spaceCreateSchema = createInsertSchema(spacesTable)
export const spaceUpdateSchema = createUpdateSchema(spacesTable)
