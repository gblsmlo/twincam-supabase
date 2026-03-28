import type { CustomerRepository } from '@/modules/customer/repository/customer-repository'
import type { Customer } from '@/modules/customer/types'
import type { MemberRepository } from '@/modules/member/repository/member-repository'
import type { Member } from '@/modules/member/types'
import type { SubscriptionRepository } from '@/modules/subscription/repository/subscription-repository'
import type { Subscription } from '@/modules/subscription/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrganizationRepository } from '../repository/organization-repository'
import type { Organization } from '../types'
import { OnboardingService } from './onboarding-service'

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440001'
const TEST_CUSTOMER_ID = '550e8400-e29b-41d4-a716-446655440002'
const TEST_SUBSCRIPTION_ID = '550e8400-e29b-41d4-a716-446655440003'
const TEST_MEMBER_ID = '550e8400-e29b-41d4-a716-446655440004'

const mockOrganization: Organization = {
	_id: TEST_ORG_ID,
	createdAt: new Date(),
	description: null,
	hierarchyLevel: 1,
	hierarchyPath: '',
	name: 'Test Org',
	ownerId: TEST_USER_ID,
	parentOrganizationId: null,
	slug: 'test-org',
	updatedAt: new Date(),
}

const mockMember: Member = {
	_id: TEST_MEMBER_ID,
	createdAt: new Date(),
	organizationId: TEST_ORG_ID,
	role: 'owner',
	spaceId: TEST_ORG_ID,
	updatedAt: new Date(),
	userId: TEST_USER_ID,
}

const mockCustomer: Customer = {
	_id: TEST_CUSTOMER_ID,
	createdAt: new Date(),
	email: 'user@test.com',
	name: 'Test User',
	organizationId: TEST_ORG_ID,
	spaceId: TEST_ORG_ID,
	status: 'active',
	updatedAt: new Date(),
}

const mockSubscription: Subscription = {
	_id: TEST_SUBSCRIPTION_ID,
	createdAt: new Date(),
	customerId: TEST_CUSTOMER_ID,
	finishedAt: null,
	organizationId: TEST_ORG_ID,
	planName: 'free_trial',
	priceId: null,
	startedAt: new Date(),
	status: 'active',
	trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
	updatedAt: new Date(),
}

function createMockRepos() {
	return {
		customerRepository: {
			create: vi.fn().mockResolvedValue(mockCustomer),
			delete: vi.fn(),
			findAllByStatus: vi.fn(),
			findByEmail: vi.fn(),
			findById: vi.fn(),
			findByOrganizationId: vi.fn(),
			findBySpaceId: vi.fn(),
			update: vi.fn(),
		} satisfies Record<keyof CustomerRepository, unknown>,
		memberRepository: {
			create: vi.fn().mockResolvedValue(mockMember),
			delete: vi.fn(),
			deleteIfNotLastOwner: vi.fn(),
			findById: vi.fn(),
			findByOrganizationId: vi.fn(),
			findBySpaceId: vi.fn(),
			findByUserId: vi.fn(),
			findByUserIdAndSpaceId: vi.fn(),
			update: vi.fn(),
		} satisfies Record<keyof MemberRepository, unknown>,
		organizationRepository: {
			create: vi.fn().mockResolvedValue(mockOrganization),
			delete: vi.fn().mockResolvedValue({ deletedId: TEST_ORG_ID }),
			findAncestors: vi.fn(),
			findByOwnerId: vi.fn(),
			findByParentId: vi.fn(),
			findBySlug: vi.fn().mockResolvedValue(null),
			findDescendants: vi.fn(),
			update: vi.fn(),
		} satisfies Record<keyof OrganizationRepository, unknown>,
		subscriptionRepository: {
			create: vi.fn().mockResolvedValue(mockSubscription),
			delete: vi.fn(),
			findActiveByCustomerId: vi.fn(),
			findByCustomerId: vi.fn(),
			findById: vi.fn(),
			findByOrganizationId: vi.fn(),
			findByStatus: vi.fn(),
			update: vi.fn(),
		} satisfies Record<keyof SubscriptionRepository, unknown>,
	}
}

describe('OnboardingService', () => {
	let service: OnboardingService
	let repos: ReturnType<typeof createMockRepos>

	beforeEach(() => {
		vi.clearAllMocks()
		repos = createMockRepos()
		service = new OnboardingService(repos)
	})

	describe('onboardNewUser', () => {
		it('should successfully onboard a new user with org + member + billing', async () => {
			const result = await service.onboardNewUser(
				TEST_USER_ID,
				'Test Org',
				'test-org',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.organization).toEqual(mockOrganization)
				expect(result.data.membership).toEqual(mockMember)
				expect(result.data.customer).toEqual(mockCustomer)
				expect(result.data.subscription).toEqual(mockSubscription)
			}

			expect(repos.organizationRepository.create).toHaveBeenCalledWith({
				hierarchyLevel: 1,
				hierarchyPath: '',
				name: 'Test Org',
				ownerId: TEST_USER_ID,
				parentOrganizationId: null,
				slug: 'test-org',
			})
			expect(repos.memberRepository.create).toHaveBeenCalledWith({
				role: 'owner',
				spaceId: TEST_ORG_ID,
				userId: TEST_USER_ID,
			})
			expect(repos.customerRepository.create).toHaveBeenCalled()
			expect(repos.subscriptionRepository.create).toHaveBeenCalled()
		})

		it('should return validation error when userId is empty', async () => {
			const result = await service.onboardNewUser(
				'',
				'Test Org',
				'test-org',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('obrigatório')
			}
		})

		it('should return validation error when organizationName is empty', async () => {
			const result = await service.onboardNewUser(
				TEST_USER_ID,
				'',
				'test-org',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
			}
		})

		it('should return validation error for invalid slug format', async () => {
			const result = await service.onboardNewUser(
				TEST_USER_ID,
				'Test Org',
				'Invalid Slug!',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('slug')
			}
		})

		it('should return validation error when slug already exists', async () => {
			repos.organizationRepository.findBySlug.mockResolvedValue(mockOrganization)

			const result = await service.onboardNewUser(
				TEST_USER_ID,
				'Test Org',
				'test-org',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('slug')
			}
		})

		it('should return database error when organization creation fails', async () => {
			repos.organizationRepository.create.mockRejectedValue(new Error('DB connection failed'))

			const result = await service.onboardNewUser(
				TEST_USER_ID,
				'Test Org',
				'test-org',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('DATABASE_ERROR')
				expect(result.message).toContain('organização')
			}
		})

		it('should rollback organization when membership creation fails', async () => {
			repos.memberRepository.create.mockRejectedValue(new Error('Member creation failed'))

			const result = await service.onboardNewUser(
				TEST_USER_ID,
				'Test Org',
				'test-org',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('DATABASE_ERROR')
				expect(result.message).toContain('associação')
			}

			// Verify rollback was called
			expect(repos.organizationRepository.delete).toHaveBeenCalledWith(TEST_ORG_ID)
		})

		it('should succeed even when billing initialization fails (non-critical)', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			repos.customerRepository.create.mockRejectedValue(new Error('Billing failed'))

			const result = await service.onboardNewUser(
				TEST_USER_ID,
				'Test Org',
				'test-org',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.organization).toEqual(mockOrganization)
				expect(result.data.membership).toEqual(mockMember)
				expect(result.data.customer).toBeNull()
				expect(result.data.subscription).toBeNull()
			}

			expect(consoleSpy).toHaveBeenCalled()
			consoleSpy.mockRestore()
		})

		it('should handle rollback failure gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			repos.memberRepository.create.mockRejectedValue(new Error('Member creation failed'))
			repos.organizationRepository.delete.mockRejectedValue(new Error('Rollback failed'))

			const result = await service.onboardNewUser(
				TEST_USER_ID,
				'Test Org',
				'test-org',
				'user@test.com',
				'Test User',
			)

			expect(result.success).toBe(false)
			expect(consoleSpy).toHaveBeenCalled()
			consoleSpy.mockRestore()
		})

		it('should create subscription with 14-day trial period', async () => {
			const before = Date.now()

			await service.onboardNewUser(
				TEST_USER_ID,
				'Test Org',
				'test-org',
				'user@test.com',
				'Test User',
			)

			const after = Date.now()

			const subscriptionCall = repos.subscriptionRepository.create.mock.calls[0][0]
			expect(subscriptionCall.planName).toBe('free_trial')
			expect(subscriptionCall.status).toBe('active')

			const trialEnd = subscriptionCall.trialEndsAt.getTime()
			const expectedMin = before + 14 * 24 * 60 * 60 * 1000
			const expectedMax = after + 14 * 24 * 60 * 60 * 1000
			expect(trialEnd).toBeGreaterThanOrEqual(expectedMin)
			expect(trialEnd).toBeLessThanOrEqual(expectedMax)
		})
	})
})
