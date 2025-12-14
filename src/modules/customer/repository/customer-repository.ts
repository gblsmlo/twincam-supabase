import type { Customer, CustomerInsert, CustomerUpdate } from '../types'

export interface CustomerRepository {
	create(input: CustomerInsert): Promise<Customer>
	update(id: string, input: CustomerUpdate): Promise<Customer>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Customer | null>
	findByEmail(email: string): Promise<Customer | null>
	findBySpaceId(spaceId: string): Promise<Customer[]>
	findAllByStatus(status: 'active' | 'inactive'): Promise<Customer[]>
}
