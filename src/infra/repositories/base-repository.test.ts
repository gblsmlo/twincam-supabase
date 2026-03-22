import type { Database } from '@/infra/db'
import { describe, expect, it } from 'vitest'
import { BaseRepository } from './base-repository'

class TestRepository extends BaseRepository {
	testInjectOrgId<T extends Record<string, unknown>>(input: T) {
		return this.injectOrgId(input)
	}

	getOrganizationId() {
		return this.organizationId
	}

	getDb() {
		return this.db
	}
}

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440099'

describe('BaseRepository', () => {
	describe('constructor', () => {
		it('should create instance with valid organizationId', () => {
			const mockDb = {} as Database
			const repo = new TestRepository(TEST_ORG_ID, mockDb)

			expect(repo.getOrganizationId()).toBe(TEST_ORG_ID)
			expect(repo.getDb()).toBe(mockDb)
		})

		it('should throw when organizationId is empty string', () => {
			const mockDb = {} as Database
			expect(() => new TestRepository('', mockDb)).toThrow(
				'Organization ID is required for repository',
			)
		})
	})

	describe('injectOrgId', () => {
		it('should add organizationId to input', () => {
			const mockDb = {} as Database
			const repo = new TestRepository(TEST_ORG_ID, mockDb)

			const input = { description: 'Desc', name: 'Test' }
			const result = repo.testInjectOrgId(input)

			expect(result).toEqual({
				description: 'Desc',
				name: 'Test',
				organizationId: TEST_ORG_ID,
			})
		})

		it('should override existing organizationId', () => {
			const mockDb = {} as Database
			const repo = new TestRepository(TEST_ORG_ID, mockDb)

			const input = { name: 'Test', organizationId: 'other-org' }
			const result = repo.testInjectOrgId(input)

			expect(result.organizationId).toBe(TEST_ORG_ID)
		})
	})
})
