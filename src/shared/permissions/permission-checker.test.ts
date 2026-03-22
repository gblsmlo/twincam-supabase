import type { MemberRepository } from '@/modules/member/repository/member-repository'
import type { Member } from '@/modules/member/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PermissionChecker } from './permission-checker'

const OWNER_USER_ID = '550e8400-e29b-41d4-a716-446655440001'
const ADMIN_USER_ID = '550e8400-e29b-41d4-a716-446655440002'
const MEMBER_USER_ID = '550e8400-e29b-41d4-a716-446655440003'
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
const regularMember = createMember({
	_id: 'member-regular',
	role: 'member',
	userId: MEMBER_USER_ID,
})

function createMockRepo() {
	return {
		create: vi.fn(),
		delete: vi.fn(),
		deleteIfNotLastOwner: vi.fn(),
		findById: vi.fn().mockResolvedValue(null),
		findByOrganizationId: vi.fn().mockResolvedValue([]),
		findBySpaceId: vi.fn().mockResolvedValue([ownerMember, adminMember, regularMember]),
		findByUserId: vi.fn().mockResolvedValue([]),
		findByUserIdAndSpaceId: vi.fn().mockImplementation((userId: string) => {
			if (userId === OWNER_USER_ID) return Promise.resolve(ownerMember)
			if (userId === ADMIN_USER_ID) return Promise.resolve(adminMember)
			if (userId === MEMBER_USER_ID) return Promise.resolve(regularMember)
			return Promise.resolve(null)
		}),
		update: vi.fn(),
	} satisfies Record<keyof MemberRepository, unknown>
}

describe('PermissionChecker', () => {
	let checker: PermissionChecker
	let repo: ReturnType<typeof createMockRepo>

	beforeEach(() => {
		vi.clearAllMocks()
		repo = createMockRepo()
		checker = new PermissionChecker(repo)
	})

	describe('canInviteMember', () => {
		it('should allow owner to invite any role', async () => {
			expect(await checker.canInviteMember(OWNER_USER_ID, SPACE_ID, 'owner')).toBe(true)
			expect(await checker.canInviteMember(OWNER_USER_ID, SPACE_ID, 'admin')).toBe(true)
			expect(await checker.canInviteMember(OWNER_USER_ID, SPACE_ID, 'member')).toBe(true)
		})

		it('should allow admin to invite member only', async () => {
			expect(await checker.canInviteMember(ADMIN_USER_ID, SPACE_ID, 'member')).toBe(true)
			expect(await checker.canInviteMember(ADMIN_USER_ID, SPACE_ID, 'admin')).toBe(true)
			expect(await checker.canInviteMember(ADMIN_USER_ID, SPACE_ID, 'owner')).toBe(false)
		})

		it('should deny member from inviting anyone', async () => {
			expect(await checker.canInviteMember(MEMBER_USER_ID, SPACE_ID, 'member')).toBe(false)
		})

		it('should deny non-member from inviting', async () => {
			expect(await checker.canInviteMember('unknown-user', SPACE_ID, 'member')).toBe(false)
		})
	})

	describe('canRemoveMember', () => {
		it('should allow owner to remove admin', async () => {
			repo.findById.mockResolvedValue(adminMember)

			expect(await checker.canRemoveMember(OWNER_USER_ID, SPACE_ID, 'member-admin')).toBe(true)
		})

		it('should allow owner to remove member', async () => {
			repo.findById.mockResolvedValue(regularMember)

			expect(await checker.canRemoveMember(OWNER_USER_ID, SPACE_ID, 'member-regular')).toBe(true)
		})

		it('should deny owner from removing themselves', async () => {
			repo.findById.mockResolvedValue(ownerMember)

			expect(await checker.canRemoveMember(OWNER_USER_ID, SPACE_ID, 'member-owner')).toBe(false)
		})

		it('should deny removing last owner', async () => {
			repo.findById.mockResolvedValue(ownerMember)
			repo.findBySpaceId.mockResolvedValue([ownerMember])

			const secondOwner = createMember({
				_id: 'member-owner-2',
				role: 'owner',
				userId: 'another-owner',
			})
			repo.findByUserIdAndSpaceId.mockImplementation((userId: string) => {
				if (userId === 'another-owner') return Promise.resolve(secondOwner)
				if (userId === OWNER_USER_ID) return Promise.resolve(ownerMember)
				return Promise.resolve(null)
			})

			expect(await checker.canRemoveMember('another-owner', SPACE_ID, 'member-owner')).toBe(false)
		})

		it('should deny admin from removing members', async () => {
			repo.findById.mockResolvedValue(regularMember)

			expect(await checker.canRemoveMember(ADMIN_USER_ID, SPACE_ID, 'member-regular')).toBe(false)
		})

		it('should deny regular member from removing anyone', async () => {
			repo.findById.mockResolvedValue(adminMember)

			expect(await checker.canRemoveMember(MEMBER_USER_ID, SPACE_ID, 'member-admin')).toBe(false)
		})
	})

	describe('canUpdateRole', () => {
		it('should allow owner to change admin role', async () => {
			repo.findById.mockResolvedValue(adminMember)

			expect(await checker.canUpdateRole(OWNER_USER_ID, SPACE_ID, 'member-admin', 'member')).toBe(
				true,
			)
		})

		it('should allow owner to promote member to admin', async () => {
			repo.findById.mockResolvedValue(regularMember)

			expect(await checker.canUpdateRole(OWNER_USER_ID, SPACE_ID, 'member-regular', 'admin')).toBe(
				true,
			)
		})

		it('should deny admin from changing owner role', async () => {
			repo.findById.mockResolvedValue(ownerMember)

			expect(await checker.canUpdateRole(ADMIN_USER_ID, SPACE_ID, 'member-owner', 'member')).toBe(
				false,
			)
		})

		it('should deny member from changing any role', async () => {
			repo.findById.mockResolvedValue(adminMember)

			expect(await checker.canUpdateRole(MEMBER_USER_ID, SPACE_ID, 'member-admin', 'member')).toBe(
				false,
			)
		})
	})

	describe('canDeleteOrganization', () => {
		it('should allow owner to delete organization', async () => {
			expect(await checker.canDeleteOrganization(OWNER_USER_ID, SPACE_ID)).toBe(true)
		})

		it('should deny admin from deleting organization', async () => {
			expect(await checker.canDeleteOrganization(ADMIN_USER_ID, SPACE_ID)).toBe(false)
		})

		it('should deny member from deleting organization', async () => {
			expect(await checker.canDeleteOrganization(MEMBER_USER_ID, SPACE_ID)).toBe(false)
		})
	})

	describe('isLastOwner', () => {
		it('should return true when only one owner', async () => {
			repo.findBySpaceId.mockResolvedValue([ownerMember, adminMember, regularMember])

			expect(await checker.isLastOwner(SPACE_ID)).toBe(true)
		})

		it('should return false when multiple owners', async () => {
			const secondOwner = createMember({ _id: 'member-owner-2', role: 'owner' })
			repo.findBySpaceId.mockResolvedValue([ownerMember, secondOwner, adminMember])

			expect(await checker.isLastOwner(SPACE_ID)).toBe(false)
		})
	})
})
