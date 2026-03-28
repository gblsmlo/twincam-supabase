import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrganizationRepository } from '../repository/organization-repository'
import type { Organization } from '../types'
import { HierarchyService } from './hierarchy-service'

const ROOT_ORG_ID = '550e8400-e29b-41d4-a716-446655440010'
const CHILD_ORG_ID = '550e8400-e29b-41d4-a716-446655440011'
const GRANDCHILD_ORG_ID = '550e8400-e29b-41d4-a716-446655440012'
const UNRELATED_ORG_ID = '550e8400-e29b-41d4-a716-446655440013'
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440000'

function createSpace(overrides: Partial<Organization> & { _id: string }): Organization {
	return {
		createdAt: new Date(),
		description: null,
		hierarchyLevel: 1,
		hierarchyPath: '',
		name: 'Test Org',
		ownerId: OWNER_ID,
		parentOrganizationId: null,
		slug: 'test-org',
		updatedAt: new Date(),
		...overrides,
	}
}

const rootOrg = createSpace({ _id: ROOT_ORG_ID, name: 'Root Org', slug: 'root-org' })
const childOrg = createSpace({
	_id: CHILD_ORG_ID,
	hierarchyLevel: 2,
	hierarchyPath: CHILD_ORG_ID,
	name: 'Child Org',
	parentOrganizationId: ROOT_ORG_ID,
	slug: 'child-org',
})
const grandchildOrg = createSpace({
	_id: GRANDCHILD_ORG_ID,
	hierarchyLevel: 3,
	hierarchyPath: `${CHILD_ORG_ID}.${GRANDCHILD_ORG_ID}`,
	name: 'Grandchild Org',
	parentOrganizationId: CHILD_ORG_ID,
	slug: 'grandchild-org',
})
const unrelatedOrg = createSpace({
	_id: UNRELATED_ORG_ID,
	name: 'Unrelated Org',
	slug: 'unrelated-org',
})

function createMockRepo() {
	return {
		create: vi.fn(),
		delete: vi.fn(),
		findAncestors: vi.fn().mockResolvedValue([]),
		findById: vi.fn().mockResolvedValue(null),
		findByOwnerId: vi.fn(),
		findByParentId: vi.fn().mockResolvedValue([]),
		findBySlug: vi.fn(),
		findDescendants: vi.fn(),
		update: vi
			.fn()
			.mockImplementation((_id, input) => Promise.resolve(createSpace({ _id, ...input }))),
	} satisfies Record<keyof OrganizationRepository, unknown>
}

describe('HierarchyService', () => {
	let service: HierarchyService
	let repo: ReturnType<typeof createMockRepo>

	beforeEach(() => {
		vi.clearAllMocks()
		repo = createMockRepo()
		service = new HierarchyService(repo)
	})

	describe('validateMove', () => {
		it('should reject self-parent move', async () => {
			const result = await service.validateMove(ROOT_ORG_ID, ROOT_ORG_ID)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('si mesma')
			}
		})

		it('should accept move to root (newParentId = null)', async () => {
			const result = await service.validateMove(CHILD_ORG_ID, null)

			expect(result.success).toBe(true)
		})

		it('should reject move to non-existent parent', async () => {
			repo.findById.mockResolvedValue(null)

			const result = await service.validateMove(ROOT_ORG_ID, 'non-existent-id')

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('NOT_FOUND_ERROR')
				expect(result.message).toContain('não encontrada')
			}
		})

		it('should reject move that would create a cycle', async () => {
			repo.findById.mockResolvedValue(grandchildOrg)
			repo.findAncestors.mockResolvedValue([childOrg, rootOrg])

			const result = await service.validateMove(ROOT_ORG_ID, GRANDCHILD_ORG_ID)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
				expect(result.message).toContain('ciclo')
			}
		})

		it('should accept valid move (no cycle)', async () => {
			repo.findById.mockResolvedValue(unrelatedOrg)
			repo.findAncestors.mockResolvedValue([])

			const result = await service.validateMove(CHILD_ORG_ID, UNRELATED_ORG_ID)

			expect(result.success).toBe(true)
		})
	})

	describe('moveOrganization', () => {
		it('should update hierarchy path when moving to a new parent', async () => {
			repo.findById.mockResolvedValue(unrelatedOrg)
			repo.findAncestors.mockResolvedValue([])
			repo.findByParentId.mockResolvedValue([])

			const result = await service.moveOrganization(CHILD_ORG_ID, UNRELATED_ORG_ID)

			expect(result.success).toBe(true)
			expect(repo.update).toHaveBeenCalledWith(CHILD_ORG_ID, {
				hierarchyLevel: 2,
				hierarchyPath: CHILD_ORG_ID,
				parentOrganizationId: UNRELATED_ORG_ID,
			})
		})

		it('should update hierarchy to root when moving to null parent', async () => {
			repo.findByParentId.mockResolvedValue([])

			const result = await service.moveOrganization(CHILD_ORG_ID, null)

			expect(result.success).toBe(true)
			expect(repo.update).toHaveBeenCalledWith(CHILD_ORG_ID, {
				hierarchyLevel: 1,
				hierarchyPath: '',
				parentOrganizationId: null,
			})
		})

		it('should cascade update descendants when moving', async () => {
			repo.findById.mockResolvedValue(unrelatedOrg)
			repo.findAncestors.mockResolvedValue([])
			repo.findByParentId
				.mockResolvedValueOnce([childOrg])
				.mockResolvedValueOnce([grandchildOrg])
				.mockResolvedValueOnce([])

			await service.moveOrganization(ROOT_ORG_ID, UNRELATED_ORG_ID)

			// Root updated
			expect(repo.update).toHaveBeenCalledWith(ROOT_ORG_ID, {
				hierarchyLevel: 2,
				hierarchyPath: ROOT_ORG_ID,
				parentOrganizationId: UNRELATED_ORG_ID,
			})

			// Child cascaded
			expect(repo.update).toHaveBeenCalledWith(CHILD_ORG_ID, {
				hierarchyLevel: 3,
				hierarchyPath: `${ROOT_ORG_ID}.${CHILD_ORG_ID}`,
			})

			// Grandchild cascaded
			expect(repo.update).toHaveBeenCalledWith(GRANDCHILD_ORG_ID, {
				hierarchyLevel: 4,
				hierarchyPath: `${ROOT_ORG_ID}.${CHILD_ORG_ID}.${GRANDCHILD_ORG_ID}`,
			})
		})

		it('should return validation error on invalid move', async () => {
			const result = await service.moveOrganization(ROOT_ORG_ID, ROOT_ORG_ID)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('VALIDATION_ERROR')
			}
			expect(repo.update).not.toHaveBeenCalled()
		})
	})

	describe('getOrganizationTree', () => {
		it('should return NOT_FOUND when root does not exist', async () => {
			repo.findById.mockResolvedValue(null)

			const result = await service.getOrganizationTree('non-existent')

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.type).toBe('NOT_FOUND_ERROR')
			}
		})

		it('should return a tree structure with children', async () => {
			repo.findById.mockResolvedValue(rootOrg)
			repo.findByParentId
				.mockResolvedValueOnce([childOrg])
				.mockResolvedValueOnce([grandchildOrg])
				.mockResolvedValueOnce([])

			const result = await service.getOrganizationTree(ROOT_ORG_ID)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.id).toBe(ROOT_ORG_ID)
				expect(result.data.name).toBe('Root Org')
				expect(result.data.level).toBe(1)
				expect(result.data.children).toHaveLength(1)
				expect(result.data.children[0].id).toBe(CHILD_ORG_ID)
				expect(result.data.children[0].children).toHaveLength(1)
				expect(result.data.children[0].children[0].id).toBe(GRANDCHILD_ORG_ID)
				expect(result.data.children[0].children[0].children).toHaveLength(0)
			}
		})

		it('should return a leaf node with empty children', async () => {
			repo.findById.mockResolvedValue(grandchildOrg)
			repo.findByParentId.mockResolvedValue([])

			const result = await service.getOrganizationTree(GRANDCHILD_ORG_ID)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.id).toBe(GRANDCHILD_ORG_ID)
				expect(result.data.children).toHaveLength(0)
			}
		})
	})
})
