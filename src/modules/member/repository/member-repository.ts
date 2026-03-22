import type { Member, MemberInsert, MemberUpdate } from '../types'

/**
 * Repository scoped to a specific organization.
 * All queries are automatically filtered by the organizationId provided
 * at construction time via the factory function.
 */
export interface MemberRepository {
	create(input: Omit<MemberInsert, 'organizationId'>): Promise<Member>
	update(id: string, input: MemberUpdate): Promise<Member>
	delete(id: string): Promise<{ deletedId: string }>
	deleteIfNotLastOwner(id: string, spaceId: string): Promise<{ deletedId: string } | null>
	findById(id: string): Promise<Member | null>
	findByUserId(userId: string): Promise<Member[]>
	findByUserIdAndSpaceId(userId: string, spaceId: string): Promise<Member | null>
	findBySpaceId(spaceId: string): Promise<Member[]>
	findByOrganizationId(organizationId: string): Promise<Member[]>
}
