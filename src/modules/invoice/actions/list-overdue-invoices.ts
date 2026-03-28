'use server'

import { subscriptionRepository } from '@/modules/subscription/repository/subscription-drizzle-repository'
import type { Result } from '@/shared/errors/result'
import { invoiceRepository } from '../repository/invoice-drizzle-repository'
import { InvoiceGenerationService } from '../services/invoice-generation-service'
import type { Invoice } from '../types'

export async function listOverdueInvoices(organizationId: string): Promise<Result<Invoice[]>> {
	const service = new InvoiceGenerationService(
		invoiceRepository(organizationId),
		subscriptionRepository(organizationId),
	)

	return service.processOverdueInvoices()
}
