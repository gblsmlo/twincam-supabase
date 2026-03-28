import { and, type SQL } from 'drizzle-orm'

export abstract class Specification<_T> {
	protected conditions: SQL[] = []

	addCondition(condition: SQL): this {
		this.conditions.push(condition)
		return this
	}

	andSpec(other: Specification<unknown>): this {
		const clause = other.toWhereClause()
		if (clause) this.conditions.push(clause)
		return this
	}

	toWhereClause(): SQL | undefined {
		return this.conditions.length > 0 ? and(...this.conditions) : undefined
	}
}
