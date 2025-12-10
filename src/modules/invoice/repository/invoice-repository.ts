import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types'

export interface InvoiceRepository {
	create(input: InvoiceInsert): Promise<Invoice>
	update(id: string, input: InvoiceUpdate): Promise<Invoice>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Invoice | null>
	findBySubscriptionId(subscriptionId: string): Promise<Invoice[]>
	findOverdue(): Promise<Invoice[]>
	findLatestByCustomerId(customerId: string): Promise<Invoice | null>
}
