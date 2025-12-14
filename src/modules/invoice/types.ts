import type { z } from 'zod'
import type { invoiceCreateSchema, invoiceSelectSchema, invoiceUpdateSchema } from './schemas'

export type Invoice = z.infer<typeof invoiceSelectSchema>
export type InvoiceInsert = z.infer<typeof invoiceCreateSchema>
export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>
