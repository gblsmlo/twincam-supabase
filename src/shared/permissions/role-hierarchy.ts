import type { MemberRole } from '@/modules/member/types'

const ROLE_LEVELS: Record<MemberRole, number> = {
	admin: 2,
	member: 1,
	owner: 3,
}

export function getRoleLevel(role: string): number {
	return ROLE_LEVELS[role as MemberRole] ?? 0
}

export function isRoleHigherOrEqual(actorRole: string, targetRole: string): boolean {
	return getRoleLevel(actorRole) >= getRoleLevel(targetRole)
}

export function canModifyRole(actorRole: string, targetRole: string): boolean {
	return getRoleLevel(actorRole) > getRoleLevel(targetRole)
}
