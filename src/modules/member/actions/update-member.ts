'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { memberRepository } from '../repository/member-drizzle-repository'
import { MemberRoleService } from '../services/member-role-service'
import type { Member, MemberRole } from '../types'

type UpdateMemberRoleInput = {
	memberId: string
	newRole: MemberRole
	organizationId: string
	spaceId: string
}

type UpdateMemberRoleOutput = {
	member: Member
}

export const updateMemberRoleAction = async (
	input: UpdateMemberRoleInput,
): Promise<Result<UpdateMemberRoleOutput>> => {
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

	const result = await service.updateRole({
		actorUserId: user.id,
		newRole: input.newRole,
		spaceId: input.spaceId,
		targetMemberId: input.memberId,
	})

	if (!result.success) {
		return result
	}

	return success({ member: result.data })
}
