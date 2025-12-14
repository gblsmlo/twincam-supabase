import type { z } from 'zod'
import type { projectCreateSchema, projectSelectSchema, projectUpdateSchema } from './schemas'

export type Project = z.infer<typeof projectSelectSchema>
export type ProjectInsert = z.infer<typeof projectCreateSchema>
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>
