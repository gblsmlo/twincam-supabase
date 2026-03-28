'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { projectRepository } from '../repository/project-drizzle-repository'

export async function deleteProject(
	organizationId: string,
	projectId: string,
): Promise<Result<{ deletedId: string }>> {
	try {
		const repo = projectRepository(organizationId)
		const deletionResult = await repo.delete(projectId)
		return success(deletionResult)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not delete the project.',
			type: 'DATABASE_ERROR',
		})
	}
}
