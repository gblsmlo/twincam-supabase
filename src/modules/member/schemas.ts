import { membersTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const memberSelectSchema = createSelectSchema(membersTable)
export const memberCreateSchema = createInsertSchema(membersTable)
export const memberUpdateSchema = createUpdateSchema(membersTable)
