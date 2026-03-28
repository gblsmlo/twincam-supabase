'use server'

import { failure, type Result } from '@/shared/errors/result'
import { customerRepository } from '../repository/customer-drizzle-repository'
import { customerUpdateSchema } from '../schemas'
import { CustomerLifecycleService } from '../services/customer-lifecycle-service'
import type { Customer } from '../types'

export async function updateCustomer(
	organizationId: string,
	customerId: string,
	input: { status?: 'active' | 'inactive' },
): Promise<Result<Customer>> {
	const validated = customerUpdateSchema.safeParse(input)

	if (!validated.success) {
		return failure({
			details: validated.error.issues,
			error: validated.error.name,
			message: 'Dados inválidos. Verifique os campos e tente novamente.',
			type: 'VALIDATION_ERROR',
		})
	}

	const service = new CustomerLifecycleService(customerRepository(organizationId))

	if (validated.data.status === 'active') {
		return service.activateCustomer(customerId)
	}

	if (validated.data.status === 'inactive') {
		return service.deactivateCustomer(customerId)
	}

	// Generic update for non-status fields
	try {
		const repo = customerRepository(organizationId)
		const updated = await repo.update(customerId, validated.data)
		return { data: updated, success: true }
	} catch (error) {
		return failure({
			error: error instanceof Error ? error.message : 'Erro desconhecido',
			message: 'Não foi possível atualizar o cliente.',
			type: 'DATABASE_ERROR',
		})
	}
}
