import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	usersTable: {
		_id: 'mock-id',
		email: 'mock-email',
		isPlatformAdmin: 'mock-isPlatformAdmin',
	},
}))

import type { Database } from '@/infra/db'
import { usersTable } from '@/infra/db'
import type { User, UserInsert, UserUpdate } from '../types'
import { UserDrizzleRepository } from './user-drizzle-repository'

const mockUser: User = {
	_id: '550e8400-e29b-41d4-a716-446655440000',
	createdAt: new Date(),
	email: 'admin@example.com',
	isPlatformAdmin: false,
	updatedAt: new Date(),
}

const mockUserInsert: UserInsert = {
	_id: mockUser._id,
	email: mockUser.email,
	isPlatformAdmin: false,
}

const mockUserUpdate: UserUpdate = {
	email: 'updated@example.com',
}

describe('UserDrizzleRepository', () => {
	let repository: UserDrizzleRepository
	let mockDb: Database

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('create', () => {
		it('should create a new user successfully', async () => {
			const mockReturning = vi.fn().mockResolvedValue([mockUser])
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = { insert: mockInsert } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.create(mockUserInsert)

			expect(mockInsert).toHaveBeenCalledWith(usersTable)
			expect(mockValues).toHaveBeenCalledWith(mockUserInsert)
			expect(result).toEqual(mockUser)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = { insert: mockInsert } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			await expect(repository.create(mockUserInsert)).rejects.toThrow('Database connection failed')
		})
	})

	describe('update', () => {
		it('should update user successfully', async () => {
			const updatedUser = { ...mockUser, ...mockUserUpdate }
			const mockReturning = vi.fn().mockResolvedValue([updatedUser])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = { update: mockUpdate } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.update(mockUser._id, mockUserUpdate)

			expect(mockUpdate).toHaveBeenCalledWith(usersTable)
			expect(mockSet).toHaveBeenCalled()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.email).toBe(mockUserUpdate.email)
			expect(result).toEqual(updatedUser)
		})

		it('should propagate error when update fails', async () => {
			const dbError = new Error('Update failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = { update: mockUpdate } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			await expect(repository.update(mockUser._id, mockUserUpdate)).rejects.toThrow('Update failed')
		})
	})

	describe('delete', () => {
		it('should delete a user successfully', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockUser._id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = { delete: mockDelete } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.delete(mockUser._id)

			expect(mockDelete).toHaveBeenCalledWith(usersTable)
			expect(result).toEqual({ deletedId: mockUser._id })
		})

		it('should handle deleting non-existent user', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = { delete: mockDelete } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.delete('non-existent')

			expect(result.deletedId).toBeUndefined()
		})
	})

	describe('findById', () => {
		it('should find user by id', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockUser])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = { select: mockSelect } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.findById(mockUser._id)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(usersTable)
			expect(result).toEqual(mockUser)
		})

		it('should return null when user not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = { select: mockSelect } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.findById('non-existent')

			expect(result).toBeNull()
		})
	})

	describe('findByEmail', () => {
		it('should find user by email', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockUser])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = { select: mockSelect } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.findByEmail(mockUser.email)

			expect(result).toEqual(mockUser)
		})

		it('should return null when email not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = { select: mockSelect } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.findByEmail('nonexistent@example.com')

			expect(result).toBeNull()
		})
	})

	describe('makePlatformAdmin', () => {
		it('should set isPlatformAdmin to true', async () => {
			const adminUser = { ...mockUser, isPlatformAdmin: true }
			const mockReturning = vi.fn().mockResolvedValue([adminUser])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = { update: mockUpdate } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.makePlatformAdmin(mockUser._id)

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg.isPlatformAdmin).toBe(true)
			expect(result.isPlatformAdmin).toBe(true)
		})
	})

	describe('revokePlatformAdmin', () => {
		it('should set isPlatformAdmin to false', async () => {
			const revokedUser = { ...mockUser, isPlatformAdmin: false }
			const mockReturning = vi.fn().mockResolvedValue([revokedUser])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = { update: mockUpdate } as unknown as Database
			repository = new UserDrizzleRepository(mockDb)

			const result = await repository.revokePlatformAdmin(mockUser._id)

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg.isPlatformAdmin).toBe(false)
			expect(result.isPlatformAdmin).toBe(false)
		})
	})
})
