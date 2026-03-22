# DDD-017: Missing Role as Value Object

**Severity:** LOW
**Category:** Value Object | Domain Design | Refactoring
**Status:** Open
**Linear:** [PRD-30](https://linear.app/studio-risine/issue/PRD-30/ddd-017-missing-role-as-value-object)
**Depends on:** DDD-007, DDD-016
**Blocks:** Type-safe role operations

## Problem

Roles (OWNER, ADMIN, MEMBER) are currently plain text/enums, but should be immutable Value Objects with encapsulated permissions and behavior.

**Current State:**
```typescript
// Plain text in schema
role: text('role', { enum: ['OWNER', 'ADMIN', 'MEMBER'] }).notNull().default('MEMBER'),

// Used unsafely
if (member.role === 'OWNER') { ... }
const allRoles = ['OWNER', 'ADMIN', 'MEMBER'];
```

**Tactical Design Intent:**
```
Role Value Object:
- Immutable representation of access level
- Encapsulates permissions tied to role
- Provides methods: canModify(), canDelete(), canInvite()
```

## Recommendation

### Create Role Value Object

```typescript
// NEW: src/modules/member/value-objects/role.ts

export type RoleType = 'OWNER' | 'ADMIN' | 'MEMBER';

/**
 * Immutable value object representing organizational role and permissions.
 */
export class Role {
  private readonly type: RoleType;
  private readonly permissions: Set<Permission>;

  private constructor(type: RoleType, permissions: Permission[]) {
    this.type = type;
    this.permissions = new Set(permissions);
  }

  /**
   * Creates a Role from type.
   */
  static fromType(type: RoleType): Role {
    switch (type) {
      case 'OWNER':
        return new Role('OWNER', [
          'read',
          'write',
          'delete',
          'invite_members',
          'remove_members',
          'change_roles',
          'delete_organization',
          'transfer_ownership',
        ]);
      case 'ADMIN':
        return new Role('ADMIN', [
          'read',
          'write',
          'delete',
          'invite_members',
          'remove_members',
        ]);
      case 'MEMBER':
        return new Role('MEMBER', ['read', 'write']);
      default:
        throw new ValueError(`Unknown role: ${type}`);
    }
  }

  /**
   * Creates a Role from string (with validation).
   */
  static from(value: unknown): Role {
    if (typeof value !== 'string') {
      throw new ValueError('Role must be a string');
    }

    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(value)) {
      throw new ValueError(`Invalid role: ${value}`);
    }

    return Role.fromType(value as RoleType);
  }

  /**
   * Gets the role type as string.
   */
  getType(): RoleType {
    return this.type;
  }

  /**
   * Checks if role has permission.
   */
  hasPermission(permission: Permission): boolean {
    return this.permissions.has(permission);
  }

  /**
   * Gets all permissions.
   */
  getPermissions(): Permission[] {
    return Array.from(this.permissions);
  }

  /**
   * Checks if this role can modify member's role.
   */
  canModifyRole(targetRole: Role): boolean {
    // OWNER can modify any role
    // ADMIN can modify MEMBER only (cannot demote themselves or modify OWNER)
    // MEMBER cannot modify any role
    if (this.type === 'OWNER') return true;
    if (this.type === 'ADMIN') return targetRole.type === 'MEMBER';
    return false;
  }

  /**
   * Checks if this role can invite members.
   */
  canInvite(): boolean {
    return this.hasPermission('invite_members');
  }

  /**
   * Checks if this role can remove members.
   */
  canRemove(): boolean {
    return this.hasPermission('remove_members');
  }

  /**
   * Checks if this role can delete organization.
   */
  canDelete(): boolean {
    return this.hasPermission('delete_organization');
  }

  /**
   * Checks role hierarchy (is this >= other in hierarchy).
   */
  isHigherOrEqual(other: Role): boolean {
    const hierarchy: Record<RoleType, number> = {
      'OWNER': 3,
      'ADMIN': 2,
      'MEMBER': 1,
    };
    return hierarchy[this.type] >= hierarchy[other.type];
  }

  /**
   * String representation.
   */
  toString(): string {
    return this.type;
  }

  /**
   * Equality check.
   */
  equals(other: Role): boolean {
    return this.type === other.type;
  }
}

export type Permission =
  | 'read'
  | 'write'
  | 'delete'
  | 'invite_members'
  | 'remove_members'
  | 'change_roles'
  | 'delete_organization'
  | 'transfer_ownership';

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueError';
  }
}
```

### Use in Domain Types

```typescript
// src/modules/member/types.ts (UPDATE)

export type Member = {
  id: string;
  userId: string;
  organizationId: string;
  role: Role; // Value object instead of string
  createdAt: Date;
  updatedAt: Date;
};
```

### Use in Repository

```typescript
// src/modules/member/repository/member.ts (UPDATE)

export class MemberRepository extends BaseRepository<Member, MemberInsert, MemberUpdate> {
  async create(input: MemberInsert): Promise<Member> {
    const role = Role.from(input.role); // Validate on creation

    const result = await this.db
      .insert(membersTable)
      .values({ ...input, role: role.getType() })
      .returning();

    return {
      ...result[0],
      role, // Return as value object
    };
  }

  async findById(id: string): Promise<Member | null> {
    const result = await this.db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, id));

    if (!result[0]) return null;

    return {
      ...result[0],
      role: Role.from(result[0].role), // Parse from string
    };
  }
}
```

### Use in Authorization

```typescript
// src/shared/permissions/permission-checker.ts (UPDATE)

export class PermissionChecker {
  async canInviteMember(
    actorMemberId: string,
    targetRole: Role
  ): Promise<boolean> {
    const actor = await memberRepository().findById(actorMemberId);
    if (!actor) return false;

    // Use value object methods
    return actor.role.canInvite() && actor.role.canModifyRole(targetRole);
  }
}
```

### Use in Actions

```typescript
// src/modules/member/actions/invite-member-action.ts (UPDATE)

'use server';

export async function inviteMemberAction(
  organizationId: string,
  email: string,
  role: string // Raw from form
): Promise<Result<void>> {
  try {
    // Validate role (creates value object)
    const roleObj = Role.from(role);

    // Check permissions
    const currentMember = await memberRepository(organizationId).findByUser(currentUserId);
    if (!currentMember?.role.canModifyRole(roleObj)) {
      return failure(AUTHORIZATION_ERROR, 'Cannot invite with this role');
    }

    // ... continue with invitation
  } catch (error) {
    if (error instanceof ValueError) {
      return failure(VALIDATION_ERROR, error.message);
    }
    return failure(UNKNOWN_ERROR, 'Failed to invite member');
  }
}
```

## Benefits

✅ **Type Safety**: Role is not just a string
✅ **Encapsulation**: Permissions defined once
✅ **Behavior**: Methods like `canInvite()` encapsulated
✅ **Immutability**: Cannot modify role's permissions
✅ **Hierarchy**: `isHigherOrEqual()` for role comparisons
✅ **Validation**: Role type validated on creation

## Files to Create

- `/src/modules/member/value-objects/role.ts` - Value object
- `/src/modules/member/errors/role-errors.ts` - Errors

## Files to Update

- `/src/modules/member/types.ts` - Use value object
- `/src/modules/member/repository/member.ts` - Parse/serialize
- `/src/shared/permissions/permission-checker.ts` - Use methods

## Verification

After implementation:
1. ✅ Role immutable (no setters)
2. ✅ Permissions defined per role type
3. ✅ Permission checks use encapsulated methods
4. ✅ Role hierarchy validation works
5. ✅ Invalid roles rejected at creation
6. ✅ Type system prevents string/role confusion

## Effort Estimate

- Value object: 3 hours
- Repository integration: 2 hours
- Permission checker updates: 3 hours
- Tests: 3 hours
- **Total: ~11 hours**

## Related Issues

- DDD-007: Member implementation (extends member)
- DDD-016: BaseRepository (uses in repository)
- DDD-014: HierarchyPath Value Object (similar pattern)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Value Object designer especializado em RBAC patterns. Você encapsula permissões como objetos imutáveis com hierarquia de roles.
- **Instructions:** Crie o Role Value Object que transforma o enum plain-text (OWNER/ADMIN/MEMBER) em um objeto imutável com permissões encapsuladas e métodos de autorização.
- **Steps:** 1) Criar classe Role imutável com permissões por tipo. 2) Factory methods com validação. 3) Métodos de autorização (canInvite, canModifyRole, isHigherOrEqual). 4) Integrar no tipo Member. 5) Atualizar MemberRepository para serializar/deserializar.
- **Expectation:** Role é imutável com permissões fixas. Métodos de autorização encapsulados. Substitui string no tipo Member. Repository faz parse/serialize transparente.

### Execução

**Skill 1 de 1**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner implementando Value Object para Role com permissões encapsuladas (docs/tactical-design.md §3).
Instructions: Crie o Role Value Object substituindo o enum plain-text atual.
Steps: 1) Crie src/modules/member/value-objects/role.ts. Classe com private constructor, private readonly type (RoleType='OWNER'|'ADMIN'|'MEMBER'), private readonly permissions (Set<Permission>). 2) Static fromType(type): switch por role, cada uma com set de permissões. OWNER: todas 8 permissions. ADMIN: read, write, delete, invite_members, remove_members. MEMBER: read, write. 3) Static from(value: unknown): valida tipo string + valor válido, retorna Role ou throw ValueError. 4) getType(), hasPermission(p), getPermissions(). 5) canModifyRole(targetRole): OWNER→qualquer, ADMIN→apenas MEMBER, MEMBER→nenhum. 6) canInvite(): hasPermission('invite_members'). 7) canRemove(): hasPermission('remove_members'). 8) canDelete(): hasPermission('delete_organization'). 9) isHigherOrEqual(other): comparação por hierarchy numérico (OWNER=3, ADMIN=2, MEMBER=1). 10) equals(other), toString(). 11) Type Permission = 'read'|'write'|'delete'|'invite_members'|'remove_members'|'change_roles'|'delete_organization'|'transfer_ownership'. 12) Crie ValueError (ou reuse de hierarchy-path). 13) Atualize src/modules/member/types.ts: role: Role (ao invés de string). 14) Atualize MemberDrizzleRepository: no findById, parse role string → Role.from(row.role). No create, serialize: role.getType().
Expectation: Role imutável com 8 permissions. 6 métodos de autorização. Serialização/deserialização no repository. Tipo Member usa Role VO. pnpm build compila.
Referência: .issues/ddd-017-missing-role-value-object.md (código completo).
```
