import { supabaseAdmin } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '../types'
import type { UserRepository } from './user-repository'

export class UserAdminRepository implements UserRepository {
	constructor(private admin: SupabaseClient) {}

	async findById(id: string): Promise<User | null> {
		const { data, error } = await this.admin.auth.admin.getUserById(id)
		if (error || !data.user) return null

		return this.mapToUser(data.user)
	}

	async findByEmail(email: string): Promise<User | null> {
		const { data, error } = await this.admin.auth.admin.listUsers()
		if (error) return null

		const user = data.users.find((u) => u.email === email)
		return user ? this.mapToUser(user) : null
	}

	async makePlatformAdmin(id: string): Promise<void> {
		const { error } = await this.admin.auth.admin.updateUserById(id, {
			app_metadata: { is_platform_admin: true },
		})
		if (error) throw new Error(`Falha ao promover admin: ${error.message}`)
	}

	async revokePlatformAdmin(id: string): Promise<void> {
		const { error } = await this.admin.auth.admin.updateUserById(id, {
			app_metadata: { is_platform_admin: false },
		})
		if (error) throw new Error(`Falha ao revogar admin: ${error.message}`)
	}

	async isPlatformAdmin(id: string): Promise<boolean> {
		const { data } = await this.admin.auth.admin.getUserById(id)
		return data?.user?.app_metadata?.is_platform_admin === true
	}

	private mapToUser(user: {
		id: string
		email?: string
		user_metadata?: Record<string, unknown>
		app_metadata?: Record<string, unknown>
	}): User {
		return {
			email: user.email || '',
			id: user.id,
			isPlatformAdmin: user.app_metadata?.is_platform_admin === true,
			name: (user.user_metadata?.username as string) || user.email?.split('@')[0] || 'User',
		}
	}
}

export const userRepository = () => new UserAdminRepository(supabaseAdmin)
