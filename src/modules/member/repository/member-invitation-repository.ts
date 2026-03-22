import type { MemberInvitation, MemberInvitationInsert, MemberInvitationUpdate } from '../types'

export interface MemberInvitationRepository {
	create(input: MemberInvitationInsert): Promise<MemberInvitation>
	update(id: string, input: MemberInvitationUpdate): Promise<MemberInvitation>
	delete(id: string): Promise<{ deletedId: string }>
	findById(id: string): Promise<MemberInvitation | null>
	findByToken(token: string): Promise<MemberInvitation | null>
	findBySpaceIdAndEmail(spaceId: string, email: string): Promise<MemberInvitation | null>
	findBySpaceId(spaceId: string): Promise<MemberInvitation[]>
}
