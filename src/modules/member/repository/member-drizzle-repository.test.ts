import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	membersTable: {
		_id: 'mock-_id',
		organizationId: 'mock-organizationId',
		role: 'mock-role',
		spaceId: 'mock-spaceId',
		userId: 'mock-userId',
	},
}))

import type { Database } from '@/infra/db'
import { membersTable } from '@/infra/db'
import type { Member, MemberInsert, MemberUpdate } from '../types'
import { MemberDrizzleRepository } from './member-drizzle-repository'

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440099'

const mockMember: Member = {
	_id: '550e8400-e29b-41d4-a716-446655440010',
	createdAt: new Date(),
	organizationId: TEST_ORG_ID,
	role: 'member',
	spaceId: '550e8400-e29b-41d4-a716-446655440000',
	updatedAt: new Date(),
	userId: '550e8400-e29b-41d4-a716-446655440011',
}

const mockMemberInsert: MemberInsert = {
	organizationId: mockMember.organizationId,
	role: mockMember.role,
	spaceId: mockMember.spaceId,
	userId: mockMember.userId,
}

const mockMemberUpdate: MemberUpdate = {
	role: 'admin',
}

describe('MemberDrizzleRepository', () => {
	let repository: MemberDrizzleRepository
	let mockDb: Database

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('create', () => {
		it('should create a new member successfully', async () => {
			const mockReturning = vi.fn().mockResolvedValue([mockMember])
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.create(mockMemberInsert)

			expect(mockInsert).toHaveBeenCalledWith(membersTable)
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: TEST_ORG_ID,
					spaceId: mockMemberInsert.spaceId,
					userId: mockMemberInsert.userId,
				}),
			)
			expect(result).toEqual(mockMember)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.create(mockMemberInsert)).rejects.toThrow(
				'Database connection failed',
			)
		})

		it('should override organizationId in input with the repository context', async () => {
			const differentOrgInsert: MemberInsert = {
				...mockMemberInsert,
				organizationId: 'different-org-id',
			}

			const mockReturning = vi.fn().mockResolvedValue([mockMember])
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			await repository.create(differentOrgInsert)

			const setCallArg = mockValues.mock.calls[0][0]
			expect(setCallArg.organizationId).toBe(TEST_ORG_ID)
		})
	})

	describe('update', () => {
		it('should update existing member successfully', async () => {
			const updatedMember = { ...mockMember, ...mockMemberUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedMember])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.update(mockMember._id, mockMemberUpdate)

			expect(mockUpdate).toHaveBeenCalledWith(membersTable)
			expect(mockSet).toHaveBeenCalled()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg).toHaveProperty('updatedAt')
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.role).toBe(mockMemberUpdate.role)

			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(updatedMember)
		})

		it('should set updatedAt with current date', async () => {
			const dateBefore = new Date()
			const updatedMember = { ...mockMember, ...mockMemberUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedMember])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			await repository.update(mockMember._id, mockMemberUpdate)
			const dateAfter = new Date()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.updatedAt.getTime()).toBeGreaterThanOrEqual(dateBefore.getTime())
			expect(setCallArg.updatedAt.getTime()).toBeLessThanOrEqual(dateAfter.getTime())
		})

		it('should propagate error when update fails', async () => {
			const dbError = new Error('Update failed')
			const mockWhere = vi.fn().mockRejectedValue(dbError)
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.update(mockMember._id, mockMemberUpdate)).rejects.toThrow(
				'Update failed',
			)
		})

		it('should return undefined when no record is found', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.update('non-existent-id', mockMemberUpdate)

			expect(result).toBeUndefined()
		})
	})

	describe('delete', () => {
		it('should delete a member successfully and return deletedId', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockMember._id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.delete(mockMember._id)

			expect(mockDelete).toHaveBeenCalledWith(membersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockReturning).toHaveBeenCalled()
			expect(result).toEqual({ deletedId: mockMember._id })
		})

		it('should propagate error when delete fails', async () => {
			const dbError = new Error('Delete failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.delete(mockMember._id)).rejects.toThrow('Delete failed')
		})

		it('should handle attempt to delete non-existent record', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.delete('non-existent-id')

			expect(result.deletedId).toBeUndefined()
		})
	})

	describe('findById', () => {
		it('should find member by id successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockMember])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findById(mockMember._id)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(membersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockMember)
		})

		it('should return null when no member is found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findById('non-existent-id')

			expect(result).toBeNull()
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockLimit = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.findById(mockMember._id)).rejects.toThrow('Query failed')
		})
	})

	describe('findByUserId', () => {
		it('should find members by userId within the organization', async () => {
			const mockWhere = vi.fn().mockResolvedValue([mockMember])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByUserId(mockMember.userId)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(membersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([mockMember])
		})

		it('should return empty array when no members found', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByUserId('non-existent-user')

			expect(result).toEqual([])
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockWhere = vi.fn().mockRejectedValue(dbError)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.findByUserId(mockMember.userId)).rejects.toThrow('Query failed')
		})
	})

	describe('findBySpaceId', () => {
		it('should find members by spaceId within the organization', async () => {
			const mockWhere = vi.fn().mockResolvedValue([mockMember])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findBySpaceId(mockMember.spaceId)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(membersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([mockMember])
		})

		it('should return empty array when no members found', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findBySpaceId('non-existent-space')

			expect(result).toEqual([])
		})

		it('should propagate error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockWhere = vi.fn().mockRejectedValue(dbError)
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			await expect(repository.findBySpaceId(mockMember.spaceId)).rejects.toThrow('Query failed')
		})

		it('should return multiple members when found', async () => {
			const secondMember: Member = {
				...mockMember,
				_id: '550e8400-e29b-41d4-a716-446655440012',
				userId: '550e8400-e29b-41d4-a716-446655440013',
			}
			const mockWhere = vi.fn().mockResolvedValue([mockMember, secondMember])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findBySpaceId(mockMember.spaceId)

			expect(result).toHaveLength(2)
			expect(result).toEqual([mockMember, secondMember])
		})
	})

	describe('findByOrganizationId', () => {
		it('should find all members for an organization', async () => {
			const mockWhere = vi.fn().mockResolvedValue([mockMember])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByOrganizationId(TEST_ORG_ID)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(membersTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([mockMember])
		})

		it('should return empty array when no members found for organization', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new MemberDrizzleRepository(mockDb, TEST_ORG_ID)

			const result = await repository.findByOrganizationId('non-existent-org')

			expect(result).toEqual([])
		})
	})
})
