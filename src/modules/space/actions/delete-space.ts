'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { spaceRepository } from '../repository/space-drizzle-repository'

export async function deleteSpaceAction(spaceId: string): Promise<Result<{ deletedId: string }>> {
	try {
		const repo = spaceRepository()
		const deletionResult = await repo.delete(spaceId)
		return success(deletionResult)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not delete the space.',
			type: 'DATABASE_ERROR',
		})
	}
}
