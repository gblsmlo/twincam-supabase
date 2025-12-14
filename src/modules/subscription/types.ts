import type { z } from 'zod'
import type {
	subscriptionCreateSchema,
	subscriptionSelectSchema,
	subscriptionUpdateSchema,
} from './schemas'

export type Subscription = z.infer<typeof subscriptionSelectSchema>
export type SubscriptionInsert = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdate = z.infer<typeof subscriptionUpdateSchema>
