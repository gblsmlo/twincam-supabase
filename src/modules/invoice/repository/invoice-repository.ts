import type { InvoiceSpecification } from '../specifications/invoice-specification'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types'

/**
 * Repository scoped to a specific organization.
 * All queries are automatically filtered by the organizationId provided
 * at construction time via the factory function.
 */
export interface InvoiceRepository {
	create(input: InvoiceInsert): Promise<Invoice>
	update(id: string, input: InvoiceUpdate): Promise<Invoice>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Invoice | null>
	findBySubscriptionId(subscriptionId: string): Promise<Invoice[]>
	findByOrganizationId(organizationId: string): Promise<Invoice[]>
	findOverdue(): Promise<Invoice[]>
	findBySpecification(spec: InvoiceSpecification): Promise<Invoice[]>
}
