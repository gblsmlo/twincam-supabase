import { type Database, db, projectsTable } from '@/infra/db'
import { and, eq } from 'drizzle-orm'
import type { Project, ProjectInsert, ProjectUpdate } from '../types'
import type { ProjectRepository } from './project-repository'

export class ProjectDrizzleRepository implements ProjectRepository {
	constructor(
		private db: Database,
		private organizationId: string,
	) {}

	async create(input: ProjectInsert): Promise<Project> {
		const [result] = await this.db
			.insert(projectsTable)
			.values({ ...input, organizationId: this.organizationId })
			.returning()

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
			.where(and(eq(projectsTable._id, id), eq(projectsTable.organizationId, this.organizationId)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(projectsTable)
			.where(and(eq(projectsTable._id, id), eq(projectsTable.organizationId, this.organizationId)))
			.returning({ deletedId: projectsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Project | null> {
		const [result] = await this.db
			.select()
			.from(projectsTable)
			.where(and(eq(projectsTable._id, id), eq(projectsTable.organizationId, this.organizationId)))
			.limit(1)

		return result ?? null
	}

	async findBySpaceId(spaceId: string): Promise<Project[]> {
		const results = await this.db
			.select()
			.from(projectsTable)
			.where(
				and(
					eq(projectsTable.spaceId, spaceId),
					eq(projectsTable.organizationId, this.organizationId),
				),
			)

		return results
	}

	async findBySlug(slug: string): Promise<Project | null> {
		const [result] = await this.db
			.select()
			.from(projectsTable)
			.where(
				and(eq(projectsTable.slug, slug), eq(projectsTable.organizationId, this.organizationId)),
			)
			.limit(1)

		return result ?? null
	}

	async findByOwnerId(ownerId: string): Promise<Project[]> {
		const results = await this.db
			.select()
			.from(projectsTable)
			.where(
				and(
					eq(projectsTable.ownerId, ownerId),
					eq(projectsTable.organizationId, this.organizationId),
				),
			)

		return results
	}

	async findByOrganizationId(organizationId: string): Promise<Project[]> {
		const results = await this.db
			.select()
			.from(projectsTable)
			.where(eq(projectsTable.organizationId, organizationId))

		return results
	}
}

export const projectRepository = (organizationId: string) =>
	new ProjectDrizzleRepository(db, organizationId)
