import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { pricesTable } from './price'

export const productsTable = pgTable('products', {
	description: text('description').notNull(),
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	priceId: uuid('price_id').references(() => pricesTable.id),
	...auditFields,
})
