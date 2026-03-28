'use server'

import { failure, type Result } from '@/shared/errors/result'
import { customerRepository } from '../repository/customer-drizzle-repository'
import { customerCreateSchema } from '../schemas'
import { CustomerLifecycleService } from '../services/customer-lifecycle-service'
import type { Customer } from '../types'

export async function createCustomer(
	organizationId: string,
	input: {
		email: string
		name: string
		spaceId: string
	},
): Promise<Result<Customer>> {
	const validated = customerCreateSchema.safeParse({ ...input, organizationId })

	if (!validated.success) {
		return failure({
			details: validated.error.issues,
			error: validated.error.name,
			message: 'Dados inválidos. Verifique os campos e tente novamente.',
			type: 'VALIDATION_ERROR',
		})
	}

	const service = new CustomerLifecycleService(customerRepository(organizationId))

	return service.createCustomer(validated.data)
}
