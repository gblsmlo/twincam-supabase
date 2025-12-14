import { customersTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const customerSelectSchema = createSelectSchema(customersTable)
export const customerCreateSchema = createInsertSchema(customersTable)
export const customerUpdateSchema = createUpdateSchema(customersTable)
