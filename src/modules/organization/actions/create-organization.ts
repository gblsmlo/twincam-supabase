'use server'

import { createClient } from '@/lib/supabase/server'
import { failure, isFailure, type Result, success } from '@/shared/errors/result'
import { OrganizationFactory } from '../factories/organization-factory'
import { organizationRepository } from '../repository/organization-drizzle-repository'
import type { Organization } from '../types'

type CreateOrganizationInput = {
	name: string
	slug: string
	parentId?: string
}

type CreateOrganizationOutput = {
	organization: Organization
}

export const createOrganizationAction = async (
	input: CreateOrganizationInput,
): Promise<Result<CreateOrganizationOutput>> => {
	try {
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

		const repo = organizationRepository()

		const createResult = await OrganizationFactory.createOrganizationWithValidation(
			{ ...input, ownerId: user.id },
			repo,
		)

		if (isFailure(createResult)) {
			return createResult
		}

		const organization = await repo.create(createResult.data)

		return success({ organization })
	} catch (error) {
		if (error instanceof Error) {
			return failure({
				error: error.name,
				message: error.message || 'Não foi possível criar a organização.',
				type: 'DATABASE_ERROR',
			})
		}

		return failure({
			error: 'Erro desconhecido',
			message: 'Ocorreu um erro inesperado ao criar a organização.',
			type: 'UNKNOWN_ERROR',
		})
	}
}
