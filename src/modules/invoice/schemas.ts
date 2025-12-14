import { invoicesTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const invoiceSelectSchema = createSelectSchema(invoicesTable)
export const invoiceCreateSchema = createInsertSchema(invoicesTable)
export const invoiceUpdateSchema = createUpdateSchema(invoicesTable)
