'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { memberRepository } from '../repository/member-drizzle-repository'
import { memberInvitationRepository } from '../repository/member-invitation-drizzle-repository'
import { MemberInvitationService } from '../services/member-invitation-service'
import type { Member } from '../types'

type AcceptInvitationInput = {
	invitationId: string
	organizationId: string
}

type AcceptInvitationOutput = {
	member: Member
}

export const acceptInvitationAction = async (
	input: AcceptInvitationInput,
): Promise<Result<AcceptInvitationOutput>> => {
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

	const result = await service.accept(input.invitationId, user.id)

	if (!result.success) {
		return result
	}

	return success({ member: result.data })
}
