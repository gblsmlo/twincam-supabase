import type { z } from 'zod'
import type {
	memberCreateSchema,
	memberInvitationCreateSchema,
	memberInvitationSelectSchema,
	memberInvitationUpdateSchema,
	memberRoleType,
	memberSelectSchema,
	memberUpdateSchema,
} from './schemas'

export type Member = z.infer<typeof memberSelectSchema>
export type MemberInsert = z.infer<typeof memberCreateSchema>
export type MemberUpdate = z.infer<typeof memberUpdateSchema>

export type MemberInvitation = z.infer<typeof memberInvitationSelectSchema>
export type MemberInvitationInsert = z.infer<typeof memberInvitationCreateSchema>
export type MemberInvitationUpdate = z.infer<typeof memberInvitationUpdateSchema>

export type MemberRoleType = z.infer<typeof memberRoleType>
