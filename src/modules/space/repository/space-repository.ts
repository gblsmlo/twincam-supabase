import type { Space, SpaceInsert, SpaceInsertFull, SpaceUpdate, SpaceUpdateFull } from '../types'

export interface SpaceRepository {
	create(input: SpaceInsert | SpaceInsertFull): Promise<Space>
	update(id: string, input: SpaceUpdate | SpaceUpdateFull): Promise<Space>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Space | null>
	findByOwnerId(id: string): Promise<Space | null>
	findBySlug(slug: string): Promise<Space | null>
	findByParentId(parentId: string): Promise<Space[]>
	findAncestors(id: string): Promise<Space[]>
	findDescendants(id: string): Promise<Space[]>
}
