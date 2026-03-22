import { usersTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const userSelectSchema = createSelectSchema(usersTable)
export const userCreateSchema = createInsertSchema(usersTable)
export const userUpdateSchema = createUpdateSchema(usersTable)
