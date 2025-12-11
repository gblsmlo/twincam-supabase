import { type Database, db, spacesTable } from '@/infra/db'
import { eq } from 'drizzle-orm'
import type { Space, SpaceInsert, SpaceUpdate } from '../types'
import type { SpaceRepository } from './space-repository'

export class SpaceDrizzleRepository implements SpaceRepository {
	constructor(private db: Database) {}

	async create(input: SpaceInsert): Promise<Space> {
		const [result] = await this.db.insert(spacesTable).values(input)

		return result
	}

	async update(id: string, input: SpaceUpdate): Promise<Space> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db.update(spacesTable).set(update).where(eq(spacesTable._id, id))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(spacesTable)
			.where(eq(spacesTable._id, id))
			.returning({ deletedId: spacesTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findByOwnerId(id: string): Promise<Space | null> {
		const [result] = await this.db
			.select()
			.from(spacesTable)
			.where(eq(spacesTable.ownerId, id))
			.limit(1)

		return result
	}

	async findBySlug(slug: string): Promise<Space | null> {
		const [result] = await this.db
			.select()
			.from(spacesTable)
			.where(eq(spacesTable.slug, slug))
			.limit(1)

		return result
	}
}

export const spaceRepository = () => new SpaceDrizzleRepository(db)
