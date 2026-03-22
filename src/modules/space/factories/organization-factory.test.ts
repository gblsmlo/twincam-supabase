import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpaceRepository } from '../repository/space-repository'
import type { Space } from '../types'
import { OrganizationFactory } from './organization-factory'

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440001'

const mockRootOrg: Space = {
	_id: TEST_ORG_ID,
	createdAt: new Date(),
	description: null,
	hierarchyLevel: 1,
	hierarchyPath: '',
	name: 'Root Org',
	ownerId: TEST_USER_ID,
	parentOrganizationId: null,
	slug: 'root-org',
	updatedAt: new Date(),
}

function createMockSpaceRepository(): SpaceRepository {
	return {
		create: vi.fn(),
		delete: vi.fn(),
		findAncestors: vi.fn(),
		findByOwnerId: vi.fn().mockResolvedValue(null),
		findByParentId: vi.fn(),
		findBySlug: vi.fn().mockResolvedValue(null),
		findDescendants: vi.fn(),
		update: vi.fn(),
	}
}

describe('OrganizationFactory', () => {
	describe('createRootOrganization', () => {
		it('should create root organization input with hierarchy level 1', () => {
			const result = OrganizationFactory.createRootOrganization('My Org', 'my-org', TEST_USER_ID)

			expect(result).toEqual({
				hierarchyLevel: 1,
				hierarchyPath: '',
				name: 'My Org',
				ownerId: TEST_USER_ID,
				parentOrganizationId: null,
				slug: 'my-org',
			})
		})
	})

	describe('createSubAccount', () => {
		it('should compute hierarchy path from root parent', () => {
			const result = OrganizationFactory.createSubAccount(
				mockRootOrg,
				'Child Org',
				'child-org',
				TEST_USER_ID,
			)

			expect(result.hierarchyLevel).toBe(2)
			expect(result.hierarchyPath).toBe(TEST_ORG_ID)
			expect(result.parentOrganizationId).toBe(TEST_ORG_ID)
		})

		it('should append to existing hierarchy path', () => {
			const parentWithPath: Space = {
				...mockRootOrg,
				_id: 'parent-id',
				hierarchyLevel: 2,
				hierarchyPath: 'grandparent-id',
			}

			const result = OrganizationFactory.createSubAccount(
				parentWithPath,
				'Grandchild',
				'grandchild',
				TEST_USER_ID,
			)

			expect(result.hierarchyLevel).toBe(3)
			expect(result.hierarchyPath).toBe('grandparent-id.parent-id')
			expect(result.parentOrganizationId).toBe('parent-id')
		})
	})

	describe('validateOrganization', () => {
		it('should pass validation with valid inputs', () => {
			const result = OrganizationFactory.validateOrganization({
				name: 'Valid Org',
				ownerId: TEST_USER_ID,
				slug: 'valid-org',
			})

			expect(result.success).toBe(true)
		})

		it('should fail when name is empty', () => {
			const result = OrganizationFactory.validateOrganization({
				name: '',
				ownerId: TEST_USER_ID,
				slug: 'valid-org',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('nome')
			}
		})

		it('should fail when slug has invalid characters', () => {
			const result = OrganizationFactory.validateOrganization({
				name: 'Valid',
				ownerId: TEST_USER_ID,
				slug: 'Invalid Slug!',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('slug')
			}
		})

		it('should fail when slug is too short', () => {
			const result = OrganizationFactory.validateOrganization({
				name: 'Valid',
				ownerId: TEST_USER_ID,
				slug: 'ab',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('3')
			}
		})

		it('should fail when slug is too long', () => {
			const result = OrganizationFactory.validateOrganization({
				name: 'Valid',
				ownerId: TEST_USER_ID,
				slug: 'a'.repeat(51),
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('50')
			}
		})

		it('should fail when ownerId is empty', () => {
			const result = OrganizationFactory.validateOrganization({
				name: 'Valid',
				ownerId: '',
				slug: 'valid-org',
			})

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('proprietário')
			}
		})
	})

	describe('createOrganizationWithValidation', () => {
		let repo: SpaceRepository

		beforeEach(() => {
			repo = createMockSpaceRepository()
		})

		it('should create root organization when no parentId', async () => {
			const result = await OrganizationFactory.createOrganizationWithValidation(
				{ name: 'My Org', ownerId: TEST_USER_ID, slug: 'my-org' },
				repo,
			)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual({
					hierarchyLevel: 1,
					hierarchyPath: '',
					name: 'My Org',
					ownerId: TEST_USER_ID,
					parentOrganizationId: null,
					slug: 'my-org',
				})
			}
		})

		it('should fail when slug already exists', async () => {
			vi.mocked(repo.findBySlug).mockResolvedValue(mockRootOrg)

			const result = await OrganizationFactory.createOrganizationWithValidation(
				{ name: 'My Org', ownerId: TEST_USER_ID, slug: 'root-org' },
				repo,
			)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('slug')
			}
		})

		it('should fail when parent organization not found', async () => {
			vi.mocked(repo.findByOwnerId).mockResolvedValue(null)

			const result = await OrganizationFactory.createOrganizationWithValidation(
				{ name: 'Child', ownerId: TEST_USER_ID, parentId: 'nonexistent', slug: 'child' },
				repo,
			)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('NOT_FOUND_ERROR')
				expect(result.message).toContain('pai')
			}
		})

		it('should create sub-account when parent exists', async () => {
			vi.mocked(repo.findByOwnerId).mockResolvedValue(mockRootOrg)

			const result = await OrganizationFactory.createOrganizationWithValidation(
				{ name: 'Child', ownerId: TEST_USER_ID, parentId: TEST_ORG_ID, slug: 'child' },
				repo,
			)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toMatchObject({
					hierarchyLevel: 2,
					name: 'Child',
					parentOrganizationId: TEST_ORG_ID,
					slug: 'child',
				})
			}
		})

		it('should fail validation before checking slug uniqueness', async () => {
			const result = await OrganizationFactory.createOrganizationWithValidation(
				{ name: '', ownerId: TEST_USER_ID, slug: 'valid' },
				repo,
			)

			expect(result.success).toBe(false)
			expect(repo.findBySlug).not.toHaveBeenCalled()
		})
	})
})
