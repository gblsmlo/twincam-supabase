import { memberInvitationsTable, memberRoleEnum, membersTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const memberRoleType = createSelectSchema(memberRoleEnum)

export const memberSelectSchema = createSelectSchema(membersTable)
export const memberCreateSchema = createInsertSchema(membersTable)
export const memberUpdateSchema = createUpdateSchema(membersTable)

export const memberInvitationSelectSchema = createSelectSchema(memberInvitationsTable)
export const memberInvitationCreateSchema = createInsertSchema(memberInvitationsTable)
export const memberInvitationUpdateSchema = createUpdateSchema(memberInvitationsTable)
