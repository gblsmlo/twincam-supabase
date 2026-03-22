# DDD-004: No Domain Events for Cross-Context Communication

**Severity:** MEDIUM
**Category:** Architecture | Event-Driven Design
**Status:** Open
**Linear:** [PRD-35](https://linear.app/studio-risine/issue/PRD-35/ddd-004-no-domain-events-for-cross-context-communication)

## Problem

The system has **no domain events or event bus implementation**, making it impossible for bounded contexts to coordinate asynchronously.

**Example: Subscription Created → Generate Invoice**
```
Current behavior:
1. SubscriptionCreated action runs
2. Must synchronously call invoice generation
3. If invoice service fails, subscription rollback required
4. No audit trail of what triggered invoice creation

Desired behavior:
1. SubscriptionCreated event published
2. InvoiceCreationService subscribes and handles asynchronously
3. If it fails, retry logic handles recovery
4. Event log tracks causation
```

## Risks

- 🔴 **Tight Coupling**: Contexts tightly coupled through direct calls
- 🔴 **Synchronous Bottleneck**: All workflows block on slowest operation
- 🔴 **No Retry Logic**: Failures in dependent operations roll back everything
- 🔴 **Lost Causation**: No audit trail of what caused what

## Affected Workflows

### 1. Subscription → Invoice (Critical)
```
Event: SubscriptionCreatedEvent
Publisher: SubscriptionDomainService
Subscribers:
  - InvoiceService (generate first invoice)
  - NotificationService (send welcome email)
  - AuditService (log subscription creation)
```

### 2. Customer Status Change → Cascade
```
Event: CustomerStatusChangedEvent
Publisher: CustomerDomainService
Subscribers:
  - SubscriptionService (suspend if inactive)
  - NotificationService (send status email)
  - ReportingService (update metrics)
```

### 3. Member Added → Setup
```
Event: MemberAddedToSpaceEvent
Publisher: MemberDomainService
Subscribers:
  - NotificationService (send invitation)
  - AuditService (log access grant)
  - PermissionService (grant default permissions)
```

### 4. Invoice Overdue → Escalation
```
Event: InvoiceOverdueEvent
Publisher: InvoiceService (scheduled job)
Subscribers:
  - NotificationService (send payment reminder)
  - CollectionsService (escalate after N days)
  - AuditService (log escalation)
```

## Recommendation

### Phase 1: Implement Simple Event Bus

Create a basic in-process event bus:

```typescript
// NEW: src/shared/events/event-bus.ts
export type DomainEventHandler<T extends DomainEvent> = (event: T) => Promise<void>;

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  data: unknown;
}

export class EventBus {
  private handlers: Map<string, DomainEventHandler<any>[]> = new Map();

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        // Log error, consider retry strategy
        console.error(`Handler failed for ${event.type}:`, error);
      }
    }
  }
}

export const eventBus = new EventBus();
```

### Phase 2: Define Domain Events

Create event types for each context:

```typescript
// NEW: src/modules/subscription/events/subscription-events.ts
export class SubscriptionCreatedEvent implements DomainEvent {
  id = crypto.randomUUID();
  type = 'subscription.created';
  aggregateType = 'Subscription';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public data: {
      customerId: string;
      planName: string;
      startedAt: Date;
      spaceId: string;
    }
  ) {}
}

export class SubscriptionCancelledEvent implements DomainEvent {
  id = crypto.randomUUID();
  type = 'subscription.cancelled';
  aggregateType = 'Subscription';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public data: {
      customerId: string;
      reason: string;
      spaceId: string;
    }
  ) {}
}

// Similar for other contexts...
```

### Phase 3: Publish Events from Domain Services

```typescript
// src/modules/subscription/services/subscription-domain-service.ts
export class SubscriptionDomainService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private eventBus: EventBus,
  ) {}

  async createSubscription(params: CreateSubscriptionParams): Promise<Result<Subscription>> {
    const subscription = await this.subscriptionRepository.create(params);

    // Publish domain event
    await this.eventBus.publish(
      new SubscriptionCreatedEvent(subscription.id, {
        customerId: subscription.customerId,
        planName: subscription.planName,
        startedAt: subscription.startedAt,
        spaceId: subscription.spaceId,
      })
    );

    return success(subscription);
  }
}
```

### Phase 4: Subscribe to Events in Other Contexts

```typescript
// NEW: src/modules/invoice/event-handlers/subscription-created-handler.ts
export async function handleSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<void> {
  const subscriptionRepo = subscriptionRepository();
  const invoiceService = new InvoiceService(invoiceRepository());

  const subscription = await subscriptionRepo.findById(event.aggregateId);
  if (!subscription) return;

  await invoiceService.generateInvoiceForSubscription(subscription);
}

// Register handler at startup
eventBus.subscribe('subscription.created', handleSubscriptionCreated);
```

### Phase 5: Add Event Persistence (Future)

For production, store events in database:
```typescript
// Future: src/infra/db/schemas/domain-events.ts
export const domainEventsTable = pgTable('domain_events', {
  id: uuid('id').primaryKey(),
  type: text('type').notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  data: jsonb('data').notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  publishedAt: timestamp('published_at'),
});
```

## Files to Create

**Event Bus:**
- `/src/shared/events/event-bus.ts` - Core event bus

**Per Module:**
- `/src/modules/{context}/events/{context}-events.ts` - Event definitions
- `/src/modules/{context}/event-handlers/` - Event handlers

**Integration:**
- `/src/app/layout.tsx` or `/src/infra/bootstrap.ts` - Register handlers at startup

## Verification

After implementation:
1. ✅ Subscription created → Invoice generated asynchronously
2. ✅ Failed event handler doesn't crash application
3. ✅ Event log shows causation (what triggered what)
4. ✅ Contexts can be disabled independently (one context failing doesn't cascade)
5. ✅ New workflows can be added without modifying existing code (Open/Closed Principle)

## Related Issues

- ddd-003: Missing domain services (services publish events)
- ddd-002: Invoice aggregate coupling (events decouple contexts)
- ddd-005: Stub implementations (events enable complete workflows)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um Event-Driven Architecture designer. Você implementa event buses in-process para desacoplamento entre bounded contexts, sem over-engineering para microserviços.
- **Instructions:** Crie um EventBus simples (in-process, pub/sub) e domain events para os workflows críticos: Subscription→Invoice, Customer status change, Member lifecycle.
- **Steps:** 1) Criar EventBus em shared/events/. 2) Definir DomainEvent interface. 3) Criar events por contexto. 4) Criar handlers cross-context. 5) Integrar nos domain services. 6) Registrar handlers no bootstrap.
- **Expectation:** EventBus funcional in-process. SubscriptionCreated → auto-generate Invoice. Events tipados e type-safe. Handlers isolados (falha de um não afeta outro).

### Execução

**Skill 1 de 2 — Event Bus & Events**
```
/antigravity-awesome-skills:event-sourcing-architect
Role: Event-driven architect implementando pub/sub in-process para monolito Next.js (NÃO microserviços).
Instructions: Crie o EventBus e os domain events para cross-context communication.
Steps: 1) Crie src/shared/events/domain-event.ts: interface DomainEvent { id: string, type: string, aggregateId: string, aggregateType: string, occurredAt: Date, data: unknown }. 2) Crie src/shared/events/event-bus.ts: class EventBus com private handlers: Map<string, handler[]>. Métodos: subscribe<T>(eventType, handler: (event: T) => Promise<void>), publish<T>(event: T) — itera handlers, try/catch cada um (log error, não propaga). 3) Export singleton: export const eventBus = new EventBus(). 4) Crie src/modules/subscription/events/subscription-events.ts: SubscriptionCreatedEvent, SubscriptionCancelledEvent, SubscriptionRenewedEvent. 5) Crie src/modules/invoice/events/invoice-events.ts: InvoiceOverdueEvent, InvoicePaidEvent. 6) Crie src/modules/member/events/member-events.ts: MemberAddedEvent, MemberRemovedEvent, MemberRoleChangedEvent. 7) Crie src/shared/events/index.ts barrel export.
Expectation: EventBus singleton funcional. 8 domain events tipados. Handlers isolados (falha de um não crash app). Sem event persistence (in-process only). pnpm build compila.
Referência: .issues/ddd-004-missing-domain-events.md (código completo).
```

**Skill 2 de 2 — Handlers & Integration**
```
/antigravity-awesome-skills:architecture-patterns
Role: Application architect integrando domain events nos domain services existentes.
Instructions: Crie handlers cross-context e integre publish nos domain services.
Steps: 1) Crie src/modules/invoice/event-handlers/on-subscription-created.ts: handler que chama InvoiceGenerationService.generateInvoiceForSubscription quando SubscriptionCreatedEvent é publicado. 2) Crie src/modules/subscription/event-handlers/on-customer-deactivated.ts: handler que suspende subscriptions ativas quando customer desativado. 3) Atualize SubscriptionDomainService: após activateSubscription, publique SubscriptionCreatedEvent via eventBus.publish(). Após cancelSubscription, publique SubscriptionCancelledEvent. 4) Atualize CustomerLifecycleService: após deactivateCustomer, publique CustomerStatusChangedEvent. 5) Crie src/infra/bootstrap/register-event-handlers.ts: função que registra todos os handlers no eventBus singleton. 6) Chame registerEventHandlers() no app startup (src/app/layout.tsx ou instrumentation.ts do Next.js).
Expectation: 2 handlers cross-context registrados. Domain services publicam events após operações. Workflow Subscription created → Invoice generated funciona end-to-end. Handlers registrados no startup. pnpm build compila.
```
