import type { z } from 'zod'
import type {
	spaceCreateFullSchema,
	spaceCreateSchema,
	spaceSelectSchema,
	spaceUpdateSchema,
} from './schemas'

export type Space = z.infer<typeof spaceSelectSchema>
export type SpaceInsert = z.infer<typeof spaceCreateSchema>
export type SpaceInsertFull = z.infer<typeof spaceCreateFullSchema>
export type SpaceUpdate = z.infer<typeof spaceUpdateSchema>
