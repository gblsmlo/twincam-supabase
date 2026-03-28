'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { customerRepository } from '../repository/customer-drizzle-repository'
import { customerCreateSchema } from '../schemas'
import type { Customer } from '../types'

export async function createCustomer(
	organizationId: string,
	input: {
		email: string
		name: string
		spaceId: string
	},
): Promise<Result<Customer>> {
	const validationResult = customerCreateSchema.safeParse({ ...input, organizationId })

	if (!validationResult.success) {
		return failure({
			details: validationResult.error.issues,
			error: validationResult.error.name,
			message: 'Invalid data. Please check the fields and try again.',
			type: 'VALIDATION_ERROR',
		})
	}

	try {
		const repo = customerRepository(organizationId)
		const customer = await repo.create(validationResult.data)
		return success(customer)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not create the customer.',
			type: 'DATABASE_ERROR',
		})
	}
}
