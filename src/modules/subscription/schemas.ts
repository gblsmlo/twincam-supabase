import { subscriptionsTable } from '@/infra/db/schemas'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

export const subscriptionSelectSchema = createSelectSchema(subscriptionsTable)
export const subscriptionCreateSchema = createInsertSchema(subscriptionsTable)
export const subscriptionUpdateSchema = createUpdateSchema(subscriptionsTable)
