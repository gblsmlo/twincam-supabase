import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MemberRepository } from '../repository/member-repository'
import type { Member } from '../types'
import { MemberRoleService } from './member-role-service'

const OWNER_USER_ID = '550e8400-e29b-41d4-a716-446655440001'
const ADMIN_USER_ID = '550e8400-e29b-41d4-a716-446655440002'
const TARGET_USER_ID = '550e8400-e29b-41d4-a716-446655440003'
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440010'
const ORG_ID = '550e8400-e29b-41d4-a716-446655440020'

function createMember(overrides: Partial<Member> & { _id: string; role: string }): Member {
	return {
		createdAt: new Date(),
		organizationId: ORG_ID,
		spaceId: SPACE_ID,
		updatedAt: new Date(),
		userId: OWNER_USER_ID,
		...overrides,
	}
}

const ownerMember = createMember({ _id: 'member-owner', role: 'owner', userId: OWNER_USER_ID })
const adminMember = createMember({ _id: 'member-admin', role: 'admin', userId: ADMIN_USER_ID })
const targetMember = createMember({
	_id: 'member-target',
	role: 'member',
	userId: TARGET_USER_ID,
})

function createMockRepo() {
	return {
		create: vi.fn().mockImplementation((input) =>
			Promise.resolve(
				createMember({
					_id: 'new-member-id',
					...input,
				}),
			),
		),
		delete: vi.fn().mockResolvedValue({ deletedId: 'member-target' }),
		deleteIfNotLastOwner: vi.fn().mockResolvedValue({ deletedId: 'member-target' }),
		findById: vi.fn().mockResolvedValue(null),
		findByOrganizationId: vi.fn().mockResolvedValue([]),
		findBySpaceId: vi.fn().mockResolvedValue([ownerMember, adminMember, targetMember]),
		findByUserId: vi.fn().mockResolvedValue([]),
		findByUserIdAndSpaceId: vi.fn().mockImplementation((userId: string) => {
			if (userId === OWNER_USER_ID) return Promise.resolve(ownerMember)
			if (userId === ADMIN_USER_ID) return Promise.resolve(adminMember)
			if (userId === TARGET_USER_ID) return Promise.resolve(targetMember)
			return Promise.resolve(null)
		}),
		update: vi.fn().mockImplementation((id, input) =>
			Promise.resolve(
				createMember({
					_id: id,
					role: 'member',
					...input,
				}),
			),
		),
	} satisfies Record<keyof MemberRepository, unknown>
}

describe('MemberRoleService', () => {
	let service: MemberRoleService
	let repo: ReturnType<typeof createMockRepo>

	beforeEach(() => {
		vi.clearAllMocks()
		repo = createMockRepo()
		service = new MemberRoleService(repo)
	})

	describe('addMember', () => {
		it('should add member when owner invites', async () => {
			const newUserId = 'new-user-id'
			repo.findByUserIdAndSpaceId.mockImplementation((userId: string) => {
				if (userId === OWNER_USER_ID) return Promise.resolve(ownerMember)
				return Promise.resolve(null)
			})

			const result = await service.addMember({
				actorUserId: OWNER_USER_ID,
				role: 'member',
				spaceId: SPACE_ID,
				targetUserId: newUserId,
			})

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.role).toBe('member')
			}
			expect(repo.create).toHaveBeenCalledWith({
				role: 'member',
				spaceId: SPACE_ID,
				userId: newUserId,
			})
		})

		it('should reject when user is already a member', async () => {
			const result = await service.addMember({
				actorUserId: OWNER_USER_ID,
				role: 'member',
				spaceId: SPACE_ID,
				targetUserId: TARGET_USER_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('já é membro')
			}
		})

		it('should reject when actor lacks permission', async () => {
			const newUserId = 'new-user-id'
			repo.findByUserIdAndSpaceId.mockImplementation((userId: string) => {
				if (userId === TARGET_USER_ID) return Promise.resolve(targetMember)
				return Promise.resolve(null)
			})

			const result = await service.addMember({
				actorUserId: TARGET_USER_ID,
				role: 'member',
				spaceId: SPACE_ID,
				targetUserId: newUserId,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('AUTHORIZATION_ERROR')
			}
		})
	})

	describe('updateRole', () => {
		it('should update role when owner changes member role', async () => {
			repo.findById.mockResolvedValue(targetMember)

			const result = await service.updateRole({
				actorUserId: OWNER_USER_ID,
				newRole: 'admin',
				spaceId: SPACE_ID,
				targetMemberId: 'member-target',
			})

			expect(result.success).toBe(true)
			expect(repo.update).toHaveBeenCalledWith('member-target', { role: 'admin' })
		})

		it('should reject when actor lacks permission', async () => {
			repo.findById.mockResolvedValue(ownerMember)

			const result = await service.updateRole({
				actorUserId: ADMIN_USER_ID,
				newRole: 'member',
				spaceId: SPACE_ID,
				targetMemberId: 'member-owner',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('AUTHORIZATION_ERROR')
			}
		})
	})

	describe('removeMember', () => {
		it('should remove member atomically when owner removes', async () => {
			repo.findById.mockResolvedValue(targetMember)

			const result = await service.removeMember({
				actorUserId: OWNER_USER_ID,
				spaceId: SPACE_ID,
				targetMemberId: 'member-target',
			})

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.deletedId).toBe('member-target')
			}
			expect(repo.deleteIfNotLastOwner).toHaveBeenCalledWith('member-target', SPACE_ID)
		})

		it('should reject when actor lacks permission', async () => {
			repo.findById.mockResolvedValue(targetMember)

			const result = await service.removeMember({
				actorUserId: ADMIN_USER_ID,
				spaceId: SPACE_ID,
				targetMemberId: 'member-target',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('AUTHORIZATION_ERROR')
			}
		})

		it('should return validation error when atomic delete rejects last owner', async () => {
			repo.findById.mockResolvedValue(targetMember)
			repo.deleteIfNotLastOwner.mockResolvedValue(null)

			const result = await service.removeMember({
				actorUserId: OWNER_USER_ID,
				spaceId: SPACE_ID,
				targetMemberId: 'member-target',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('último proprietário')
			}
		})
	})

	describe('transferOwnership', () => {
		it('should transfer ownership: old owner becomes admin, new becomes owner', async () => {
			repo.findById.mockResolvedValue(adminMember)

			const result = await service.transferOwnership({
				actorUserId: OWNER_USER_ID,
				newOwnerMemberId: 'member-admin',
				spaceId: SPACE_ID,
			})

			expect(result.success).toBe(true)
			expect(repo.update).toHaveBeenCalledWith('member-admin', { role: 'owner' })
			expect(repo.update).toHaveBeenCalledWith('member-owner', { role: 'admin' })
		})

		it('should reject when actor is not owner', async () => {
			const result = await service.transferOwnership({
				actorUserId: ADMIN_USER_ID,
				newOwnerMemberId: 'member-target',
				spaceId: SPACE_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('AUTHORIZATION_ERROR')
			}
		})

		it('should reject transferring to self', async () => {
			repo.findById.mockResolvedValue(ownerMember)

			const result = await service.transferOwnership({
				actorUserId: OWNER_USER_ID,
				newOwnerMemberId: 'member-owner',
				spaceId: SPACE_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('já é o proprietário')
			}
		})

		it('should reject when target member not found', async () => {
			repo.findById.mockResolvedValue(null)

			const result = await service.transferOwnership({
				actorUserId: OWNER_USER_ID,
				newOwnerMemberId: 'non-existent',
				spaceId: SPACE_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('NOT_FOUND_ERROR')
			}
		})
	})
})
