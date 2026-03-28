'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { projectRepository } from '../repository/project-drizzle-repository'
import { projectCreateSchema } from '../schemas'
import type { Project } from '../types'

export async function createProject(
	organizationId: string,
	input: {
		name: string
		slug: string
		spaceId: string
		ownerId: string
		description?: string
	},
): Promise<Result<Project>> {
	const validationResult = projectCreateSchema.safeParse({ ...input, organizationId })

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
		const project = await repo.create(validationResult.data)
		return success(project)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not create the project.',
			type: 'DATABASE_ERROR',
		})
	}
}
