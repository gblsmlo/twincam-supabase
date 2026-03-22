import { ValueError } from '../errors/value-errors'

export type MemberRoleType = 'owner' | 'admin' | 'member'

export type Permission =
	| 'read'
	| 'write'
	| 'delete'
	| 'invite_members'
	| 'remove_members'
	| 'change_roles'
	| 'delete_organization'
	| 'transfer_ownership'

const VALID_ROLES: MemberRoleType[] = ['owner', 'admin', 'member']

const ROLE_PERMISSIONS: Record<MemberRoleType, Permission[]> = {
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

const ROLE_HIERARCHY: Record<MemberRoleType, number> = {
	admin: 2,
	member: 1,
	owner: 3,
}

/**
 * Immutable value object representing an organizational role and its permissions.
 */
export class Role {
	private readonly type: MemberRoleType
	private readonly permissions: Set<Permission>

	private constructor(type: MemberRoleType) {
		this.type = type
		this.permissions = new Set(ROLE_PERMISSIONS[type])
	}

	/**
	 * Creates a MemberRole from a known role type.
	 */
	static fromType(type: MemberRoleType): Role {
		return new Role(type)
	}

	/**
	 * Creates a MemberRole from an unknown value (with validation).
	 */
	static from(value: unknown): Role {
		if (typeof value !== 'string') {
			throw new ValueError('Papel deve ser uma string.')
		}

		if (!VALID_ROLES.includes(value as MemberRoleType)) {
			throw new ValueError(`Papel inválido: ${value}`)
		}

		return new Role(value as MemberRoleType)
	}

	/**
	 * Gets the role type as string (for serialization / DB persistence).
	 */
	getType(): MemberRoleType {
		return this.type
	}

	/**
	 * Checks if this role has a specific permission.
	 */
	hasPermission(permission: Permission): boolean {
		return this.permissions.has(permission)
	}

	/**
	 * Gets all permissions for this role.
	 */
	getPermissions(): Permission[] {
		return Array.from(this.permissions)
	}

	/**
	 * Checks if this role can modify the target role.
	 * OWNER can modify any role. ADMIN can modify MEMBER only. MEMBER cannot modify any.
	 */
	canModifyRole(targetRole: Role): boolean {
		if (this.type === 'owner') return true
		if (this.type === 'admin') return targetRole.type === 'member'
		return false
	}

	/**
	 * Checks if this role can invite members.
	 */
	canInvite(): boolean {
		return this.hasPermission('invite_members')
	}

	/**
	 * Checks if this role can remove members.
	 */
	canRemove(): boolean {
		return this.hasPermission('remove_members')
	}

	/**
	 * Checks if this role can delete the organization.
	 */
	canDeleteOrganization(): boolean {
		return this.hasPermission('delete_organization')
	}

	/**
	 * Checks if this role can transfer ownership.
	 */
	canTransferOwnership(): boolean {
		return this.hasPermission('transfer_ownership')
	}

	/**
	 * Checks if this role can change other members' roles.
	 */
	canChangeRoles(): boolean {
		return this.hasPermission('change_roles')
	}

	/**
	 * Checks if this role is higher or equal in the hierarchy.
	 */
	isHigherOrEqual(other: Role): boolean {
		return ROLE_HIERARCHY[this.type] >= ROLE_HIERARCHY[other.type]
	}

	/**
	 * Checks if this role is strictly higher in the hierarchy.
	 */
	isHigherThan(other: Role): boolean {
		return ROLE_HIERARCHY[this.type] > ROLE_HIERARCHY[other.type]
	}

	/**
	 * String representation.
	 */
	toString(): string {
		return this.type
	}

	/**
	 * Value object equality.
	 */
	equals(other: Role): boolean {
		return this.type === other.type
	}
}
