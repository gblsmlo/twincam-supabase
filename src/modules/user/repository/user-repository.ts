import type { User } from '../types'

/**
 * Repository para operacoes sobre o User entity.
 * Diferente dos outros repos: nao usa Drizzle/tabela propria.
 * Wraps Supabase Admin API para gerenciar app_metadata em auth.users.
 */
export interface UserRepository {
	findById(id: string): Promise<User | null>
	findByEmail(email: string): Promise<User | null>
	makePlatformAdmin(id: string): Promise<void>
	revokePlatformAdmin(id: string): Promise<void>
	isPlatformAdmin(id: string): Promise<boolean>
}
