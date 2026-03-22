import { db, membersTable } from '@/infra/db'
import { BaseRepository } from '@/infra/repositories'
import { eq } from 'drizzle-orm'
import type { Member, MemberInsert, MemberUpdate } from '../types'
import type { MemberRepository } from './member-repository'

export class MemberDrizzleRepository extends BaseRepository implements MemberRepository {
	async create(input: MemberInsert): Promise<Member> {
		const [result] = await this.db.insert(membersTable).values(this.injectOrgId(input)).returning()

		return result
	}

	async update(id: string, input: MemberUpdate): Promise<Member> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db
			.update(membersTable)
			.set(update)
			.where(this.withOrgFilter(membersTable.organizationId, eq(membersTable._id, id)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(membersTable)
			.where(this.withOrgFilter(membersTable.organizationId, eq(membersTable._id, id)))
			.returning({ deletedId: membersTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Member | null> {
		const [result] = await this.db
			.select()
			.from(membersTable)
			.where(this.withOrgFilter(membersTable.organizationId, eq(membersTable._id, id)))
			.limit(1)

		return result ?? null
	}

	async findByUserId(userId: string): Promise<Member[]> {
		return this.db
			.select()
			.from(membersTable)
			.where(this.withOrgFilter(membersTable.organizationId, eq(membersTable.userId, userId)))
	}

	async findBySpaceId(spaceId: string): Promise<Member[]> {
		return this.db
			.select()
			.from(membersTable)
			.where(this.withOrgFilter(membersTable.organizationId, eq(membersTable.spaceId, spaceId)))
	}

	async findByOrganizationId(organizationId: string): Promise<Member[]> {
		return this.db
			.select()
			.from(membersTable)
			.where(eq(membersTable.organizationId, organizationId))
	}
}

export const memberRepository = (organizationId: string) =>
	new MemberDrizzleRepository(organizationId, db)
