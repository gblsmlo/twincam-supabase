import { type Database, db, organizationsTable } from '@/infra/db'
import { eq, inArray, like } from 'drizzle-orm'
import type {
	Organization,
	OrganizationInsert,
	OrganizationInsertFull,
	OrganizationUpdate,
	OrganizationUpdateFull,
} from '../types'
import type { OrganizationRepository } from './organization-repository'

export class OrganizationDrizzleRepository implements OrganizationRepository {
	constructor(private db: Database) {}

	async create(input: OrganizationInsert | OrganizationInsertFull): Promise<Organization> {
		const [result] = await this.db.insert(organizationsTable).values(input)

		return result
	}

	async update(
		id: string,
		input: OrganizationUpdate | OrganizationUpdateFull,
	): Promise<Organization> {
		const update = {
			...input,
			updatedAt: new Date(),
		}

		const [result] = await this.db
			.update(organizationsTable)
			.set(update)
			.where(eq(organizationsTable._id, id))

		return result
	}

	async delete(id: string): Promise<{ deletedId: string }> {
		const [result] = await this.db
			.delete(organizationsTable)
			.where(eq(organizationsTable._id, id))
			.returning({ deletedId: organizationsTable._id })

		return {
			deletedId: result?.deletedId,
		}
	}

	async findById(id: string): Promise<Organization | null> {
		const [result] = await this.db
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable._id, id))
			.limit(1)

		return result
	}

	async findByOwnerId(id: string): Promise<Organization | null> {
		const [result] = await this.db
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable.ownerId, id))
			.limit(1)

		return result
	}

	async findBySlug(slug: string): Promise<Organization | null> {
		const [result] = await this.db
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable.slug, slug))
			.limit(1)

		return result
	}

	async findByParentId(parentId: string): Promise<Organization[]> {
		return await this.db
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable.parentOrganizationId, parentId))
	}

	async findAncestors(id: string): Promise<Organization[]> {
		const [org] = await this.db
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable._id, id))
			.limit(1)

		if (!org?.hierarchyPath) return []

		const ancestorIds = org.hierarchyPath.split('.').filter((aid) => aid !== id)
		if (ancestorIds.length === 0) return []

		return await this.db
			.select()
			.from(organizationsTable)
			.where(inArray(organizationsTable._id, ancestorIds))
	}

	async findDescendants(id: string): Promise<Organization[]> {
		const [org] = await this.db
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable._id, id))
			.limit(1)

		if (!org?.hierarchyPath) return []

		return await this.db
			.select()
			.from(organizationsTable)
			.where(like(organizationsTable.hierarchyPath, `${org.hierarchyPath}.%`))
	}
}

export const organizationRepository = () => new OrganizationDrizzleRepository(db)
