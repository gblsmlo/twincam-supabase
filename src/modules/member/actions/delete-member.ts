'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { z } from 'zod'
import { memberRepository } from '../repository/member-drizzle-repository'
import { MemberRoleService } from '../services/member-role-service'

const deleteMemberSchema = z.object({
	memberId: z.string().min(1),
	organizationId: z.string().min(1),
	spaceId: z.string().min(1),
})

type DeleteMemberInput = z.infer<typeof deleteMemberSchema>

type DeleteMemberOutput = {
	deletedId: string
}

export const deleteMemberAction = async (
	input: DeleteMemberInput,
): Promise<Result<DeleteMemberOutput>> => {
	const parsed = deleteMemberSchema.safeParse(input)

	if (!parsed.success) {
		return failure({
			details: parsed.error.issues,
			error: parsed.error.name,
			message: 'Dados inválidos. Verifique os campos e tente novamente.',
			type: 'VALIDATION_ERROR',
		})
	}

	const { memberId, organizationId, spaceId } = parsed.data

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

	const repo = memberRepository(organizationId)
	const service = new MemberRoleService(repo)

	const result = await service.removeMember({
		actorUserId: user.id,
		spaceId,
		targetMemberId: memberId,
	})

	if (!result.success) {
		return result
	}

	return success({ deletedId: result.data.deletedId })
}
