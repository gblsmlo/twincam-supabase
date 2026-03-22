import type { MemberRole } from '../types'

export interface DomainEvent {
	aggregateId: string
	occurredAt: Date
	type: string
}

export class MemberAddedEvent implements DomainEvent {
	readonly occurredAt = new Date()
	readonly type = 'member.added'

	constructor(
		readonly aggregateId: string,
		readonly data: { role: MemberRole; spaceId: string; userId: string },
	) {}
}

export class MemberRoleChangedEvent implements DomainEvent {
	readonly occurredAt = new Date()
	readonly type = 'member.role_changed'

	constructor(
		readonly aggregateId: string,
		readonly data: { newRole: MemberRole; oldRole: MemberRole; spaceId: string },
	) {}
}

export class MemberRemovedEvent implements DomainEvent {
	readonly occurredAt = new Date()
	readonly type = 'member.removed'

	constructor(
		readonly aggregateId: string,
		readonly data: { spaceId: string; userId: string },
	) {}
}

export class MemberInvitedEvent implements DomainEvent {
	readonly occurredAt = new Date()
	readonly type = 'member.invited'

	constructor(
		readonly aggregateId: string,
		readonly data: { email: string; role: MemberRole; spaceId: string },
	) {}
}

export class InvitationAcceptedEvent implements DomainEvent {
	readonly occurredAt = new Date()
	readonly type = 'member.invitation_accepted'

	constructor(
		readonly aggregateId: string,
		readonly data: { spaceId: string; userId: string },
	) {}
}

export class OwnershipTransferredEvent implements DomainEvent {
	readonly occurredAt = new Date()
	readonly type = 'member.ownership_transferred'

	constructor(
		readonly aggregateId: string,
		readonly data: { newOwnerId: string; previousOwnerId: string; spaceId: string },
	) {}
}
