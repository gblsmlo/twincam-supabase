'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { organizationRepository } from '../repository/organization-drizzle-repository'
import type { Organization } from '../types'

export async function findOrganizationBySlugAction(
	slug: string,
): Promise<Result<Organization | null>> {
	try {
		const repo = organizationRepository()
		const organization = await repo.findBySlug(slug)
		return success(organization)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not find the organization.',
			type: 'DATABASE_ERROR',
		})
	}
}
