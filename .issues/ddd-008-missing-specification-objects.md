# DDD-008: Complex Queries Lack Specification Objects

**Severity:** LOW
**Category:** Code Quality | Refactoring Opportunity
**Status:** Open
**Linear:** [PRD-39](https://linear.app/studio-risine/issue/PRD-39/ddd-008-complex-queries-lack-specification-objects)

## Problem

Complex query logic is scattered across repository implementations rather than encapsulated in reusable Specification objects. This violates the Specification pattern and makes queries difficult to test, reuse, and understand.

## Current Antipattern

```typescript
// src/modules/invoice/repository/invoice.ts

// Query 1: Find invoices overdue by 30+ days
export async function findOverdueInvoices(): Promise<Invoice[]> {
  return await db
    .select()
    .from(invoicesTable)
    .where(
      and(
        eq(invoicesTable.status, 'open'),
        lt(invoicesTable.dueDate, sql`now() - interval '30 days'`)
      )
    );
}

// Query 2: Find invoices due within next 7 days
export async function findUpcomingDueInvoices(): Promise<Invoice[]> {
  return await db
    .select()
    .from(invoicesTable)
    .where(
      and(
        eq(invoicesTable.status, 'open'),
        gte(invoicesTable.dueDate, sql`now()`),
        lt(invoicesTable.dueDate, sql`now() + interval '7 days'`)
      )
    );
}

// Query 3: Find invoices paid in last 30 days
export async function findRecentlyPaidInvoices(): Promise<Invoice[]> {
  return await db
    .select()
    .from(invoicesTable)
    .where(
      and(
        eq(invoicesTable.status, 'paid'),
        gte(invoicesTable.paidAt, sql`now() - interval '30 days'`)
      )
    );
}

// Problem: 3 similar queries, hard to combine, test, or reuse
```

**Issues:**
- ❌ Query logic duplicated (where conditions repeat)
- ❌ Cannot combine queries (e.g., "overdue OR upcoming due")
- ❌ Cannot test conditions independently
- ❌ Hard to change business rules (update all 3 queries if date changes)
- ❌ New team members don't understand intent

## Recommended Pattern: Specification Objects

The Specification pattern encapsulates query conditions as first-class objects:

```typescript
// NEW: src/modules/invoice/specifications/invoice-specifications.ts

import { SQL, and, eq, lt, gte, sql } from 'drizzle-orm';
import { invoicesTable } from '@/infra/db/schemas/invoice';

export class InvoiceSpecification {
  protected conditions: SQL[] = [];

  addCondition(condition: SQL): this {
    this.conditions.push(condition);
    return this;
  }

  toWhereClause(): SQL | undefined {
    return this.conditions.length > 0 ? and(...this.conditions) : undefined;
  }

  static isOpen(): InvoiceSpecification {
    const spec = new InvoiceSpecification();
    return spec.addCondition(eq(invoicesTable.status, 'open'));
  }

  static isPaid(): InvoiceSpecification {
    const spec = new InvoiceSpecification();
    return spec.addCondition(eq(invoicesTable.status, 'paid'));
  }

  static isDue(): InvoiceSpecification {
    const spec = new InvoiceSpecification();
    return spec.addCondition(lte(invoicesTable.dueDate, sql`now()`));
  }

  static isOverdueBy(days: number): InvoiceSpecification {
    const spec = new InvoiceSpecification();
    return spec.addCondition(
      lt(invoicesTable.dueDate, sql`now() - interval '${sql.raw(`${days} days`)}'`)
    );
  }

  static isDueWithin(days: number): InvoiceSpecification {
    const spec = new InvoiceSpecification();
    return spec
      .addCondition(gte(invoicesTable.dueDate, sql`now()`))
      .addCondition(lt(invoicesTable.dueDate, sql`now() + interval '${sql.raw(`${days} days`)}'`));
  }

  static isPaidSince(days: number): InvoiceSpecification {
    const spec = new InvoiceSpecification();
    return spec.addCondition(
      gte(invoicesTable.paidAt, sql`now() - interval '${sql.raw(`${days} days`)}'`)
    );
  }
}

export class InvoiceQuerySpecifications {
  static findOverdueBy30Days(): InvoiceSpecification {
    return InvoiceSpecification.isOpen()
      .addCondition(InvoiceSpecification.isOverdueBy(30).toWhereClause());
  }

  static findUpcomingDueWithin7Days(): InvoiceSpecification {
    return InvoiceSpecification.isOpen()
      .addCondition(InvoiceSpecification.isDueWithin(7).toWhereClause());
  }

  static findRecentlyPaidWithin30Days(): InvoiceSpecification {
    return InvoiceSpecification.isPaid()
      .addCondition(InvoiceSpecification.isPaidSince(30).toWhereClause());
  }
}
```

Now repositories become much simpler:

```typescript
// REFACTORED: src/modules/invoice/repository/invoice.ts

export async function findBySpecification(
  spec: InvoiceSpecification
): Promise<Invoice[]> {
  const whereClause = spec.toWhereClause();

  return await db
    .select()
    .from(invoicesTable)
    .where(whereClause);
}

// Old queries now one-liners:
export async function findOverdueInvoices(): Promise<Invoice[]> {
  return findBySpecification(InvoiceQuerySpecifications.findOverdueBy30Days());
}

export async function findUpcomingDueInvoices(): Promise<Invoice[]> {
  return findBySpecification(InvoiceQuerySpecifications.findUpcomingDueWithin7Days());
}

export async function findRecentlyPaidInvoices(): Promise<Invoice[]> {
  return findBySpecification(InvoiceQuerySpecifications.findRecentlyPaidWithin30Days());
}
```

## Benefits

✅ **Reusability**: Build complex queries from simple specs
✅ **Testability**: Test each spec independently
✅ **Composability**: Combine specs (find overdue AND high-value)
✅ **Business Logic**: Query logic separate from ORM calls
✅ **Maintainability**: One place to change a business rule

## Example: Complex Composed Query

```typescript
// Find high-value overdue invoices with late fees applicable
const spec = InvoiceSpecification.isOpen()
  .addCondition(InvoiceSpecification.isOverdueBy(30).toWhereClause())
  .addCondition(gte(invoicesTable.amount, 10000));

const criticalInvoices = await invoiceRepository.findBySpecification(spec);
```

## Where to Apply This Pattern

### High Priority (Complex Queries)
1. **Invoice**
   - Overdue queries (used in collections workflow)
   - Upcoming due queries (used in reminders)
   - High-value queries (used in risk assessment)

2. **Subscription**
   - Ending soon (renewal reminder)
   - Trial ending (upgrade prompt)
   - Suspended (reactivation email)
   - Past due (collection workflow)

3. **Customer**
   - By status (active, inactive, suspended)
   - By payment history (good, at-risk, defaulted)
   - By lifetime value (segmentation)

### Medium Priority
4. **Member**
   - By space
   - By role
   - By activity level
   - By invitation status

### Lower Priority
5. **Project**
   - By status
   - By owner
   - By last activity

## Implementation Plan

### Phase 1: Create Specification Base Class

```typescript
// NEW: src/shared/patterns/specification.ts
export abstract class Specification<T> {
  protected conditions: SQL[] = [];

  protected addCondition(condition: SQL): this {
    this.conditions.push(condition);
    return this;
  }

  toWhereClause(): SQL | undefined {
    return this.conditions.length > 0 ? and(...this.conditions) : undefined;
  }
}
```

### Phase 2: Create Specifications Per Context

- `/src/modules/invoice/specifications/invoice-specifications.ts`
- `/src/modules/subscription/specifications/subscription-specifications.ts`
- `/src/modules/customer/specifications/customer-specifications.ts`
- `/src/modules/member/specifications/member-specifications.ts`

### Phase 3: Refactor Repositories

- Update repository methods to accept Specification objects
- Remove complex query logic from repositories
- Create simple query methods that use specifications

### Phase 4: Tests

Test each specification independently:

```typescript
describe('InvoiceSpecification', () => {
  it('should find invoices overdue by 30+ days', async () => {
    const spec = InvoiceQuerySpecifications.findOverdueBy30Days();
    const invoices = await repository.findBySpecification(spec);

    invoices.forEach(inv => {
      expect(inv.status).toBe('open');
      expect(inv.dueDate).toBeLessThan(thirtyDaysAgo);
    });
  });
});
```

## Files to Create

```
src/shared/patterns/
└── specification.ts (base class)

src/modules/{context}/specifications/
├── invoice-specifications.ts
├── subscription-specifications.ts
├── customer-specifications.ts
└── member-specifications.ts
```

## Verification

After implementation:
1. ✅ All complex queries encapsulated in Specification classes
2. ✅ Repositories accept Specification objects
3. ✅ No SQL logic in action files
4. ✅ Specifications are unit-testable
5. ✅ Business rules encoded in specification names

## Effort Estimate

- Design base class: 4 hours
- Create 4 specification classes: 16 hours
- Refactor 4 repositories: 12 hours
- Tests: 12 hours
- **Total: ~44 hours (~1 week)**

## Timeline

- **Priority**: Low (refactoring, no new features)
- **When**: After ddd-001 through ddd-005 are resolved
- **Ideal for**: Code quality sprint or refactoring week

## Related Issues

- ddd-003: Missing domain services (can use specifications)
- ddd-005: Stub implementations (specifications help organize queries)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Specification pattern specialist. Você encapsula query predicates como objetos composíveis, testáveis e reutilizáveis.
- **Instructions:** Crie uma base Specification abstrata e implemente specifications para Invoice e Subscription (os módulos com queries mais complexas).
- **Steps:** 1) Criar Specification base class em shared/patterns/. 2) Criar InvoiceSpecification (isOpen, isOverdue, isDueWithin, isPaidSince). 3) Criar SubscriptionSpecification (isActive, isTrialEnding, isSuspended). 4) Refatorar repositories para aceitar findBySpecification. 5) Testes para cada specification.
- **Expectation:** Queries complexas encapsuladas em objetos composíveis. Repositories com método genérico findBySpecification. Specifications testáveis independentemente.

### Execução

**Skill 1 de 2 — Specifications**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner implementando Specification pattern para queries de negócio.
Instructions: Crie a infraestrutura de Specification e implemente para Invoice e Subscription.
Steps: 1) Crie src/shared/patterns/specification.ts: abstract class Specification<T> com protected conditions: SQL[] (import de drizzle-orm). Método addCondition(condition: SQL): this (chainable). Método toWhereClause(): SQL | undefined (combina com and()). 2) Crie src/modules/invoice/specifications/invoice-specification.ts: class InvoiceSpecification extends Specification<Invoice>. Static methods: isOpen() → eq(status, 'open'), isPaid() → eq(status, 'paid'), isOverdueBy(days) → lt(dueDate, sql`now() - interval '${days} days'`), isDueWithin(days) → between now and now+days, isPaidSince(days). 3) Crie composed queries: findOverdueBy30Days() = isOpen().addCondition(isOverdueBy(30)), findUpcomingDue7Days() = isOpen().addCondition(isDueWithin(7)). 4) Crie src/modules/subscription/specifications/subscription-specification.ts: isActive(), isTrialEnding(days), isSuspended(), isPastDue(). 5) Atualize InvoiceRepository: adicione findBySpecification(spec: InvoiceSpecification): Promise<Invoice[]> que executa db.select().from(table).where(spec.toWhereClause()). 6) Refatore findOverdueInvoices() para usar InvoiceSpecification.findOverdueBy30Days().
Expectation: 2 specification classes com ~10 static methods total. Repository aceita specifications. Queries existentes refatoradas. Composição funciona (spec1 + spec2).
Referência: .issues/ddd-008-missing-specification-objects.md (código completo).
```

**Skill 2 de 2 — Tests**
```
/antigravity-awesome-skills:testing-patterns
Role: Test engineer criando testes para Specification pattern.
Instructions: Teste cada specification independentemente e em composição.
Steps: 1) Crie src/modules/invoice/specifications/invoice-specification.test.ts: a) isOpen() gera SQL correto. b) isOverdueBy(30) gera intervalo correto. c) Composição: isOpen() + isOverdueBy(30) combina com AND. d) toWhereClause() retorna undefined quando sem condições. 2) Crie src/modules/subscription/specifications/subscription-specification.test.ts: similar. 3) Teste integração: findBySpecification(spec) retorna resultados corretos com mock de db. 4) Use vi.mock para mockar drizzle-orm sql functions se necessário.
Expectation: 8+ testes cobrindo cada specification method e composição. pnpm test passa.
```
