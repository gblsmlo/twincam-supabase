'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { memberRepository } from '../repository/member-drizzle-repository'
import { MemberRoleService } from '../services/member-role-service'

type DeleteMemberInput = {
	memberId: string
	organizationId: string
	spaceId: string
}

type DeleteMemberOutput = {
	deletedId: string
}

export const deleteMemberAction = async (
	input: DeleteMemberInput,
): Promise<Result<DeleteMemberOutput>> => {
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

	const repo = memberRepository(input.organizationId)
	const service = new MemberRoleService(repo)

	const result = await service.removeMember(user.id, input.spaceId, input.memberId)

	if (!result.success) {
		return result
	}

	return success({ deletedId: result.data.deletedId })
}
