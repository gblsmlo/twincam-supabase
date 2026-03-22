import type { Project, ProjectInsert, ProjectUpdate } from '../types'

/**
 * Repository scoped to a specific organization.
 * All queries are automatically filtered by the organizationId provided
 * at construction time via the factory function.
 */
export interface ProjectRepository {
	create(input: ProjectInsert): Promise<Project>
	update(id: string, input: ProjectUpdate): Promise<Project>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Project | null>
	findBySpaceId(spaceId: string): Promise<Project[]>
	findBySlug(slug: string): Promise<Project | null>
	findByOwnerId(ownerId: string): Promise<Project[]>
	findByOrganizationId(organizationId: string): Promise<Project[]>
}
