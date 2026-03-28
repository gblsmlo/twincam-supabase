'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { spaceRepository } from '../repository/space-drizzle-repository'
import type { Space } from '../types'

export async function findSpaceBySlugAction(slug: string): Promise<Result<Space | null>> {
	try {
		const repo = spaceRepository()
		const space = await repo.findBySlug(slug)
		return success(space)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not find the space.',
			type: 'DATABASE_ERROR',
		})
	}
}
