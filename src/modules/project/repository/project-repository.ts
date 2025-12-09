import type { Project, ProjectInsert, ProjectUpdate } from '../types'

export interface ProjectRepository {
	create(input: ProjectInsert): Promise<Project>
	update(id: string, input: ProjectUpdate): Promise<Project>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Project | null>
	findBySpaceId(spaceId: string): Promise<Project[]>
	findBySlug(slug: string): Promise<Project | null>
	findByOwnerId(ownerId: string): Promise<Project[]>
}
