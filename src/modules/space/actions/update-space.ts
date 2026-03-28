'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { spaceRepository } from '../repository/space-drizzle-repository'
import { spaceUpdateSchema } from '../schemas'
import type { Space } from '../types'

export async function updateSpaceAction(
	spaceId: string,
	input: {
		name?: string
		slug?: string
	},
): Promise<Result<Space>> {
	const validationResult = spaceUpdateSchema.safeParse(input)

	if (!validationResult.success) {
		return failure({
			details: validationResult.error.issues,
			error: validationResult.error.name,
			message: 'Invalid data. Please check the fields and try again.',
			type: 'VALIDATION_ERROR',
		})
	}

	try {
		const repo = spaceRepository()
		const updatedSpace = await repo.update(spaceId, validationResult.data)

		if (!updatedSpace) {
			return failure({
				message: 'Space not found.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		return success(updatedSpace)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not update the space.',
			type: 'DATABASE_ERROR',
		})
	}
}
