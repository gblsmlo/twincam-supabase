import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserAdminRepository } from './user-admin-repository'

vi.mock('@/lib/supabase/admin', () => ({
	supabaseAdmin: {},
}))

const mockAuthUser = {
	app_metadata: { is_platform_admin: false },
	email: 'admin@example.com',
	id: '550e8400-e29b-41d4-a716-446655440000',
	user_metadata: { username: 'Admin User' },
}

function createMockAdmin(overrides: Record<string, unknown> = {}) {
	return {
		auth: {
			admin: {
				getUserById: vi.fn(),
				listUsers: vi.fn(),
				updateUserById: vi.fn(),
				...overrides,
			},
		},
	} as unknown as SupabaseClient
}

describe('UserAdminRepository', () => {
	let repository: UserAdminRepository
	let mockAdmin: SupabaseClient

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('findById', () => {
		it('should return user when found', async () => {
			mockAdmin = createMockAdmin({
				getUserById: vi.fn().mockResolvedValue({ data: { user: mockAuthUser }, error: null }),
			})
			repository = new UserAdminRepository(mockAdmin)

			const result = await repository.findById(mockAuthUser.id)

			expect(result).toEqual({
				email: mockAuthUser.email,
				id: mockAuthUser.id,
				isPlatformAdmin: false,
				name: 'Admin User',
			})
		})

		it('should return null when user not found', async () => {
			mockAdmin = createMockAdmin({
				getUserById: vi
					.fn()
					.mockResolvedValue({ data: { user: null }, error: { message: 'Not found' } }),
			})
			repository = new UserAdminRepository(mockAdmin)

			const result = await repository.findById('non-existent')

			expect(result).toBeNull()
		})
	})

	describe('findByEmail', () => {
		it('should return user when email matches', async () => {
			mockAdmin = createMockAdmin({
				listUsers: vi.fn().mockResolvedValue({ data: { users: [mockAuthUser] }, error: null }),
			})
			repository = new UserAdminRepository(mockAdmin)

			const result = await repository.findByEmail(mockAuthUser.email)

			expect(result).toEqual({
				email: mockAuthUser.email,
				id: mockAuthUser.id,
				isPlatformAdmin: false,
				name: 'Admin User',
			})
		})

		it('should return null when email not found', async () => {
			mockAdmin = createMockAdmin({
				listUsers: vi.fn().mockResolvedValue({ data: { users: [mockAuthUser] }, error: null }),
			})
			repository = new UserAdminRepository(mockAdmin)

			const result = await repository.findByEmail('nonexistent@example.com')

			expect(result).toBeNull()
		})

		it('should return null on API error', async () => {
			mockAdmin = createMockAdmin({
				listUsers: vi
					.fn()
					.mockResolvedValue({ data: { users: [] }, error: { message: 'API error' } }),
			})
			repository = new UserAdminRepository(mockAdmin)

			const result = await repository.findByEmail(mockAuthUser.email)

			expect(result).toBeNull()
		})
	})

	describe('makePlatformAdmin', () => {
		it('should set is_platform_admin to true in app_metadata', async () => {
			const mockUpdateUserById = vi.fn().mockResolvedValue({ data: {}, error: null })
			mockAdmin = createMockAdmin({ updateUserById: mockUpdateUserById })
			repository = new UserAdminRepository(mockAdmin)

			await repository.makePlatformAdmin(mockAuthUser.id)

			expect(mockUpdateUserById).toHaveBeenCalledWith(mockAuthUser.id, {
				app_metadata: { is_platform_admin: true },
			})
		})

		it('should throw on API error', async () => {
			mockAdmin = createMockAdmin({
				updateUserById: vi.fn().mockResolvedValue({ data: {}, error: { message: 'Forbidden' } }),
			})
			repository = new UserAdminRepository(mockAdmin)

			await expect(repository.makePlatformAdmin(mockAuthUser.id)).rejects.toThrow(
				'Falha ao promover admin',
			)
		})
	})

	describe('revokePlatformAdmin', () => {
		it('should set is_platform_admin to false in app_metadata', async () => {
			const mockUpdateUserById = vi.fn().mockResolvedValue({ data: {}, error: null })
			mockAdmin = createMockAdmin({ updateUserById: mockUpdateUserById })
			repository = new UserAdminRepository(mockAdmin)

			await repository.revokePlatformAdmin(mockAuthUser.id)

			expect(mockUpdateUserById).toHaveBeenCalledWith(mockAuthUser.id, {
				app_metadata: { is_platform_admin: false },
			})
		})

		it('should throw on API error', async () => {
			mockAdmin = createMockAdmin({
				updateUserById: vi.fn().mockResolvedValue({ data: {}, error: { message: 'Forbidden' } }),
			})
			repository = new UserAdminRepository(mockAdmin)

			await expect(repository.revokePlatformAdmin(mockAuthUser.id)).rejects.toThrow(
				'Falha ao revogar admin',
			)
		})
	})

	describe('isPlatformAdmin', () => {
		it('should return true when user is platform admin', async () => {
			const adminUser = { ...mockAuthUser, app_metadata: { is_platform_admin: true } }
			mockAdmin = createMockAdmin({
				getUserById: vi.fn().mockResolvedValue({ data: { user: adminUser }, error: null }),
			})
			repository = new UserAdminRepository(mockAdmin)

			const result = await repository.isPlatformAdmin(mockAuthUser.id)

			expect(result).toBe(true)
		})

		it('should return false when user is not platform admin', async () => {
			mockAdmin = createMockAdmin({
				getUserById: vi.fn().mockResolvedValue({ data: { user: mockAuthUser }, error: null }),
			})
			repository = new UserAdminRepository(mockAdmin)

			const result = await repository.isPlatformAdmin(mockAuthUser.id)

			expect(result).toBe(false)
		})

		it('should return false when user not found', async () => {
			mockAdmin = createMockAdmin({
				getUserById: vi
					.fn()
					.mockResolvedValue({ data: { user: null }, error: { message: 'Not found' } }),
			})
			repository = new UserAdminRepository(mockAdmin)

			const result = await repository.isPlatformAdmin('non-existent')

			expect(result).toBe(false)
		})
	})
})
