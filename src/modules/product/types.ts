import type { z } from 'zod'
import type { productCreateSchema, productSelectSchema, productUpdateSchema } from './schemas'

export type Product = z.infer<typeof productSelectSchema>
export type ProductInsert = z.infer<typeof productCreateSchema>
export type ProductUpdate = z.infer<typeof productUpdateSchema>
