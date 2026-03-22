'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { memberRepository } from '../repository/member-drizzle-repository'
import { memberInvitationRepository } from '../repository/member-invitation-drizzle-repository'
import { MemberInvitationService } from '../services/member-invitation-service'

type RejectInvitationInput = {
	invitationId: string
	organizationId: string
}

type RejectInvitationOutput = {
	deletedId: string
}

export const rejectInvitationAction = async (
	input: RejectInvitationInput,
): Promise<Result<RejectInvitationOutput>> => {
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

	const result = await service.reject(input.invitationId)

	if (!result.success) {
		return result
	}

	return success({ deletedId: result.data.deletedId })
}
