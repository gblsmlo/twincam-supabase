import { failure, type Result, success } from '@/shared/errors/result'
import { eventBus } from '@/shared/events'
import { CustomerStatusChangedEvent } from '../events/customer-events'
import type { CustomerRepository } from '../repository/customer-repository'
import type { Customer, CustomerInsert } from '../types'

export class CustomerLifecycleService {
	constructor(private readonly customerRepo: CustomerRepository) {}

	async createCustomer(input: CustomerInsert): Promise<Result<Customer>> {
		try {
			const customer = await this.customerRepo.create(input)
			return success(customer)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível criar o cliente.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async activateCustomer(customerId: string): Promise<Result<Customer>> {
		const customer = await this.customerRepo.findById(customerId)

		if (!customer) {
			return failure({
				message: 'Cliente não encontrado.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		if (customer.status === 'active') {
			return failure({
				message: 'O cliente já está ativo.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const updated = await this.customerRepo.update(customerId, { status: 'active' })

			await eventBus.publish(
				new CustomerStatusChangedEvent(customer._id, {
					newStatus: 'active',
					organizationId: customer.organizationId,
				}),
			)

			return success(updated)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível ativar o cliente.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async deactivateCustomer(customerId: string): Promise<Result<Customer>> {
		const customer = await this.customerRepo.findById(customerId)

		if (!customer) {
			return failure({
				message: 'Cliente não encontrado.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		if (customer.status === 'inactive') {
			return failure({
				message: 'O cliente já está inativo.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const updated = await this.customerRepo.update(customerId, { status: 'inactive' })

			await eventBus.publish(
				new CustomerStatusChangedEvent(customer._id, {
					newStatus: 'inactive',
					organizationId: customer.organizationId,
				}),
			)

			return success(updated)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível desativar o cliente.',
				type: 'DATABASE_ERROR',
			})
		}
	}
}
