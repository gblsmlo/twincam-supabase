# DDD-007: Member/Role Context Underimplemented

**Severity:** MEDIUM
**Category:** Authorization | Core Feature
**Status:** Open
**Linear:** [PRD-31](https://linear.app/studio-risine/issue/PRD-31/ddd-007-memberrole-context-underimplemented)

## Problem

The **Member** bounded context is foundational to multi-tenancy and authorization but is **severely underimplemented** (20% complete). Member management is critical infrastructure that the entire system depends on.

## Current Implementation

```typescript
// src/infra/db/schemas/member.ts
export const membersTable = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => authUsersTable.id),
  spaceId: uuid('space_id').notNull().references(() => spacesTable.id),
  role: text('role', { enum: ['OWNER', 'ADMIN', 'MEMBER'] }).notNull().default('MEMBER'),
  ...auditFields,
});
```

**What's missing:**
- ❌ No repository implementation (declared but empty)
- ❌ No domain service (MemberRoleService)
- ❌ No actions (add, update, remove, invite)
- ❌ No RBAC/permission checking
- ❌ No role hierarchy
- ❌ No member invitations
- ❌ No access control in routes
- ❌ No permission-based queries

## Risks

- 🔴 **No Access Control**: Any user can access any space (no RLS policies)
- 🔴 **No RBAC**: Cannot enforce role-based permissions
- 🔴 **No Invitations**: Cannot invite users to spaces (manual database updates only)
- 🔴 **No Audit**: Cannot track who granted which roles
- 🔴 **No Hierarchy**: All roles (OWNER, ADMIN, MEMBER) treated equally (wrong)

## Missing Features

### 1. Member Invitation Flow (Critical)

**Expected Workflow:**
```
1. Space OWNER sends invitation to user@example.com
2. Invitation stored with expiry (7 days)
3. User receives email with acceptance link
4. User accepts, Member record created with invited role
5. If rejected/expired, invitation deleted
```

**Current State:**
```
Members manually added via database inserts.
No invitation system.
No email notifications.
```

**What's Needed:**
```typescript
// NEW: src/modules/member/schemas.ts
export const memberInvitationSelectSchema = createSelectSchema(memberInvitationsTable);
export type MemberInvitation = z.infer<typeof memberInvitationSelectSchema>;

// NEW: src/modules/member/actions/invite-member-action.ts
export async function inviteMemberAction(
  spaceId: string,
  email: string,
  role: Role
): Promise<Result<MemberInvitation>> {
  // Validation: Only OWNER can invite
  // Create invitation with expiry
  // Send email with acceptance link
  // Return invitation
}

export async function acceptInvitationAction(
  invitationId: string,
  userId: string
): Promise<Result<Member>> {
  // Validate invitation not expired
  // Create Member record
  // Delete invitation
  // Publish event: MemberAddedEvent
}
```

### 2. RBAC (Role-Based Access Control)

**Expected Model:**
```
OWNER:
  - All permissions
  - Can invite/remove members
  - Can transfer ownership
  - Can delete space

ADMIN:
  - Create/edit/delete customers
  - Create/edit/delete invoices
  - View all reports
  - Cannot modify members or space settings

MEMBER:
  - View customers (assigned to them)
  - View own invoices
  - Limited to assigned projects
```

**Current State:**
```
Roles exist but no permission enforcement.
No way to check if user can perform action.
All users treated equally.
```

**What's Needed:**
```typescript
// NEW: src/shared/permissions/permission-checker.ts
export class PermissionChecker {
  async canDeleteMember(userId: string, targetMemberId: string): Promise<boolean> {
    const requesterMember = await memberRepository().findByUserAndSpace(...);
    const targetMember = await memberRepository().findById(targetMemberId);

    // Only OWNER can remove members
    // Cannot remove yourself
    // Cannot remove last OWNER

    return requesterMember.role === 'OWNER' &&
           requesterMember.id !== targetMemberId &&
           !(targetMember.role === 'OWNER' && isLastOwner(targetMember.spaceId));
  }

  async canInviteWithRole(userId: string, spaceId: string, role: Role): Promise<boolean> {
    const member = await memberRepository().findByUserAndSpace(userId, spaceId);

    // Only OWNER can invite
    // Cannot delegate to higher role than self
    return member.role === 'OWNER' &&
           getRoleHierarchy(role) <= getRoleHierarchy(member.role);
  }
}

// Then use in actions:
export async function inviteMemberAction(spaceId: string, email: string, role: Role) {
  const checker = new PermissionChecker();
  const canInvite = await checker.canInviteWithRole(currentUserId, spaceId, role);

  if (!canInvite) {
    return failure(AUTHORIZATION_ERROR, 'You cannot invite with this role');
  }

  // Continue...
}
```

### 3. Member Management Actions

```typescript
// NEW: src/modules/member/actions/

export async function addMemberAction(
  spaceId: string,
  userId: string,
  role: Role
): Promise<Result<Member>>;

export async function updateMemberRoleAction(
  memberId: string,
  newRole: Role
): Promise<Result<Member>>;

export async function removeMemberAction(
  memberId: string
): Promise<Result<void>>;

export async function transferOwnershipAction(
  spaceId: string,
  newOwnerId: string
): Promise<Result<Member>>;

export async function inviteMemberAction(
  spaceId: string,
  email: string,
  role: Role
): Promise<Result<MemberInvitation>>;

export async function acceptInvitationAction(
  invitationId: string
): Promise<Result<Member>>;

export async function rejectInvitationAction(
  invitationId: string
): Promise<Result<void>>;
```

### 4. Domain Events

```typescript
// NEW: src/modules/member/events/member-events.ts

export class MemberAddedEvent implements DomainEvent {
  type = 'member.added';
  constructor(
    aggregateId: string,
    data: { userId: string; spaceId: string; role: Role }
  ) {}
}

export class MemberRoleChangedEvent implements DomainEvent {
  type = 'member.role_changed';
  constructor(
    aggregateId: string,
    data: { oldRole: Role; newRole: Role; spaceId: string }
  ) {}
}

export class MemberRemovedEvent implements DomainEvent {
  type = 'member.removed';
  constructor(
    aggregateId: string,
    data: { userId: string; spaceId: string }
  ) {}
}

export class MemberInvitedEvent implements DomainEvent {
  type = 'member.invited';
  constructor(
    aggregateId: string,
    data: { email: string; spaceId: string; role: Role }
  ) {}
}
```

### 5. Route-Level Access Control

```typescript
// NEW: src/app/(private)/dashboard/[spaceId]/members/page.tsx

import { PermissionChecker } from '@/shared/permissions/permission-checker';

export default async function MembersPage({ params }: { params: { spaceId: string } }) {
  const checker = new PermissionChecker();
  const canViewMembers = await checker.canViewMembers(currentUserId, params.spaceId);

  if (!canViewMembers) {
    return <UnauthorizedPage />;
  }

  return <MembersListView spaceId={params.spaceId} />;
}
```

## Database Schema Additions

```typescript
// NEW: src/infra/db/schemas/member-invitation.ts
export const memberInvitationsTable = pgTable('member_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaceId: uuid('space_id').notNull().references(() => spacesTable.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role', { enum: ['OWNER', 'ADMIN', 'MEMBER'] }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  ...auditFields,
});

// Add constraint: unique (space_id, email) while pending
```

## Files to Create

```
src/modules/member/
├── actions/
│   ├── add-member-action.ts
│   ├── update-member-role-action.ts
│   ├── remove-member-action.ts
│   ├── transfer-ownership-action.ts
│   ├── invite-member-action.ts
│   ├── accept-invitation-action.ts
│   └── reject-invitation-action.ts
├── services/
│   ├── member-role-service.ts
│   └── member-invitation-service.ts
├── events/
│   └── member-events.ts
├── components/
│   ├── members-list-view.tsx
│   ├── invite-member-dialog.tsx
│   └── member-role-select.tsx
├── forms/
│   └── invite-member-form.tsx
├── repository/
│   ├── member-invitation-repository.ts
│   └── (update member-repository.ts)
└── (update schemas.ts, types.ts)

src/shared/permissions/
└── permission-checker.ts

src/infra/db/schemas/
└── (add) member-invitation.ts
```

## Verification

After implementation:
1. ✅ Users can be invited to spaces with role
2. ✅ Invitations expire after 7 days
3. ✅ Only OWNER can invite/manage members
4. ✅ Cannot remove last owner
5. ✅ Events published for audit trail
6. ✅ Routes enforce permissions
7. ✅ Tests verify RBAC rules

## Related Issues

- ddd-003: Missing domain services (MemberRoleService needed)
- ddd-004: Missing domain events (member events)
- ddd-005: Stub implementations (this is one)

## Effort Estimate

- Design & review: 8 hours
- Database schema: 4 hours
- Member actions: 20 hours
- Permission system: 16 hours
- UI components: 16 hours
- Testing: 12 hours
- **Total: ~76 hours (~2 weeks)**

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um RBAC Architect & DDD practitioner. Você implementa sistemas de autorização completos com permission checking, invitation workflows e domain events, seguindo patterns de SaaS como GitHub/Slack.
- **Instructions:** Complete o módulo Member com: PermissionChecker, MemberRoleService, invitation workflow (schema+actions), domain events e testes. Use o Role Value Object (DDD-017) para autorização.
- **Steps:** 1) Criar schema member_invitations. 2) Criar PermissionChecker. 3) Criar MemberRoleService. 4) Criar 7 actions (add, update, remove, transfer, invite, accept, reject). 5) Criar domain events. 6) Criar testes completos.
- **Expectation:** RBAC funcional: OWNER manage all, ADMIN manage MEMBER, MEMBER read-only. Invitations com expiry. Invariante: último OWNER não removível. 7 actions + testes.

### Execução

**Skill 1 de 3 — Permission System**
```
/antigravity-awesome-skills:auth-implementation-patterns
Role: RBAC architect implementando permission checking para SaaS multi-tenant.
Instructions: Crie o sistema de permissões centralizado usando o Role Value Object.
Steps: 1) Crie src/shared/permissions/permission-checker.ts. Classe que recebe IMemberRepository no constructor. 2) canInviteMember(actorUserId, orgId, targetRole: Role): busca actor member, verifica actor.role.canInvite() && actor.role.canModifyRole(targetRole). 3) canRemoveMember(actorUserId, targetMemberId): busca actor e target, verifica actor.role.canRemove(), verifica actor !== target, verifica target não é último OWNER. 4) canUpdateRole(actorUserId, targetMemberId, newRole): actor.role.canModifyRole(target.role) && actor.role.isHigherOrEqual(Role.from(newRole)). 5) canDeleteOrganization(actorUserId, orgId): actor.role.canDelete(). 6) Helper isLastOwner(orgId): conta membros com role OWNER. 7) Todos retornam Promise<boolean>. 8) Crie src/shared/permissions/index.ts barrel export.
Expectation: PermissionChecker com 4 métodos de autorização + 1 helper. Usa Role VO methods. Invariante último OWNER protegido. Pronto para uso em actions.
Referência: Role VO em src/modules/member/value-objects/role.ts. MemberRepository interface.
```

**Skill 2 de 3 — Service, Schema & Actions**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner completando bounded context Member com service, schema de invitations e 7 server actions.
Instructions: Implemente MemberRoleService, schema de invitations e todas as actions.
Steps: 1) Crie src/infra/db/schemas/member-invitation.ts: memberInvitationsTable com id (uuid PK), spaceId (FK→spaces), email (text), role (text enum), token (text unique), expiresAt (timestamp), acceptedAt (timestamp nullable), auditFields. 2) Crie src/modules/member/services/member-role-service.ts: addMember(orgId, userId, role), updateRole(memberId, newRole), removeMember(memberId), transferOwnership(orgId, newOwnerId). Cada método usa PermissionChecker antes de executar. Retorna Result<T>. 3) Crie 7 actions em src/modules/member/actions/: a) invite-member-action.ts: valida input, PermissionChecker.canInvite, cria invitation com token=crypto.randomUUID() e expiresAt=7 dias. b) accept-invitation-action.ts: valida token, verifica não expirado, cria Member, deleta invitation. c) reject-invitation-action.ts: deleta invitation. d) add-member-action.ts: wrapper thin → MemberRoleService.addMember. e) update-member-role-action.ts → MemberRoleService.updateRole. f) remove-member-action.ts → MemberRoleService.removeMember. g) transfer-ownership-action.ts → MemberRoleService.transferOwnership. 4) Todas as actions seguem docs/action-implementation-standard.md: 'use server', validate Zod, try/catch, Result<T>, mensagens em português.
Expectation: 1 schema, 1 service, 7 actions. Todas type-safe. PermissionChecker integrado. Mensagens em português. pnpm build compila.
Referência: docs/action-implementation-standard.md. src/modules/product/actions/ (padrão).
```

**Skill 3 de 3 — Tests**
```
/antigravity-awesome-skills:testing-patterns
Role: Test engineer criando suite de testes para RBAC + invitation workflow.
Instructions: Crie testes unitários completos para PermissionChecker, MemberRoleService e actions de Member.
Steps: 1) src/shared/permissions/permission-checker.test.ts: a) OWNER can invite any role. b) ADMIN can invite MEMBER only. c) MEMBER cannot invite. d) Cannot remove last OWNER. e) Cannot remove self. f) OWNER can transfer ownership. 2) src/modules/member/services/member-role-service.test.ts: a) addMember creates member with role. b) updateRole changes role. c) removeMember deletes member. d) transferOwnership: old owner becomes ADMIN, new owner becomes OWNER. 3) src/modules/member/actions/invite-member-action.test.ts: a) Success: creates invitation with 7-day expiry. b) Auth error: non-OWNER cannot invite. c) Validation error: invalid email. 4) src/modules/member/actions/accept-invitation-action.test.ts: a) Success: creates member, deletes invitation. b) Error: expired invitation rejected. 5) Use vi.mock para repositories. Siga padrão de src/modules/product/actions/find-product-action.test.ts.
Expectation: 15+ test cases. 100% dos branches de PermissionChecker testados. Invitation lifecycle testado (create→accept, create→reject, create→expire). pnpm test passa.
```
