import { projectsTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const projectSelectSchema = createSelectSchema(projectsTable)
export const projectCreateSchema = createInsertSchema(projectsTable)
export const projectUpdateSchema = createUpdateSchema(projectsTable)
