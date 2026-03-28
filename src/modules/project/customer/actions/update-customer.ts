'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { customerRepository } from '../repository/customer-drizzle-repository'
import { customerUpdateSchema } from '../schemas'
import type { Customer } from '../types'

export async function updateCustomer(
	organizationId: string,
	customerId: string,
	input: {
		email?: string
		name?: string
		status?: 'active' | 'inactive'
	},
): Promise<Result<Customer>> {
	const validationResult = customerUpdateSchema.safeParse(input)

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
		const updatedCustomer = await repo.update(customerId, validationResult.data)

		if (!updatedCustomer) {
			return failure({
				message: 'Customer not found.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		return success(updatedCustomer)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not update the customer.',
			type: 'DATABASE_ERROR',
		})
	}
}
