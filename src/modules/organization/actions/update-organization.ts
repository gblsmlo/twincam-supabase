'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { organizationRepository } from '../repository/organization-drizzle-repository'
import { organizationUpdateSchema } from '../schemas'
import type { Organization } from '../types'

export async function updateOrganizationAction(
	organizationId: string,
	input: {
		name?: string
		slug?: string
	},
): Promise<Result<Organization>> {
	const validationResult = organizationUpdateSchema.safeParse(input)

	if (!validationResult.success) {
		return failure({
			details: validationResult.error.issues,
			error: validationResult.error.name,
			message: 'Invalid data. Please check the fields and try again.',
			type: 'VALIDATION_ERROR',
		})
	}

	try {
		const repo = organizationRepository()
		const updatedOrganization = await repo.update(organizationId, validationResult.data)

		if (!updatedOrganization) {
			return failure({
				message: 'Organization not found.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		return success(updatedOrganization)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not update the organization.',
			type: 'DATABASE_ERROR',
		})
	}
}
