'use server'

import { subscriptionRepository } from '@/modules/subscription/repository/subscription-drizzle-repository'
import { failure, type Result } from '@/shared/errors/result'
import { z } from 'zod'
import { invoiceRepository } from '../repository/invoice-drizzle-repository'
import { InvoiceGenerationService } from '../services/invoice-generation-service'
import type { Invoice } from '../types'

const createInvoiceInputSchema = z.object({
	amount: z.string().min(1),
	subscriptionId: z.string().uuid(),
})

export async function createInvoice(
	organizationId: string,
	input: { subscriptionId: string; amount: string },
): Promise<Result<Invoice>> {
	const validated = createInvoiceInputSchema.safeParse(input)

	if (!validated.success) {
		return failure({
			details: validated.error.issues,
			error: validated.error.name,
			message: 'Dados inválidos. Verifique os campos e tente novamente.',
			type: 'VALIDATION_ERROR',
		})
	}

	const service = new InvoiceGenerationService(
		invoiceRepository(organizationId),
		subscriptionRepository(organizationId),
	)

	return service.generateInvoiceForSubscription(
		validated.data.subscriptionId,
		validated.data.amount,
	)
}
