'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { projectRepository } from '../repository/project-drizzle-repository'
import { projectUpdateSchema } from '../schemas'
import type { Project } from '../types'

export async function updateProject(
	organizationId: string,
	projectId: string,
	input: {
		name?: string
		slug?: string
		description?: string
	},
): Promise<Result<Project>> {
	const validationResult = projectUpdateSchema.safeParse(input)

	if (!validationResult.success) {
		return failure({
			details: validationResult.error.issues,
			error: validationResult.error.name,
			message: 'Invalid data. Please check the fields and try again.',
			type: 'VALIDATION_ERROR',
		})
	}

	try {
		const repo = projectRepository(organizationId)
		const updatedProject = await repo.update(projectId, validationResult.data)

		if (!updatedProject) {
			return failure({
				message: 'Project not found.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		return success(updatedProject)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not update the project.',
			type: 'DATABASE_ERROR',
		})
	}
}
