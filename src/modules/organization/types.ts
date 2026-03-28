import type { z } from 'zod'
import type {
	organizationCreateFullSchema,
	organizationCreateSchema,
	organizationSelectSchema,
	organizationUpdateFullSchema,
	organizationUpdateSchema,
} from './schemas'

export type Organization = z.infer<typeof organizationSelectSchema>
export type OrganizationInsert = z.infer<typeof organizationCreateSchema>
export type OrganizationInsertFull = z.infer<typeof organizationCreateFullSchema>
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>
export type OrganizationUpdateFull = z.infer<typeof organizationUpdateFullSchema>
