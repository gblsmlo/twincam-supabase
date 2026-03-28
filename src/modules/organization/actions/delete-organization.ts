'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { organizationRepository } from '../repository/organization-drizzle-repository'

export async function deleteOrganizationAction(
	organizationId: string,
): Promise<Result<{ deletedId: string }>> {
	try {
		const repo = organizationRepository()
		const deletionResult = await repo.delete(organizationId)
		return success(deletionResult)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not delete the organization.',
			type: 'DATABASE_ERROR',
		})
	}
}
