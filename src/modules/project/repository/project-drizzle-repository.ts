import { type Database, db, projectsTable } from '@/infra/db'
import { eq } from 'drizzle-orm'
import type { Project, ProjectInsert, ProjectUpdate } from '../types'
import type { ProjectRepository } from './project-repository'

export class ProjectDrizzleRepository implements ProjectRepository {
	constructor(private db: Database) {}

	async create(input: ProjectInsert): Promise<Project> {
		const [result] = await this.db.insert(projectsTable).values(input)

		return result
	}

	async update(id: string, input: ProjectUpdate): Promise<Project> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db
			.update(projectsTable)
			.set(update)
			.where(eq(projectsTable._id, id))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(projectsTable)
			.where(eq(projectsTable._id, id))
			.returning({ deletedId: projectsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Project | null> {
		const [result] = await this.db
			.select()
			.from(projectsTable)
			.where(eq(projectsTable._id, id))
			.limit(1)

		return result
	}

	async findBySpaceId(spaceId: string): Promise<Project[]> {
		const results = await this.db
			.select()
			.from(projectsTable)
			.where(eq(projectsTable.spaceId, spaceId))

		return results
	}

	async findBySlug(slug: string): Promise<Project | null> {
		const [result] = await this.db
			.select()
			.from(projectsTable)
			.where(eq(projectsTable.slug, slug))
			.limit(1)

		return result
	}

	async findByOwnerId(ownerId: string): Promise<Project[]> {
		const results = await this.db
			.select()
			.from(projectsTable)
			.where(eq(projectsTable.ownerId, ownerId))

		return results
	}
}

export const projectRepository = () => new ProjectDrizzleRepository(db)
