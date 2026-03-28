'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { customerRepository } from '../repository/customer-drizzle-repository'
import type { Customer } from '../types'

export async function findCustomerByEmail(
	organizationId: string,
	email: string,
): Promise<Result<Customer | null>> {
	try {
		const repo = customerRepository(organizationId)
		const customer = await repo.findByEmail(email)
		return success(customer)
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Erro desconhecido',
			message: 'Não foi possível buscar o cliente.',
			type: 'DATABASE_ERROR',
		})
	}
}
