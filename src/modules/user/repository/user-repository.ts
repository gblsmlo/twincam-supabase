import type { User, UserInsert, UserUpdate } from '../types'

export interface UserRepository {
	create(input: UserInsert): Promise<User>
	update(id: string, input: UserUpdate): Promise<User>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<User | null>
	findByEmail(email: string): Promise<User | null>
	makePlatformAdmin(id: string): Promise<User>
	revokePlatformAdmin(id: string): Promise<User>
}
