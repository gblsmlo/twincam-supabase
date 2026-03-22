import { type Database, db, usersTable } from '@/infra/db'
import { eq } from 'drizzle-orm'
import type { User, UserInsert, UserUpdate } from '../types'
import type { UserRepository } from './user-repository'

export class UserDrizzleRepository implements UserRepository {
	constructor(private db: Database) {}

	async create(input: UserInsert): Promise<User> {
		const [result] = await this.db.insert(usersTable).values(input).returning()

		return result
	}

	async update(id: string, input: UserUpdate): Promise<User> {
		const [result] = await this.db
			.update(usersTable)
			.set({ ...input, updatedAt: new Date() })
			.where(eq(usersTable._id, id))
			.returning()

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(usersTable)
			.where(eq(usersTable._id, id))
			.returning({ deletedId: usersTable._id })

		return { deletedId: result?.deletedId }
	}

	async findById(id: string): Promise<User | null> {
		const [result] = await this.db.select().from(usersTable).where(eq(usersTable._id, id)).limit(1)

		return result ?? null
	}

	async findByEmail(email: string): Promise<User | null> {
		const [result] = await this.db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.limit(1)

		return result ?? null
	}

	async makePlatformAdmin(id: string): Promise<User> {
		return this.update(id, { isPlatformAdmin: true })
	}

	async revokePlatformAdmin(id: string): Promise<User> {
		return this.update(id, { isPlatformAdmin: false })
	}
}

export const userRepository = () => new UserDrizzleRepository(db)
