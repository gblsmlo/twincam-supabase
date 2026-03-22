import { db, memberInvitationsTable } from '@/infra/db'
import { BaseRepository } from '@/infra/repositories'
import { and, eq } from 'drizzle-orm'
import type { MemberInvitation, MemberInvitationInsert, MemberInvitationUpdate } from '../types'
import type { MemberInvitationRepository } from './member-invitation-repository'

export class MemberInvitationDrizzleRepository
	extends BaseRepository
	implements MemberInvitationRepository
{
	async create(input: Omit<MemberInvitationInsert, 'organizationId'>): Promise<MemberInvitation> {
		const [result] = await this.db
			.insert(memberInvitationsTable)
			.values(this.injectOrgId(input))
			.returning()

		return result
	}

	async update(id: string, input: MemberInvitationUpdate): Promise<MemberInvitation> {
		const [result] = await this.db
			.update(memberInvitationsTable)
			.set({ ...input, updatedAt: new Date() })
			.where(
				this.withOrgFilter(
					memberInvitationsTable.organizationId,
					eq(memberInvitationsTable._id, id),
				),
			)
			.returning()

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(memberInvitationsTable)
			.where(
				this.withOrgFilter(
					memberInvitationsTable.organizationId,
					eq(memberInvitationsTable._id, id),
				),
			)
			.returning({ deletedId: memberInvitationsTable._id })

		return { deletedId: result?.deletedId }
	}

	async findById(id: string): Promise<MemberInvitation | null> {
		const [result] = await this.db
			.select()
			.from(memberInvitationsTable)
			.where(
				this.withOrgFilter(
					memberInvitationsTable.organizationId,
					eq(memberInvitationsTable._id, id),
				),
			)
			.limit(1)

		return result ?? null
	}

	async findByToken(token: string): Promise<MemberInvitation | null> {
		const [result] = await this.db
			.select()
			.from(memberInvitationsTable)
			.where(
				this.withOrgFilter(
					memberInvitationsTable.organizationId,
					eq(memberInvitationsTable.token, token),
				),
			)
			.limit(1)

		return result ?? null
	}

	async findBySpaceIdAndEmail(spaceId: string, email: string): Promise<MemberInvitation | null> {
		const [result] = await this.db
			.select()
			.from(memberInvitationsTable)
			.where(
				this.withOrgFilter(
					memberInvitationsTable.organizationId,
					and(eq(memberInvitationsTable.spaceId, spaceId), eq(memberInvitationsTable.email, email)),
				),
			)
			.limit(1)

		return result ?? null
	}

	async findBySpaceId(spaceId: string): Promise<MemberInvitation[]> {
		return this.db
			.select()
			.from(memberInvitationsTable)
			.where(
				this.withOrgFilter(
					memberInvitationsTable.organizationId,
					eq(memberInvitationsTable.spaceId, spaceId),
				),
			)
	}
}

export const memberInvitationRepository = (organizationId: string) =>
	new MemberInvitationDrizzleRepository(organizationId, db)
