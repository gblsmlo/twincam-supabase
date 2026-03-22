import type { Database } from '@/infra/db'
import { and, eq, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

type WithOrgId<T> = T & { organizationId: string }

export abstract class BaseRepository {
	protected readonly organizationId: string
	protected readonly db: Database

	constructor(organizationId: string, db: Database) {
		if (!organizationId) {
			throw new Error('Organization ID is required for repository')
		}
		this.organizationId = organizationId
		this.db = db
	}

	protected injectOrgId<T extends Record<string, unknown>>(input: T): WithOrgId<T> {
		return {
			...input,
			organizationId: this.organizationId,
		}
	}

	protected withOrgFilter(orgColumn: PgColumn, condition?: SQL): SQL {
		const orgCondition = eq(orgColumn, this.organizationId)
		return condition ? and(condition, orgCondition)! : orgCondition
	}
}
