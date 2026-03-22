'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { z } from 'zod'
import { memberRepository } from '../repository/member-drizzle-repository'
import { memberInvitationRepository } from '../repository/member-invitation-drizzle-repository'
import { MemberInvitationService } from '../services/member-invitation-service'
import type { Member } from '../types'

const acceptInvitationSchema = z.object({
	invitationId: z.string().min(1),
	organizationId: z.string().min(1),
})

type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>

type AcceptInvitationOutput = {
	member: Member
}

export const acceptInvitationAction = async (
	input: AcceptInvitationInput,
): Promise<Result<AcceptInvitationOutput>> => {
	const parsed = acceptInvitationSchema.safeParse(input)

	if (!parsed.success) {
		return failure({
			details: parsed.error.issues,
			error: parsed.error.name,
			message: 'Dados inválidos. Verifique os campos e tente novamente.',
			type: 'VALIDATION_ERROR',
		})
	}

	const { invitationId, organizationId } = parsed.data

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

	const memberRepo = memberRepository(organizationId)
	const invitationRepo = memberInvitationRepository(organizationId)
	const service = new MemberInvitationService(memberRepo, invitationRepo)

	const result = await service.accept({ invitationId, userId: user.id })

	if (!result.success) {
		return result
	}

	return success({ member: result.data })
}
