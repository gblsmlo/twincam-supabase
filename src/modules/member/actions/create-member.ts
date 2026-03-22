'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { memberRepository } from '../repository/member-drizzle-repository'
import { MemberRoleService } from '../services/member-role-service'
import type { Member, MemberRole } from '../types'

type CreateMemberInput = {
	organizationId: string
	role: MemberRole
	spaceId: string
	targetUserId: string
}

type CreateMemberOutput = {
	member: Member
}

export const createMemberAction = async (
	input: CreateMemberInput,
): Promise<Result<CreateMemberOutput>> => {
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

	const result = await service.addMember(user.id, input.spaceId, input.targetUserId, input.role)

	if (!result.success) {
		return result
	}

	return success({ member: result.data })
}
