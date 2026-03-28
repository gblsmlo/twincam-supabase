'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { customerRepository } from '../repository/customer-drizzle-repository'

export async function deleteCustomer(
	organizationId: string,
	customerId: string,
): Promise<Result<{ deletedId: string }>> {
	try {
		const repo = customerRepository(organizationId)
		const deletionResult = await repo.delete(customerId)
		return success(deletionResult)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Could not delete the customer.',
			type: 'DATABASE_ERROR',
		})
	}
}
