import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { auditFields } from '../helpers'
import { pricesTable } from './price'

export const productsTable = pgTable('products', {
	_id: uuid('id').primaryKey().defaultRandom(),
	description: text().notNull(),
	name: text().notNull(),
	priceId: uuid('price_id').references(() => pricesTable._id),
	...auditFields,
})
