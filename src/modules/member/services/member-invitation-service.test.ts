import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MemberInvitationRepository } from '../repository/member-invitation-repository'
import type { MemberRepository } from '../repository/member-repository'
import type { Member, MemberInvitation } from '../types'
import { MemberInvitationService } from './member-invitation-service'

const OWNER_USER_ID = '550e8400-e29b-41d4-a716-446655440001'
const MEMBER_USER_ID = '550e8400-e29b-41d4-a716-446655440003'
const ACCEPTING_USER_ID = '550e8400-e29b-41d4-a716-446655440004'
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440010'
const ORG_ID = '550e8400-e29b-41d4-a716-446655440020'
const INVITATION_ID = '550e8400-e29b-41d4-a716-446655440030'

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

function createInvitation(overrides: Partial<MemberInvitation> = {}): MemberInvitation {
	const EXPIRES_AT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

	return {
		_id: INVITATION_ID,
		acceptedAt: null,
		createdAt: new Date(),
		email: 'invitee@test.com',
		expiresAt: EXPIRES_AT,
		organizationId: ORG_ID,
		role: 'member',
		spaceId: SPACE_ID,
		token: 'test-token',
		updatedAt: new Date(),
		...overrides,
	}
}

const ownerMember = createMember({ _id: 'member-owner', role: 'owner', userId: OWNER_USER_ID })
const regularMember = createMember({
	_id: 'member-regular',
	role: 'member',
	userId: MEMBER_USER_ID,
})

function createMockMemberRepo() {
	return {
		create: vi.fn().mockImplementation((input) =>
			Promise.resolve(
				createMember({
					_id: 'new-member-id',
					...input,
				}),
			),
		),
		delete: vi.fn(),
		deleteIfNotLastOwner: vi.fn(),
		findById: vi.fn().mockResolvedValue(null),
		findByOrganizationId: vi.fn().mockResolvedValue([]),
		findBySpaceId: vi.fn().mockResolvedValue([ownerMember, regularMember]),
		findByUserId: vi.fn().mockResolvedValue([]),
		findByUserIdAndSpaceId: vi.fn().mockImplementation((userId: string) => {
			if (userId === OWNER_USER_ID) return Promise.resolve(ownerMember)
			if (userId === MEMBER_USER_ID) return Promise.resolve(regularMember)
			return Promise.resolve(null)
		}),
		update: vi.fn(),
	} satisfies Record<keyof MemberRepository, unknown>
}

function createMockInvitationRepo() {
	return {
		create: vi.fn().mockImplementation((input) => Promise.resolve(createInvitation(input))),
		delete: vi.fn().mockResolvedValue({ deletedId: INVITATION_ID }),
		findById: vi.fn().mockResolvedValue(null),
		findBySpaceId: vi.fn().mockResolvedValue([]),
		findBySpaceIdAndEmail: vi.fn().mockResolvedValue(null),
		findByToken: vi.fn().mockResolvedValue(null),
		update: vi
			.fn()
			.mockImplementation((id, input) => Promise.resolve(createInvitation({ _id: id, ...input }))),
	} satisfies Record<keyof MemberInvitationRepository, unknown>
}

describe('MemberInvitationService', () => {
	let service: MemberInvitationService
	let memberRepo: ReturnType<typeof createMockMemberRepo>
	let invitationRepo: ReturnType<typeof createMockInvitationRepo>

	beforeEach(() => {
		vi.clearAllMocks()
		memberRepo = createMockMemberRepo()
		invitationRepo = createMockInvitationRepo()
		service = new MemberInvitationService(memberRepo, invitationRepo)
	})

	describe('invite', () => {
		it('should create invitation with 7-day expiry when owner invites', async () => {
			const before = Date.now()

			const result = await service.invite({
				actorUserId: OWNER_USER_ID,
				email: 'new@test.com',
				role: 'member',
				spaceId: SPACE_ID,
			})

			const after = Date.now()

			expect(result.success).toBe(true)
			expect(invitationRepo.create).toHaveBeenCalledOnce()

			const createCall = invitationRepo.create.mock.calls[0][0]
			expect(createCall.email).toBe('new@test.com')
			expect(createCall.role).toBe('member')
			expect(createCall.spaceId).toBe(SPACE_ID)
			expect(createCall.token).toBeDefined()

			const expiresAt = createCall.expiresAt.getTime()
			const expectedMin = before + 7 * 24 * 60 * 60 * 1000
			const expectedMax = after + 7 * 24 * 60 * 60 * 1000
			expect(expiresAt).toBeGreaterThanOrEqual(expectedMin)
			expect(expiresAt).toBeLessThanOrEqual(expectedMax)
		})

		it('should reject invalid email', async () => {
			const result = await service.invite({
				actorUserId: OWNER_USER_ID,
				email: 'invalid',
				role: 'member',
				spaceId: SPACE_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('E-mail')
			}
		})

		it('should reject when actor lacks permission', async () => {
			const result = await service.invite({
				actorUserId: MEMBER_USER_ID,
				email: 'new@test.com',
				role: 'member',
				spaceId: SPACE_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('AUTHORIZATION_ERROR')
			}
		})

		it('should reject duplicate invitation', async () => {
			invitationRepo.findBySpaceIdAndEmail.mockResolvedValue(createInvitation())

			const result = await service.invite({
				actorUserId: OWNER_USER_ID,
				email: 'invitee@test.com',
				role: 'member',
				spaceId: SPACE_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('pendente')
			}
		})
	})

	describe('accept', () => {
		it('should create member and mark invitation as accepted', async () => {
			const invitation = createInvitation()
			invitationRepo.findById.mockResolvedValue(invitation)

			const result = await service.accept({
				invitationId: INVITATION_ID,
				userId: ACCEPTING_USER_ID,
			})

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.role).toBe('member')
				expect(result.data.spaceId).toBe(SPACE_ID)
			}
			expect(memberRepo.create).toHaveBeenCalledWith({
				role: 'member',
				spaceId: SPACE_ID,
				userId: ACCEPTING_USER_ID,
			})
			expect(invitationRepo.update).toHaveBeenCalledWith(INVITATION_ID, {
				acceptedAt: expect.any(Date),
			})
		})

		it('should reject expired invitation', async () => {
			const expiredInvitation = createInvitation({
				expiresAt: new Date(Date.now() - 1000),
			})
			invitationRepo.findById.mockResolvedValue(expiredInvitation)

			const result = await service.accept({
				invitationId: INVITATION_ID,
				userId: ACCEPTING_USER_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('expirou')
			}
		})

		it('should reject already accepted invitation', async () => {
			const acceptedInvitation = createInvitation({
				acceptedAt: new Date(),
			})
			invitationRepo.findById.mockResolvedValue(acceptedInvitation)

			const result = await service.accept({
				invitationId: INVITATION_ID,
				userId: ACCEPTING_USER_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('já foi aceito')
			}
		})

		it('should reject when invitation not found', async () => {
			invitationRepo.findById.mockResolvedValue(null)

			const result = await service.accept({
				invitationId: 'non-existent',
				userId: ACCEPTING_USER_ID,
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('NOT_FOUND_ERROR')
			}
		})

		it('should reject when user is already a member', async () => {
			const invitation = createInvitation()
			invitationRepo.findById.mockResolvedValue(invitation)
			memberRepo.findByUserIdAndSpaceId.mockResolvedValue(regularMember)

			const result = await service.accept({ invitationId: INVITATION_ID, userId: MEMBER_USER_ID })

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('já é membro')
			}
		})
	})

	describe('reject', () => {
		it('should delete invitation', async () => {
			invitationRepo.findById.mockResolvedValue(createInvitation())

			const result = await service.reject(INVITATION_ID)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.deletedId).toBe(INVITATION_ID)
			}
			expect(invitationRepo.delete).toHaveBeenCalledWith(INVITATION_ID)
		})

		it('should return not found when invitation does not exist', async () => {
			invitationRepo.findById.mockResolvedValue(null)

			const result = await service.reject('non-existent')

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('NOT_FOUND_ERROR')
			}
		})
	})
})
