import { type Database, db, membersTable } from '@/infra/db'
import { eq } from 'drizzle-orm'
import type { Member, MemberInsert, MemberUpdate } from '../types'
import type { MemberRepository } from './member-repository'

export class MemberDrizzleRepository implements MemberRepository {
	constructor(private db: Database) {}

	async create(input: MemberInsert): Promise<Member> {
		const [result] = await this.db.insert(membersTable).values(input)

		return result
	}

	async update(id: string, input: MemberUpdate): Promise<Member> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db.update(membersTable).set(update).where(eq(membersTable._id, id))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(membersTable)
			.where(eq(membersTable._id, id))
			.returning({ deletedId: membersTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Member | null> {
		const [result] = await this.db
			.select()
			.from(membersTable)
			.where(eq(membersTable._id, id))
			.limit(1)

		return result
	}

	async findByUserId(userId: string): Promise<Member[]> {
		const results = await this.db.select().from(membersTable).where(eq(membersTable.userId, userId))

		return results
	}

	async findBySpaceId(spaceId: string): Promise<Member[]> {
		const results = await this.db
			.select()
			.from(membersTable)
			.where(eq(membersTable.spaceId, spaceId))

		return results
	}
}

export const memberRepository = () => new MemberDrizzleRepository(db)
