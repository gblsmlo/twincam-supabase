import type { z } from 'zod'
import type { memberCreateSchema, memberSelectSchema, memberUpdateSchema } from './schemas'

export type Member = z.infer<typeof memberSelectSchema>
export type MemberInsert = z.infer<typeof memberCreateSchema>
export type MemberUpdate = z.infer<typeof memberUpdateSchema>
