'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { customerRepository } from '../repository/customer-drizzle-repository'

export async function deleteCustomer(
	organizationId: string,
	customerId: string,
): Promise<Result<{ deletedId: string }>> {
	try {
		const repo = customerRepository(organizationId)
		const result = await repo.delete(customerId)
		return success(result)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Erro desconhecido',
			message: 'Não foi possível remover o cliente.',
			type: 'DATABASE_ERROR',
		})
	}
}
