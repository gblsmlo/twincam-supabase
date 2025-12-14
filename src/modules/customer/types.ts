import type { z } from 'zod'
import type { customerCreateSchema, customerSelectSchema, customerUpdateSchema } from './schemas'

export type Customer = z.infer<typeof customerSelectSchema>
export type CustomerInsert = z.infer<typeof customerCreateSchema>
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>
