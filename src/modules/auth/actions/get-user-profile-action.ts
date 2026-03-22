'use server'

import { createClient } from '@/lib/supabase/server'
import { userRepository } from '@/modules/user'
import { failure, type Result, success } from '@/shared/errors/result'

type Output = {
	isPlatformAdmin: boolean
}

export const getUserProfileAction = async (): Promise<Result<Output>> => {
	try {
		const supabase = await createClient()
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser()

		if (!authUser) {
			return failure({
				message: 'Usuário não autenticado.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		const domainUser = await userRepository().findById(authUser.id)

		return success({
			isPlatformAdmin: domainUser?.isPlatformAdmin ?? false,
		})
	} catch (error) {
		return failure({
			message: 'Falha ao buscar perfil do usuário.',
			type: 'UNKNOWN_ERROR',
		})
	}
}
