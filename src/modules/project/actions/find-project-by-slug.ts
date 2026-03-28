'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { projectRepository } from '../repository/project-drizzle-repository'
import type { Project } from '../types'

export async function findProjectBySlug(
	organizationId: string,
	slug: string,
): Promise<Result<Project | null>> {
	try {
		const repo = projectRepository(organizationId)
		const project = await repo.findBySlug(slug)
		return success(project)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not find the project.',
			type: 'DATABASE_ERROR',
		})
	}
}
