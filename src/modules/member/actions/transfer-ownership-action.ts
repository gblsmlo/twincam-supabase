'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, type Result, success } from '@/shared/errors/result'
import { memberRepository } from '../repository/member-drizzle-repository'
import { MemberRoleService } from '../services/member-role-service'
import type { Member } from '../types'

type TransferOwnershipInput = {
	newOwnerMemberId: string
	organizationId: string
	spaceId: string
}

type TransferOwnershipOutput = {
	newOwner: Member
	previousOwner: Member
}

export const transferOwnershipAction = async (
	input: TransferOwnershipInput,
): Promise<Result<TransferOwnershipOutput>> => {
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

	const result = await service.transferOwnership(user.id, input.spaceId, input.newOwnerMemberId)

	if (!result.success) {
		return result
	}

	return success(result.data)
}
