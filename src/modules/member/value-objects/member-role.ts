import { ValueError } from '../errors/value-errors'
import type { MemberRole } from '../types'

export type Permission =
	| 'read'
	| 'write'
	| 'delete'
	| 'invite_members'
	| 'remove_members'
	| 'change_roles'
	| 'delete_organization'
	| 'transfer_ownership'

const VALID_ROLES: MemberRole[] = ['owner', 'admin', 'member']

const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
	admin: ['read', 'write', 'delete', 'invite_members'],
	member: ['read', 'write'],
	owner: [
		'read',
		'write',
		'delete',
		'invite_members',
		'remove_members',
		'change_roles',
		'delete_organization',
		'transfer_ownership',
	],
}

const ROLE_HIERARCHY: Record<MemberRole, number> = {
	admin: 2,
	member: 1,
	owner: 3,
}

export class Role {
	private readonly type: MemberRole
	private readonly permissions: Set<Permission>

	private constructor(type: MemberRole) {
		this.type = type
		this.permissions = new Set(ROLE_PERMISSIONS[type])
	}

	static fromType(type: MemberRole): Role {
		return new Role(type)
	}

	static from(value: unknown): Role {
		if (typeof value !== 'string') {
			throw new ValueError('Papel deve ser uma string.')
		}

		if (!VALID_ROLES.includes(value as MemberRole)) {
			throw new ValueError(`Papel inválido: ${value}`)
		}

		return new Role(value as MemberRole)
	}

	getType(): MemberRole {
		return this.type
	}

	hasPermission(permission: Permission): boolean {
		return this.permissions.has(permission)
	}

	getPermissions(): Permission[] {
		return Array.from(this.permissions)
	}

	canModifyRole(targetRole: Role): boolean {
		if (this.type === 'owner') return true
		if (this.type === 'admin') return targetRole.type === 'member'
		return false
	}

	canInvite(): boolean {
		return this.hasPermission('invite_members')
	}

	canRemove(): boolean {
		return this.hasPermission('remove_members')
	}

	canDeleteOrganization(): boolean {
		return this.hasPermission('delete_organization')
	}

	canTransferOwnership(): boolean {
		return this.hasPermission('transfer_ownership')
	}

	canChangeRoles(): boolean {
		return this.hasPermission('change_roles')
	}

	isHigherOrEqual(other: Role): boolean {
		return ROLE_HIERARCHY[this.type] >= ROLE_HIERARCHY[other.type]
	}

	isHigherThan(other: Role): boolean {
		return ROLE_HIERARCHY[this.type] > ROLE_HIERARCHY[other.type]
	}

	toString(): string {
		return this.type
	}

	equals(other: Role): boolean {
		return this.type === other.type
	}
}
