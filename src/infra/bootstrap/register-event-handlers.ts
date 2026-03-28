import { onSubscriptionCreated } from '@/modules/invoice/event-handlers/on-subscription-created'
import { onCustomerDeactivated } from '@/modules/subscription/event-handlers/on-customer-deactivated'
import { eventBus } from '@/shared/events'

let registered = false

export function registerEventHandlers(): void {
	if (registered) return
	registered = true

	eventBus.subscribe('subscription.created', onSubscriptionCreated)
	eventBus.subscribe('customer.status_changed', onCustomerDeactivated)
}
