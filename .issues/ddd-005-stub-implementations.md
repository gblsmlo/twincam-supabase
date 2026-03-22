# DDD-005: 75% of Bounded Contexts Incomplete

**Severity:** MEDIUM
**Category:** Implementation Status | Delivery
**Status:** Open
**Linear:** [PRD-38](https://linear.app/studio-risine/issue/PRD-38/ddd-005-75percent-of-bounded-contexts-incomplete-stub-implementations)

## Problem

Out of 8 bounded contexts, only **Product (90%)** and **Auth (60%)** have meaningful implementations. The remaining **6 contexts (75%)** consist of stub files with no operational code.

## Current Implementation Status

| Context | Completeness | Status | Missing |
|---------|-------------|--------|---------|
| **Auth** | 60% | Partial | `signOut` edge cases, session management tests |
| **Space** | 20% | Stub | All 8 actions, domain service, events |
| **Member** | 20% | Stub | All 8 actions, RBAC service, invitation flow |
| **Product** | 90% | Production | Only: advanced filtering, bulk operations |
| **Project** | 10% | Stub | All 8 actions, domain service |
| **Customer** | 30% | Stub | All 8 actions, lifecycle service |
| **Subscription** | 30% | Stub | All 8 actions, state machine service, renewal |
| **Invoice** | 30% | Stub | All 8 actions, generation service, overdue handling |

## Symptoms

### 1. Empty Action Files
```typescript
// src/modules/space/actions/create-space-action.ts
'use server';

// Not implemented yet
export async function createSpaceAction(input: unknown): Promise<Result<unknown>> {
  throw new Error('Not implemented');
}
```

### 2. Stub Repositories
```typescript
// src/modules/member/repository/member.ts
export interface IMemberRepository {
  findById(id: string): Promise<Member | null>;
  // Many methods defined but not implemented
}

// Implementation has 0 actual methods
export function memberRepository(): IMemberRepository {
  // Empty class body
}
```

### 3. No Domain Services
```
Expected:
- SpaceManagementService (create, update, delete, transfer ownership)
- MemberRoleService (add member, update role, remove member)
- SubscriptionLifecycleService (activate, suspend, renew, cancel)
- InvoiceGenerationService (generate, send, process payment)

Actual:
- All 6 contexts: NONE
```

### 4. No UI Implementation
```
Expected for each context:
- List page with data table
- Detail/edit page with form
- Create dialog or page
- Delete confirmation
- Status indicators

Actual:
- Product: ✅ Complete
- Auth: ✅ Complete
- Others: Empty route placeholders
```

## Risk Impact

**Blocking Development:**
- Cannot demo complete features
- Cannot test multi-context workflows (subscription → invoice → payment)
- Blocked on ddd-003 (missing domain services) and ddd-004 (missing events)

**Metrics:**
- 6/8 contexts not production-ready
- 75% of codebase is placeholder/stub
- Cannot deploy with any feature except Product CRUD

## Affected Areas

### Space Context (20% complete)
```
Missing:
□ createSpaceAction - Required for onboarding
□ updateSpaceAction - Required for space settings
□ deleteSpaceAction - Required for space cleanup
□ transferOwnershipAction - Required for space management
□ SpaceManagementService - Business logic
□ SpaceCreatedEvent - Event emission
□ All UI pages (/dashboard/settings/space, /dashboard/space/{id})
```

### Member Context (20% complete)
```
Missing:
□ addMemberAction - Required for team management
□ updateMemberRoleAction - Required for permission changes
□ removeMemberAction - Required for access revocation
□ inviteMemberAction - Required for onboarding
□ acceptInvitationAction - Required for signup flow
□ MemberRoleService - RBAC business logic
□ MemberInvitedEvent - Event emission
□ All UI pages (/dashboard/team, /dashboard/team/{id})
```

### Customer Context (30% complete)
```
Missing:
□ createCustomerAction
□ updateCustomerAction
□ deleteCustomerAction
□ CustomerLifecycleService - State management
□ All UI pages (/dashboard/crm/customers, etc.)
```

### Subscription Context (30% complete)
```
Missing:
□ createSubscriptionAction
□ cancelSubscriptionAction
□ renewSubscriptionAction
□ SubscriptionLifecycleService - State machine
□ SubscriptionCreatedEvent - Triggers invoice generation
□ All UI pages (/dashboard/billing/subscriptions, etc.)
```

### Invoice Context (30% complete)
```
Missing:
□ createInvoiceAction
□ paymentProcessedAction
□ markPaidAction
□ InvoiceGenerationService - Triggered by subscription events
□ All UI pages (/dashboard/billing/invoices, etc.)
```

### Project Context (10% complete)
```
Missing:
□ Almost everything
□ Only schema exists
```

## Recommendation

### Phase 1: Prioritize Critical Workflows (Week 1-2)

**Priority 1: Space + Member (Foundation)**
- Implement `SpaceManagementService` + all actions
- Implement `MemberRoleService` + all actions
- Implement invitations and RBAC
- Status: Blocks all other features

**Priority 2: Subscription + Invoice (Revenue)**
- Implement `SubscriptionLifecycleService` + all actions
- Implement `InvoiceGenerationService` + all actions
- Integrate with domain events (ddd-004)
- Status: Blocks billing/payment flows

**Priority 3: Customer (CRM)**
- Implement `CustomerLifecycleService` + all actions
- Status: Enables customer management UI

**Priority 4: Project (Nice to have)**
- Implement after core contexts
- Status: Lower priority

### Phase 2: UI Implementation (Parallel)

For each context, create:
1. List page with `DataTableView` component
2. Detail/edit page with form
3. Create dialog or modal
4. Actions from Product context as reference

### Phase 3: Integration Testing (Week 3+)

After all actions implemented:
1. Test E2E workflows (signup → create space → add member → create subscription → generate invoice)
2. Test event propagation (subscription created → invoice generated)
3. Test RBAC (member role changes affect permissions)

## Estimated Effort

- **Space + Member**: 40 hours (foundation)
- **Subscription + Invoice**: 35 hours (revenue critical)
- **Customer**: 20 hours (CRM)
- **Project**: 15 hours (lower priority)
- **UI + Integration**: 30 hours (parallel)
- **Total**: ~140 hours (~3-4 weeks for 1 developer)

## File Count

- **Actions needed**: 30+ files
- **Services needed**: 6 files
- **UI pages needed**: 15+ files
- **Tests needed**: 20+ files

## Verification

After implementation:
1. ✅ All 8 contexts have complete CRUD operations
2. ✅ All domain services implemented
3. ✅ All UI pages functional
4. ✅ E2E workflows testable (signup → billing)
5. ✅ No stub files remain

## Related Issues

- ddd-001: Product tenant isolation (learn from Product implementation)
- ddd-002: Invoice aggregate coupling (implement correctly from start)
- ddd-003: Missing domain services (implement these for all contexts)
- ddd-004: Missing domain events (integrate as services are built)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um execution engineer completando módulos parciais seguindo o padrão estabelecido pelo módulo Product (referência canônica).
- **Instructions:** Complete os stubs restantes em todos os módulos após as fases 1-4 terem estabelecido BaseRepository, domain services e events. Cada módulo deve ter: repository funcional, actions completas, service, tipos corretos.
- **Steps:** 1) Auditar quais stubs restam após fases 1-4. 2) Para cada módulo stub: completar repository → actions → testes. 3) Seguir padrão de Product + docs/action-implementation-standard.md. 4) Validar com build + test.
- **Expectation:** Zero stubs no codebase. Todos os módulos com CRUD funcional. Testes para cada action.

### Execução

**Skill 1 de 1**
```
/antigravity-awesome-skills:executing-plans
Role: Execution engineer completando módulos parciais seguindo um plano estabelecido.
Instructions: Complete os stubs restantes em cada módulo após as fases 1-4.
Steps: 1) Audite cada módulo em src/modules/ verificando: a) Repository tem todos os métodos da interface implementados? b) Actions existem para cada operação CRUD? c) Actions seguem o padrão de docs/action-implementation-standard.md? d) Testes existem para cada action? 2) Para o módulo Project (10% completo): a) Complete ProjectDrizzleRepository com todos os métodos (findById, findBySlug, findBySpaceId, findByOwnerId, create, update, delete). b) Estenda BaseRepository<Project, ProjectInsert, ProjectUpdate>. c) Complete actions: create-project-action, update-project-action, delete-project-action, find-project-by-slug-action. d) Crie testes para cada action. 3) Para módulos Customer, Subscription, Invoice: verifique se domain services (DDD-003) cobrem as actions restantes. Complete quaisquer actions faltantes como thin wrappers sobre os services. 4) Padrão de cada action: 'use server', validate input com Zod safeParse, try/catch, retorna Result<T>, mensagens de erro em português. 5) Rode pnpm build && pnpm test após cada módulo completado.
Expectation: Zero stubs. Zero 'throw new Error("Not implemented")'. Todos os módulos com CRUD completo. Testes passando. pnpm build sem erros.
Referência: src/modules/product/ (canônico). docs/action-implementation-standard.md.
```
