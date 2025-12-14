import type { Member, MemberInsert, MemberUpdate } from '../types'

export interface MemberRepository {
	create(input: MemberInsert): Promise<Member>
	update(id: string, input: MemberUpdate): Promise<Member>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<Member | null>
	findByUserId(userId: string): Promise<Member[]>
	findBySpaceId(spaceId: string): Promise<Member[]>
}
