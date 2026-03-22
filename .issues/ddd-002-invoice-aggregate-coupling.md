# DDD-002: Invoice Queries Violate Customer Aggregate Boundary

**Severity:** HIGH
**Category:** Aggregate Boundary | Coupling Violation
**Status:** Open
**Linear:** [PRD-33](https://linear.app/studio-risine/issue/PRD-33/ddd-002-invoice-queries-violate-customer-aggregate-boundary)

## Problem

The `Invoice` repository directly queries across the `Customer` aggregate boundary, violating DDD principles. Invoices should be queried through their owning `Subscription`, not directly from `Customer`.

**Current Implementation:**
```typescript
// src/modules/invoice/repository/invoice.ts
export async function findLatestByCustomerId(customerId: string): Promise<Invoice | null> {
  // VIOLATION: Invoice queries across Subscription → Customer boundary
  const result = await db
    .select()
    .from(invoicesTable)
    .innerJoin(subscriptionsTable, eq(invoicesTable.subscriptionId, subscriptionsTable.id))
    .innerJoin(customersTable, eq(subscriptionsTable.customerId, customersTable.id))
    .where(eq(customersTable.id, customerId))
    .orderBy(desc(invoicesTable.createdAt))
    .limit(1)
    .then(rows => rows[0]?.invoices ?? null);

  return result;
}
```

## Why This Violates DDD

1. **Aggregate Boundary**: `Invoice` is owned by `Subscription`, not `Customer`
   - Invoice ← Subscription ← Customer (aggregate hierarchy)
   - Query chain: Customer → Subscription → Invoice (WRONG)

2. **Coupling**: Invoice repository depends on Customer schema details
   - Tight coupling makes refactoring dangerous
   - Breaking Customer schema changes Invoice queries

3. **Semantic**: The query asks "invoices for this customer" but should ask "invoices for this subscription"

## Impact

- 🔴 Repository exposes internal aggregate relationships
- 🔴 Subscription aggregate's invariants not enforced through proper channels
- 🔴 Complex query logic scattered instead of centralized

## Root Cause

Convenience: It's easier to query "get invoices by customer" than "get customer → get subscriptions → get invoices per subscription"

## Recommendation

**Step 1: Refactor Query Path**
Change from Customer-based queries to Subscription-based queries:

```typescript
// CORRECT: Query through Subscription aggregate
export async function findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
  return await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.subscriptionId, subscriptionId))
    .orderBy(desc(invoicesTable.createdAt));
}

// If you need "latest invoice for customer", query subscriptions first:
// 1. Get subscriptions for customer
// 2. Get latest invoice per subscription
// NOT: Direct customer → invoice join
```

**Step 2: Create Domain Service**
Implement a domain service for cross-aggregate queries:

```typescript
// NEW FILE: src/modules/invoice/services/customer-invoice-service.ts
export class CustomerInvoiceService {
  async getLatestInvoiceForCustomer(customerId: string) {
    const subscriptions = await subscriptionRepository.findByCustomerId(customerId);
    const invoices = await Promise.all(
      subscriptions.map(sub => invoiceRepository.findBySubscriptionId(sub.id))
    );
    return invoices.flat().sort(byDateDesc)[0];
  }
}
```

**Step 3: Update Actions**
Replace direct repository calls with domain service:
- `/src/modules/invoice/actions/` - Use domain service instead

## Files Affected

- `/src/modules/invoice/repository/invoice.ts` - Refactor queries
- `/src/modules/invoice/repository/invoice-interface.ts` - Update interface
- NEW: `/src/modules/invoice/services/customer-invoice-service.ts` - Domain service
- `/src/modules/invoice/actions/` - Update to use service
- `/src/modules/subscription/repository/subscription.ts` - May need inverse queries

## Verification

After fix:
1. ✅ No direct Customer ↔ Invoice joins in invoice repository
2. ✅ All queries start from Invoice or its owned aggregate (Subscription)
3. ✅ Domain service coordinates cross-aggregate logic
4. ✅ Tests verify subscription ownership is preserved

## Related Issues

- ddd-003: Missing domain services (this is a use case)
- ddd-004: Missing domain events (domain service could publish events)
- ddd-001: Product tenant isolation (needs similar structure)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Context Mapping specialist. Você identifica e corrige violações de aggregate boundary, substituindo joins cross-aggregate por domain services.
- **Instructions:** Remova o join direto Invoice→Subscription→Customer do InvoiceRepository. Crie um CustomerInvoiceService que coordena queries respeitando boundaries: Customer aggregate ← Subscription ← Invoice.
- **Steps:** 1) Remover findLatestByCustomerId do InvoiceRepository. 2) Criar CustomerInvoiceService que busca via Subscription. 3) Atualizar actions. 4) Validar que nenhum repo faz join cross-aggregate.
- **Expectation:** InvoiceRepository só acessa invoicesTable e subscriptionsTable. Zero joins com customersTable. Domain service coordena cross-aggregate queries.

### Execução

**Skill 1 de 1**
```
/antigravity-awesome-skills:ddd-context-mapping
Role: DDD context mapping specialist corrigindo violação de aggregate boundary entre Invoice e Customer.
Instructions: Refatore InvoiceRepository para respeitar boundaries e crie domain service para queries cross-aggregate.
Steps: 1) Em src/modules/invoice/repository/invoice-drizzle-repository.ts: REMOVA o método findLatestByCustomerId (viola boundary — faz JOIN invoice→subscription→customer). 2) Mantenha apenas: findById, findBySubscriptionId, findOverdue, create, update, delete (todos acessam apenas invoicesTable). 3) Atualize interface em invoice-repository.ts para remover findLatestByCustomerId. 4) Crie src/modules/invoice/services/customer-invoice-service.ts: classe CustomerInvoiceService com constructor(subscriptionRepo, invoiceRepo). Método getLatestInvoiceForCustomer(customerId): a) Busca subscriptions via subscriptionRepo.findByCustomerId(customerId). b) Para cada subscription, busca invoices via invoiceRepo.findBySubscriptionId(sub.id). c) Flatten + sort by date desc → retorna primeira. 5) Atualize qualquer action que usava findLatestByCustomerId para usar CustomerInvoiceService. 6) Documente a relação: Invoice pertence a Subscription (aggregate). Customer é acessado apenas via SubscriptionRepository.
Expectation: Zero imports de customersTable no módulo invoice/. Nenhum JOIN cross-aggregate. CustomerInvoiceService coordena via repos separados. Actions atualizadas. pnpm build compila.
Referência: .issues/ddd-002-invoice-aggregate-coupling.md.
```
