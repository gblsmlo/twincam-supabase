import { productsTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const productSelectSchema = createSelectSchema(productsTable)
export const productCreateSchema = createInsertSchema(productsTable)
export const productUpdateSchema = createUpdateSchema(productsTable)
