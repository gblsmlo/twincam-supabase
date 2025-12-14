import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	projectsTable: {
		description: 'mock-description',
		id: 'mock-id',
		name: 'mock-name',
		ownerId: 'mock-ownerId',
		slug: 'mock-slug',
		spaceId: 'mock-spaceId',
	},
}))

import type { Database } from '@/infra/db'
import { projectsTable } from '@/infra/db'
import type { Project, ProjectInsert, ProjectUpdate } from '../types'
import { ProjectDrizzleRepository } from './project-drizzle-repository'

const mockProject: Project = {
	_id: '550e8400-e29b-41d4-a716-446655440200',
	createdAt: new Date(),
	description: 'Test project description',
	name: 'Test Project',
	ownerId: '550e8400-e29b-41d4-a716-446655440001',
	slug: 'test-project',
	spaceId: '550e8400-e29b-41d4-a716-446655440000',
	updatedAt: new Date(),
}

const mockProjectInsert: ProjectInsert = {
	_id: mockProject._id,
	description: mockProject.description,
	name: mockProject.name,
	ownerId: mockProject.ownerId,
	slug: mockProject.slug,
	spaceId: mockProject.spaceId,
}

const mockProjectUpdate: ProjectUpdate = {
	description: 'Updated description',
	name: 'Updated Project Name',
}

describe('ProjectDrizzleRepository', () => {
	let repository: ProjectDrizzleRepository
	let mockDb: Database

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('create', () => {
		it('should create a new project successfully', async () => {
			const mockValues = vi.fn().mockResolvedValue([mockProject])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.create(mockProjectInsert)

			expect(mockInsert).toHaveBeenCalledWith(projectsTable)
			expect(mockValues).toHaveBeenCalledWith(mockProjectInsert)
			expect(result).toEqual(mockProject)
		})

		it('should propagate error when database fails', async () => {
			const dbError = new Error('Database connection failed')
			const mockValues = vi.fn().mockRejectedValue(dbError)
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			await expect(repository.create(mockProjectInsert)).rejects.toThrow(
				'Database connection failed',
			)
		})

		it('should create project with only required fields', async () => {
			const minimalInsert: ProjectInsert = {
				_id: mockProject._id,
				name: mockProject.name,
				ownerId: mockProject.ownerId,
				slug: mockProject.slug,
				spaceId: mockProject.spaceId,
			}
			const minimalProject = { ...mockProject, description: null }

			const mockValues = vi.fn().mockResolvedValue([minimalProject])
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

			mockDb = {
				insert: mockInsert,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.create(minimalInsert)

			expect(result).toEqual(minimalProject)
			expect(mockValues).toHaveBeenCalledWith(minimalInsert)
		})
	})

	describe('update', () => {
		it('should update existing project successfully', async () => {
			const updatedProject = { ...mockProject, ...mockProjectUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedProject])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.update(mockProject._id, mockProjectUpdate)

			expect(mockUpdate).toHaveBeenCalledWith(projectsTable)
			expect(mockSet).toHaveBeenCalled()

			const setCallArg = mockSet.mock.calls[0][0]
			expect(setCallArg).toHaveProperty('updatedAt')
			expect(setCallArg.updatedAt).toBeInstanceOf(Date)
			expect(setCallArg.name).toBe(mockProjectUpdate.name)
			expect(setCallArg.description).toBe(mockProjectUpdate.description)

			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual(updatedProject)
		})

		it('should set updatedAt with current date', async () => {
			const dateBefore = new Date()
			const updatedProject = { ...mockProject, ...mockProjectUpdate }
			const mockWhere = vi.fn().mockResolvedValue([updatedProject])
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

			mockDb = {
				update: mockUpdate,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			await repository.update(mockProject._id, mockProjectUpdate)
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

			repository = new ProjectDrizzleRepository(mockDb)

			await expect(repository.update(mockProject._id, mockProjectUpdate)).rejects.toThrow(
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

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.update('non-existent-id', mockProjectUpdate)

			expect(result).toBeUndefined()
		})
	})

	describe('delete', () => {
		it('should delete a project successfully and return deletedId', async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ deletedId: mockProject._id }])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.delete(mockProject._id)

			expect(mockDelete).toHaveBeenCalledWith(projectsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockReturning).toHaveBeenCalled()
			expect(result).toEqual({ deletedId: mockProject._id })
		})

		it('should propagate error when delete fails', async () => {
			const dbError = new Error('Delete failed')
			const mockReturning = vi.fn().mockRejectedValue(dbError)
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			await expect(repository.delete(mockProject._id)).rejects.toThrow('Delete failed')
		})

		it('should handle attempt to delete non-existent record', async () => {
			const mockReturning = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
			const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })

			mockDb = {
				delete: mockDelete,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.delete('non-existent-id')

			expect(result.deletedId).toBeUndefined()
		})
	})

	describe('findById', () => {
		it('should find project by id successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockProject])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findById(mockProject._id)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(projectsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockProject)
		})

		it('should return undefined when no project is found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findById('non-existent-id')

			expect(result).toBeUndefined()
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

			repository = new ProjectDrizzleRepository(mockDb)

			await expect(repository.findById(mockProject._id)).rejects.toThrow('Query failed')
		})
	})

	describe('findBySpaceId', () => {
		it('should find projects by spaceId successfully', async () => {
			const mockWhere = vi.fn().mockResolvedValue([mockProject])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findBySpaceId(mockProject.spaceId)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(projectsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([mockProject])
		})

		it('should return empty array when no projects found', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

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

			repository = new ProjectDrizzleRepository(mockDb)

			await expect(repository.findBySpaceId(mockProject.spaceId)).rejects.toThrow('Query failed')
		})

		it('should return multiple projects when found', async () => {
			const secondProject: Project = {
				...mockProject,
				_id: '550e8400-e29b-41d4-a716-446655440201',
				name: 'Second Project',
				slug: 'second-project',
			}
			const mockWhere = vi.fn().mockResolvedValue([mockProject, secondProject])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findBySpaceId(mockProject.spaceId)

			expect(result).toHaveLength(2)
			expect(result).toEqual([mockProject, secondProject])
		})
	})

	describe('findBySlug', () => {
		it('should find project by slug successfully', async () => {
			const mockLimit = vi.fn().mockResolvedValue([mockProject])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findBySlug(mockProject.slug)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(projectsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(mockLimit).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockProject)
		})

		it('should return undefined when slug is not found', async () => {
			const mockLimit = vi.fn().mockResolvedValue([])
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findBySlug('non-existent-slug')

			expect(result).toBeUndefined()
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

			repository = new ProjectDrizzleRepository(mockDb)

			await expect(repository.findBySlug(mockProject.slug)).rejects.toThrow('Query failed')
		})
	})

	describe('findByOwnerId', () => {
		it('should find projects by ownerId successfully', async () => {
			const mockWhere = vi.fn().mockResolvedValue([mockProject])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findByOwnerId(mockProject.ownerId)

			expect(mockSelect).toHaveBeenCalled()
			expect(mockFrom).toHaveBeenCalledWith(projectsTable)
			expect(mockWhere).toHaveBeenCalled()
			expect(result).toEqual([mockProject])
		})

		it('should return empty array when no projects found', async () => {
			const mockWhere = vi.fn().mockResolvedValue([])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findByOwnerId('non-existent-owner')

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

			repository = new ProjectDrizzleRepository(mockDb)

			await expect(repository.findByOwnerId(mockProject.ownerId)).rejects.toThrow('Query failed')
		})

		it('should return multiple projects when found', async () => {
			const secondProject: Project = {
				...mockProject,
				_id: '550e8400-e29b-41d4-a716-446655440202',
				name: 'Another Project',
				slug: 'another-project',
				spaceId: '550e8400-e29b-41d4-a716-446655440003',
			}
			const mockWhere = vi.fn().mockResolvedValue([mockProject, secondProject])
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

			mockDb = {
				select: mockSelect,
			} as unknown as Database

			repository = new ProjectDrizzleRepository(mockDb)

			const result = await repository.findByOwnerId(mockProject.ownerId)

			expect(result).toHaveLength(2)
			expect(result).toEqual([mockProject, secondProject])
		})
	})
})
