import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { pricesTable } from './price'
import { spacesTable } from './space'

export const productsTable = pgTable(
	'products',
	{
		_id: uuid('id').primaryKey().defaultRandom(),
		description: text().notNull(),
		name: text().notNull(),
		organizationId: uuid('organization_id').references(() => spacesTable._id, {
			onDelete: 'cascade',
		}),
		priceId: uuid('price_id').references(() => pricesTable._id),
		...auditFields,
	},
	(table) => [index('idx_products_organization_id').on(table.organizationId)],
)
