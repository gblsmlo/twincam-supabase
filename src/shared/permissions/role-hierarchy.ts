import { Role } from '@/modules/member/value-objects/member-role'

const ROLE_LEVELS: Record<string, number> = {
	admin: 2,
	member: 1,
	owner: 3,
}

export function getRoleLevel(role: string): number {
	return ROLE_LEVELS[role] ?? 0
}

export function isRoleHigherOrEqual(actorRole: string, targetRole: string): boolean {
	try {
		const actor = Role.from(actorRole)
		const target = Role.from(targetRole)
		return actor.isHigherOrEqual(target)
	} catch {
		return false
	}
}

export function canModifyRole(actorRole: string, targetRole: string): boolean {
	try {
		const actor = Role.from(actorRole)
		const target = Role.from(targetRole)
		return actor.isHigherThan(target)
	} catch {
		return false
	}
}
