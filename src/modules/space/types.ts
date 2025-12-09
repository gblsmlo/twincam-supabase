import type { z } from 'zod'
import type { spaceCreateSchema, spaceSelectSchema, spaceUpdateSchema } from './schemas'

export type Space = z.infer<typeof spaceSelectSchema>
export type SpaceInsert = z.infer<typeof spaceCreateSchema>
export type SpaceUpdate = z.infer<typeof spaceUpdateSchema>
