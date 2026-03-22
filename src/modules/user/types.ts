import type { z } from 'zod'
import type { userCreateSchema, userSelectSchema, userUpdateSchema } from './schemas'

export type User = z.infer<typeof userSelectSchema>
export type UserInsert = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
