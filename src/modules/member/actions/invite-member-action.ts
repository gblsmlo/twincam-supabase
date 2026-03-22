'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { memberRepository } from '../repository/member-drizzle-repository'
import { memberInvitationRepository } from '../repository/member-invitation-drizzle-repository'
import { MemberInvitationService } from '../services/member-invitation-service'
import type { MemberInvitation, MemberRole } from '../types'

type InviteMemberInput = {
	email: string
	organizationId: string
	role: MemberRole
	spaceId: string
}

type InviteMemberOutput = {
	invitation: MemberInvitation
}

export const inviteMemberAction = async (
	input: InviteMemberInput,
): Promise<Result<InviteMemberOutput>> => {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return failure({
			message: 'Usuário não autenticado.',
			type: 'AUTHORIZATION_ERROR',
		})
	}

	const memberRepo = memberRepository(input.organizationId)
	const invitationRepo = memberInvitationRepository(input.organizationId)
	const service = new MemberInvitationService(memberRepo, invitationRepo)

	const result = await service.invite({
		actorUserId: user.id,
		email: input.email,
		role: input.role,
		spaceId: input.spaceId,
	})

	if (!result.success) {
		return result
	}

	return success({ invitation: result.data })
}
