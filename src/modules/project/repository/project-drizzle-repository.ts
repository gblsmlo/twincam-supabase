import { db, projectsTable } from '@/infra/db'
import { BaseRepository } from '@/infra/repositories'
import { eq } from 'drizzle-orm'
import type { Project, ProjectInsert, ProjectUpdate } from '../types'
import type { ProjectRepository } from './project-repository'

export class ProjectDrizzleRepository extends BaseRepository implements ProjectRepository {
	async create(input: ProjectInsert): Promise<Project> {
		const [result] = await this.db.insert(projectsTable).values(this.injectOrgId(input)).returning()

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
			.where(this.withOrgFilter(projectsTable.organizationId, eq(projectsTable._id, id)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(projectsTable)
			.where(this.withOrgFilter(projectsTable.organizationId, eq(projectsTable._id, id)))
			.returning({ deletedId: projectsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Project | null> {
		const [result] = await this.db
			.select()
			.from(projectsTable)
			.where(this.withOrgFilter(projectsTable.organizationId, eq(projectsTable._id, id)))
			.limit(1)

		return result ?? null
	}

	async findBySpaceId(spaceId: string): Promise<Project[]> {
		return await this.db
			.select()
			.from(projectsTable)
			.where(this.withOrgFilter(projectsTable.organizationId, eq(projectsTable.spaceId, spaceId)))
	}

	async findBySlug(slug: string): Promise<Project | null> {
		const [result] = await this.db
			.select()
			.from(projectsTable)
			.where(this.withOrgFilter(projectsTable.organizationId, eq(projectsTable.slug, slug)))
			.limit(1)

		return result ?? null
	}

	async findByOwnerId(ownerId: string): Promise<Project[]> {
		return await this.db
			.select()
			.from(projectsTable)
			.where(this.withOrgFilter(projectsTable.organizationId, eq(projectsTable.ownerId, ownerId)))
	}

	async findByOrganizationId(organizationId: string): Promise<Project[]> {
		return await this.db
			.select()
			.from(projectsTable)
			.where(eq(projectsTable.organizationId, organizationId))
	}
}

export const projectRepository = (organizationId: string) =>
	new ProjectDrizzleRepository(organizationId, db)
