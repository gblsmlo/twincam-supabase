import { type Database, db, membersTable } from '@/infra/db'
import { and, eq } from 'drizzle-orm'
import type { Member, MemberInsert, MemberUpdate } from '../types'
import type { MemberRepository } from './member-repository'

export class MemberDrizzleRepository implements MemberRepository {
	constructor(
		private db: Database,
		private organizationId: string,
	) {}

	async create(input: MemberInsert): Promise<Member> {
		const [result] = await this.db
			.insert(membersTable)
			.values({ ...input, organizationId: this.organizationId })
			.returning()

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
			.where(and(eq(membersTable._id, id), eq(membersTable.organizationId, this.organizationId)))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(membersTable)
			.where(and(eq(membersTable._id, id), eq(membersTable.organizationId, this.organizationId)))
			.returning({ deletedId: membersTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Member | null> {
		const [result] = await this.db
			.select()
			.from(membersTable)
			.where(and(eq(membersTable._id, id), eq(membersTable.organizationId, this.organizationId)))
			.limit(1)

		return result ?? null
	}

	async findByUserId(userId: string): Promise<Member[]> {
		return this.db
			.select()
			.from(membersTable)
			.where(
				and(eq(membersTable.userId, userId), eq(membersTable.organizationId, this.organizationId)),
			)
	}

	async findBySpaceId(spaceId: string): Promise<Member[]> {
		return this.db
			.select()
			.from(membersTable)
			.where(
				and(
					eq(membersTable.spaceId, spaceId),
					eq(membersTable.organizationId, this.organizationId),
				),
			)
	}

	async findByOrganizationId(organizationId: string): Promise<Member[]> {
		return this.db
			.select()
			.from(membersTable)
			.where(eq(membersTable.organizationId, organizationId))
	}
}

export const memberRepository = (organizationId: string) =>
	new MemberDrizzleRepository(db, organizationId)
