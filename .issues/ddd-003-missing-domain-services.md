# DDD-003: No Domain Services for Business Logic

**Severity:** MEDIUM
**Category:** Domain Logic | Architecture Pattern
**Status:** Open
**Linear:** [PRD-34](https://linear.app/studio-risine/issue/PRD-34/ddd-003-no-domain-services-for-business-logic)

## Problem

The codebase has **zero domain services** across all 8 bounded contexts. Complex business logic is either:
1. Missing (stub implementations)
2. Scattered in action handlers
3. Embedded in repositories

**Example: Subscription Lifecycle Missing**
```
Current state: No domain service for subscription operations
- Activate subscription? Missing
- Suspend subscription? Missing
- Cancel subscription? Missing
- Renew subscription? Missing

Action stubs exist but no business rule enforcement.
```

## Risks

- 🔴 **No Business Rule Enforcement**: Logic scattered means rules can be bypassed
- 🔴 **Hard to Test**: Cannot test business rules independently of HTTP actions
- 🔴 **Code Duplication**: Same logic repeated in multiple actions
- 🔴 **Difficult Refactoring**: No single place to change subscription rules

## Symptoms

1. **Invoice Module**: No service for invoice generation workflow
2. **Subscription Module**: No service for subscription state transitions
3. **Space Module**: No service for space management operations
4. **Member Module**: No service for role/permission management
5. **Customer Module**: No service for customer lifecycle

## Affected Areas

### 1. Subscription Lifecycle (Highest Priority)
```
Needed Domain Service:
- activateSubscription(subscription: Subscription): Promise<void>
- suspendSubscription(subscription: Subscription): Promise<void>
- cancelSubscription(subscription: Subscription): Promise<void>
- renewSubscription(subscription: Subscription): Promise<void>

Business Rules to Encode:
- Can only activate if trial is running or payment received
- Cannot cancel if already past_due
- Must log cancellation reason (soft-delete with reason)
- Must notify customer on state change
```

### 2. Invoice Generation (High Priority)
```
Needed Domain Service:
- generateInvoiceForSubscription(subscription: Subscription): Promise<Invoice>
- processOverdueInvoices(): Promise<void>
- applyLateFees(invoice: Invoice): Promise<void>

Business Rules to Encode:
- Invoice date = subscription billing date
- Amount = subscription plan price
- Currency = customer preferred currency
- Overdue = not paid within 30 days
```

### 3. Space Management (Medium Priority)
```
Needed Domain Service:
- createSpaceForUser(user: User, spaceName: string): Promise<Space>
- transferOwnership(space: Space, newOwner: User): Promise<void>
- deleteSpace(space: Space): Promise<void>

Business Rules to Encode:
- Space owner must be user creating space
- Can only delete if no active customers
- Transfer requires approval workflow
```

### 4. Member/Role Management (Medium Priority)
```
Needed Domain Service:
- addMemberToSpace(space: Space, user: User, role: Role): Promise<Member>
- updateMemberRole(member: Member, newRole: Role): Promise<void>
- removeMemberFromSpace(member: Member): Promise<void>
- inviteMemberToSpace(space: Space, email: string, role: Role): Promise<Invitation>

Business Rules to Encode:
- Space must have minimum 1 owner
- Cannot downgrade last owner
- Invitations expire after 7 days
- Member removal cascades to their created resources
```

## Recommendation

### Phase 1: Implement Critical Services (High Priority)

Create domain service structure:
```typescript
// NEW: src/modules/subscription/services/subscription-domain-service.ts
export class SubscriptionDomainService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private invoiceRepository: InvoiceRepository,
    // private eventBus: EventBus, // For domain events
  ) {}

  async activateSubscription(subscriptionId: string): Promise<Result<Subscription>> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      return failure(NOT_FOUND_ERROR, 'Subscription not found');
    }

    // Enforce business rules
    if (subscription.status !== 'trial' && !subscription.paidAt) {
      return failure(
        VALIDATION_ERROR,
        'Cannot activate subscription: trial ended and payment not received'
      );
    }

    subscription.status = 'active';
    subscription.activatedAt = new Date();

    await this.subscriptionRepository.update(subscription);

    // Publish domain event
    // await this.eventBus.publish(new SubscriptionActivatedEvent(subscription));

    return success(subscription);
  }

  // Similar for suspend, cancel, renew...
}
```

### Phase 2: Use Services in Actions

Replace action stubs with domain service calls:
```typescript
// src/modules/subscription/actions/activate-subscription-action.ts
'use server';

export async function activateSubscriptionAction(subscriptionId: string): Promise<Result<Subscription>> {
  const service = new SubscriptionDomainService(
    subscriptionRepository(),
    invoiceRepository()
  );

  return await service.activateSubscription(subscriptionId);
}
```

### Phase 3: Add Domain Events (Next Issue)

Services become publishers of domain events for cross-context workflows.

## Files to Create

**Per Module:**
- `/src/modules/{context}/services/{domain}-domain-service.ts` - Domain service
- `/src/modules/{context}/services/index.ts` - Barrel export

**Priority Order:**
1. Subscription domain service (blocks invoice generation)
2. Invoice domain service (depends on subscription)
3. Space domain service (foundational)
4. Member domain service (foundational)
5. Customer domain service (medium priority)
6. Project domain service (lower priority)

## Verification

After implementation:
1. ✅ Each bounded context has a domain service
2. ✅ Business rules encoded in service, not actions
3. ✅ Services are unit-testable (mock repository)
4. ✅ Actions are thin wrappers (validate input → call service → return result)
5. ✅ No business logic in repositories

## Related Issues

- ddd-004: Missing domain events (services should publish)
- ddd-002: Invoice aggregate coupling (service coordinates cross-aggregate logic)
- ddd-005: Stub implementations (services implement the real logic)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Domain Service designer. Você centraliza regras de negócio em serviços testáveis, removendo lógica dos actions (que ficam thin) e dos repositories (que ficam puros).
- **Instructions:** Crie domain services para Subscription (state machine), Invoice (generation) e Customer (lifecycle). Cada serviço recebe repositórios via DI e retorna Result<T>.
- **Steps:** 1) SubscriptionDomainService: activate, suspend, cancel, renew com regras de negócio. 2) InvoiceGenerationService: generate, processOverdue. 3) CustomerLifecycleService: activate, deactivate. 4) Atualizar actions para serem thin wrappers. 5) Testes para cada service.
- **Expectation:** 3 domain services com regras de negócio encapsuladas. Actions são 5 linhas (validate → service.method → return result). Zero lógica de negócio em repositories.

### Execução

**Skill 1 de 2 — Services**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner criando domain services para bounded contexts de Billing e CRM.
Instructions: Crie 3 domain services com regras de negócio encapsuladas.
Steps: 1) Crie src/modules/subscription/services/subscription-domain-service.ts. Constructor: ISubscriptionRepository, IInvoiceRepository. Métodos: a) activateSubscription(subId): busca sub, valida status é 'trial' ou pagamento recebido, seta status='active' + activatedAt. b) suspendSubscription(subId): valida status é 'active', seta status='suspended'. c) cancelSubscription(subId, reason): valida status não é 'cancelled', seta status='cancelled' + cancelledAt + reason. d) renewSubscription(subId): valida status 'active', extends finishedAt + cria nova invoice. Todos retornam Result<Subscription>. 2) Crie src/modules/invoice/services/invoice-generation-service.ts. Constructor: IInvoiceRepository, ISubscriptionRepository. Métodos: a) generateInvoiceForSubscription(subId): busca sub, cria invoice com amount=price, dueDate=30 dias, status='open'. b) processOverdueInvoices(): busca invoices open com dueDate < now()-30d, marca como 'overdue'. Retorna Result<Invoice[]>. 3) Crie src/modules/customer/services/customer-lifecycle-service.ts. Constructor: ICustomerRepository. Métodos: a) activateCustomer(customerId): seta status='active'. b) deactivateCustomer(customerId): seta status='inactive'. Retorna Result<Customer>. 4) Todos usam src/shared/errors/result.ts para success()/failure(). Mensagens de erro em português.
Expectation: 3 services, ~10 métodos total. Regras de negócio centralizadas. DI via constructor. Result<T> pattern. pnpm build compila.
Referência: .issues/ddd-003-missing-domain-services.md. docs/action-implementation-standard.md.
```

**Skill 2 de 2 — Thin Actions**
```
/antigravity-awesome-skills:clean-code
Role: Clean code specialist refatorando actions para serem thin wrappers sobre domain services.
Instructions: Atualize as actions existentes de Subscription, Invoice e Customer para delegar ao domain service.
Steps: 1) Para cada action existente em src/modules/subscription/actions/, src/modules/invoice/actions/, src/modules/customer/actions/: a) Mantenha 'use server' + Zod validation. b) Remova toda lógica de negócio. c) Instancie o domain service: const service = new XDomainService(xRepository(orgId)). d) Chame o método correspondente: return await service.method(input). e) Mantenha try/catch apenas para erros inesperados. 2) Pattern final de cada action (5 linhas): validate → get orgId → instantiate service → call method → return result. 3) Verifique que nenhuma action tem lógica de negócio (if/else sobre status, validações de domínio, etc).
Expectation: Actions com máximo 15 linhas cada. Zero lógica de negócio em actions. Services são a single source of truth para regras. pnpm build compila.
```
