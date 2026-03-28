import type {
	Organization,
	OrganizationInsert,
	OrganizationInsertFull,
	OrganizationUpdate,
	OrganizationUpdateFull,
} from '../types'

export interface OrganizationRepository {
	create(input: OrganizationInsert | OrganizationInsertFull): Promise<Organization>
	update(id: string, input: OrganizationUpdate | OrganizationUpdateFull): Promise<Organization>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Organization | null>
	findByOwnerId(id: string): Promise<Organization | null>
	findBySlug(slug: string): Promise<Organization | null>
	findByParentId(parentId: string): Promise<Organization[]>
	findAncestors(id: string): Promise<Organization[]>
	findDescendants(id: string): Promise<Organization[]>
}
