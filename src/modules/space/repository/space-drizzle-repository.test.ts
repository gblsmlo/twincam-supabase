import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	spacesTable: {
		_id: 'mock-id',
		description: 'mock-description',
		name: 'mock-name',
		ownerId: 'mock-ownerId',
		slug: 'mock-slug',
	},
}))

import type { Database } from '@/infra/db'
import { spacesTable } from '@/infra/db'
import type { Space, SpaceInsert, SpaceUpdate } from '../types'
import { SpaceDrizzleRepository } from './space-drizzle-repository'

const mockSpace: Space = {
	_id: '550e8400-e29b-41d4-a716-446655440000',
	createdAt: new Date(),
	description: 'Test space description',
	name: 'Test Space',
	ownerId: '550e8400-e29b-41d4-a716-446655440001',
	slug: 'test-space',
	updatedAt: new Date(),
}

const mockSpaceInsert: SpaceInsert = {
	_id: mockSpace._id,
	description: mockSpace.description,
	name: mockSpace.name,
	ownerId: mockSpace.ownerId,
	slug: mockSpace.slug,
}

const mockSpaceUpdate: SpaceUpdate = {
	description: 'Updated description',
	name: 'Updated Space Name',
}

describe('SpaceDrizzleRepository', () => {
	let repository: SpaceDrizzleRepository
	let mockDb: Database

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('create', () => {
		it('should create a new space successfully', async () => {
			const mockValues = vi.fn().mockResolvedValue([mockSpace])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			const result = await repository.create(mockSpaceInsert)

			expect(mockInsert).toHaveBeenCalledWith(spacesTable)
			expect(mockValues).toHaveBeenCalledWith(mockSpaceInsert)
			expect(result).toEqual(mockSpace)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockValues = vi.fn().mockRejectedValue(dbError)
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			await expect(repository.create(mockSpaceInsert)).rejects.toThrow('Database connection failed')
		})

		it('should create space with only required fields', async () => {
			const minimalInsert: SpaceInsert = {
				_id: mockSpace._id,
				name: mockSpace.name,
				ownerId: mockSpace.ownerId,
				slug: mockSpace.slug,
			}
			const minimalSpace = { ...mockSpace, description: null }

			const mockValues = vi.fn().mockResolvedValue([minimalSpace])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			const result = await repository.create(minimalInsert)

			expect(result).toEqual(minimalSpace)
			expect(mockValues).toHaveBeenCalledWith(minimalInsert)
		})
	})

	describe('update', () => {
		it('should update existing space successfully', async () => {
			const updatedSpace = { ...mockSpace, ...mockSpaceUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedSpace])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			const result = await repository.update(mockSpace._id, mockSpaceUpdate)

			expect(mockUpdate).toHaveBeenCalledWith(spacesTable)
			expect(mockSet).toHaveBeenCalled()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg).toHaveProperty('updatedAt')
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.name).toBe(mockSpaceUpdate.name)
			expect(setCallArg.description).toBe(mockSpaceUpdate.description)

			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(updatedSpace)
		})

		it('should update existing space successfully', async () => {
			const dateBefore = new Date()
			const updatedSpace = { ...mockSpace, ...mockSpaceUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedSpace])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			await repository.update(mockSpace._id, mockSpaceUpdate)
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

			repository = new SpaceDrizzleRepository(mockDb)

			await expect(repository.update(mockSpace._id, mockSpaceUpdate)).rejects.toThrow(
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

			repository = new SpaceDrizzleRepository(mockDb)

			const result = await repository.update('non-existent-id', mockSpaceUpdate)

			expect(result).toBeUndefined()
		})
	})

	describe('delete', () => {
		it('should delete a space successfully and return deletedId', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockSpace._id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			const result = await repository.delete(mockSpace._id)

			expect(mockDelete).toHaveBeenCalledWith(spacesTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockReturning).toHaveBeenCalled()
			expect(result).toEqual({ deletedId: mockSpace._id })
		})

		it('should propagar erro quando a deleção falhar', async () => {
			const dbError = new Error('Delete failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			await expect(repository.delete(mockSpace._id)).rejects.toThrow('Delete failed')
		})

		it('should handle attempt to delete non-existent record', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			const result = await repository.delete('non-existent-id')

			expect(result.deletedId).toBeUndefined()
		})
	})

	describe('findByOwnerId', () => {
		it('deve encontrar espaço pelo ownerId com sucesso', async () => {
			// Arrange
			const mockLimit = vi.fn().mockResolvedValue([mockSpace])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			// Act
			const result = await repository.findByOwnerId(mockSpace.ownerId)

			// Assert
			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(spacesTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockSpace)
		})

		it('deve retornar undefined quando nenhum espaço for encontrado', async () => {
			// Arrange
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			// Act
			const result = await repository.findByOwnerId('non-existent-owner')

			// Assert
			expect(result).toBeUndefined()
		})

		it('deve propagar erro quando a busca falhar', async () => {
			// Arrange
			const dbError = new Error('Query failed')
			const mockLimit = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			// Act & Assert
			await expect(repository.findByOwnerId(mockSpace.ownerId)).rejects.toThrow('Query failed')
		})
	})

	describe('findBySlug', () => {
		it('should find space by slug successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockSpace])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			const result = await repository.findBySlug(mockSpace.slug)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(spacesTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockSpace)
		})

		it('should return undefined when slug is not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			// Act
			const result = await repository.findBySlug('non-existent-slug')

			// Assert
			expect(result).toBeUndefined()
		})

		it('should throw error when query fails', async () => {
			const dbError = new Error('Query failed')
			const mockLimit = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			await expect(repository.findBySlug(mockSpace.slug)).rejects.toThrow('Query failed')
		})

		it('should return undefined when slug is not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new SpaceDrizzleRepository(mockDb)

			const result = await repository.findBySlug('TEST-SPACE')

			expect(result).toBeUndefined()
		})
	})
})
