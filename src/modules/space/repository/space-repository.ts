import type { Space, SpaceInsert, SpaceUpdate } from '../types'

export interface SpaceRepository {
	create(input: SpaceInsert): Promise<Space>
	update(id: string, input: SpaceUpdate): Promise<Space>
	delete(id: string): Promise<{ deletedId: string }>
	findByOwnerId(id: string): Promise<Space | null>
	findBySlug(slug: string): Promise<Space | null>
}
