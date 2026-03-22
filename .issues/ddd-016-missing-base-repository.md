# DDD-016: Missing BaseRepository Pattern

**Severity:** HIGH
**Category:** Infrastructure | Tactical Design | RLS
**Status:** Open
**Linear:** [PRD-24](https://linear.app/studio-risine/issue/PRD-24/ddd-016-missing-baserepository-pattern)
**Depends on:** DDD-009, DDD-015
**Blocks:** Proper organization context injection

## Problem

Tactical design specifies BaseRepository to inject `organization_id` into all write operations for RLS compliance, but **no base class exists**. Each repository independently constructs queries without enforcing organization context.

**Tactical Design Requirement:**
```
BaseRepository:
- Injects organization_id into all write operations (INSERT, UPDATE, DELETE)
- Enforces organization context cannot be overridden
- Provides common CRUD patterns
- Ensures RLS compliance at data layer
```

**Current State:** No base class; each repository builds queries independently.

## Problem Example

```typescript
// Current (UNSAFE):
export function customerRepository(): ICustomerRepository {
  return {
    async create(input: CustomerInsert) {
      // No guarantee organization_id is included
      // Can accidentally create customer for wrong org
      return await db.insert(customersTable).values(input).returning();
    },
  };
}

// Desired (SAFE):
export function customerRepository(organizationId: string): ICustomerRepository {
  return {
    async create(input: CustomerInsert) {
      // BaseRepository enforces org_id injection
      return await db.insert(customersTable)
        .values({ ...input, organizationId })
        .returning();
    },
  };
}
```

## Recommendation

### Create BaseRepository

```typescript
// NEW: src/infra/repositories/base-repository.ts

export abstract class BaseRepository<Entity, Insert, Update> {
  protected organizationId: string;
  protected db: Database;

  constructor(organizationId: string, db: Database) {
    if (!organizationId) {
      throw new Error('Organization ID is required for repository');
    }
    this.organizationId = organizationId;
    this.db = db;
  }

  /**
   * Injects organization_id into insert values.
   */
  protected injectOrgId(input: any): any {
    return {
      ...input,
      organizationId: this.organizationId,
    };
  }

  /**
   * Ensures organization_id filter in WHERE clause.
   */
  protected withOrgFilter(condition: SQL): SQL {
    // Append organization_id check to prevent cross-org access
    return and(condition, eq(/* table.organizationId */, this.organizationId));
  }

  /**
   * Common: findById with org check.
   */
  async findById(id: string): Promise<Entity | null> {
    throw new Error('Implement in subclass');
  }

  /**
   * Common: create with org enforcement.
   */
  async create(input: Insert): Promise<Entity> {
    throw new Error('Implement in subclass');
  }

  /**
   * Common: update with org enforcement.
   */
  async update(id: string, input: Partial<Update>): Promise<Entity> {
    throw new Error('Implement in subclass');
  }

  /**
   * Common: delete with org enforcement.
   */
  async delete(id: string): Promise<void> {
    throw new Error('Implement in subclass');
  }
}
```

### Update CustomerRepository to Extend BaseRepository

```typescript
// src/modules/customer/repository/customer.ts (UPDATE)

import { BaseRepository } from '@/infra/repositories/base-repository';

export class CustomerRepository extends BaseRepository<
  Customer,
  CustomerInsert,
  CustomerUpdate
> {
  async create(input: CustomerInsert): Promise<Customer> {
    // Organization ID AUTOMATICALLY injected
    return await this.db
      .insert(customersTable)
      .values(this.injectOrgId(input))
      .returning()
      .then(rows => rows[0]);
  }

  async findById(id: string): Promise<Customer | null> {
    // Organization ID filter AUTOMATICALLY applied
    return await this.db
      .select()
      .from(customersTable)
      .where(this.withOrgFilter(eq(customersTable.id, id)))
      .then(rows => rows[0] ?? null);
  }

  async update(id: string, input: Partial<CustomerUpdate>): Promise<Customer> {
    return await this.db
      .update(customersTable)
      .set(input)
      .where(this.withOrgFilter(eq(customersTable.id, id)))
      .returning()
      .then(rows => rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(customersTable)
      .where(this.withOrgFilter(eq(customersTable.id, id)));
  }

  async findBySpaceId(spaceId: string): Promise<Customer[]> {
    return await this.db
      .select()
      .from(customersTable)
      .where(
        this.withOrgFilter(eq(customersTable.spaceId, spaceId))
      );
  }
}

// Factory ensures org context
export function customerRepository(organizationId: string): ICustomerRepository {
  return new CustomerRepository(organizationId, db);
}
```

### Update Factory Functions

```typescript
// CURRENT (UNSAFE):
export function spaceRepository() { ... }
export function memberRepository() { ... }

// UPDATED (SAFE):
export function spaceRepository(organizationId: string) { ... }
export function memberRepository(organizationId: string) { ... }
export function customerRepository(organizationId: string) { ... }
export function projectRepository(organizationId: string) { ... }
// ... etc for all repositories
```

### Server Action Integration

```typescript
// src/modules/customer/actions/create-customer-action.ts (UPDATE)

'use server';

export async function createCustomerAction(
  input: CreateCustomerInput
): Promise<Result<Customer>> {
  try {
    // Get current user's organization
    const currentOrgId = await getCurrentOrganizationId(); // From auth context

    // Repository receives org context
    const repo = customerRepository(currentOrgId);
    const customer = await repo.create(input);

    return success(customer);
  } catch (error) {
    return failure(UNKNOWN_ERROR, 'Failed to create customer');
  }
}

// Helper to get current org from session/context
async function getCurrentOrganizationId(): Promise<string> {
  const session = await getSession(); // From auth
  if (!session?.user.id) throw new Error('Not authenticated');

  // Get user's default organization
  const user = await userRepository().findById(session.user.id);
  if (!user) throw new Error('User not found');

  // For now, get first organization
  // Later: use session-stored organization preference
  const membership = await memberRepository(null) // Temporary bypass
    .findByUserId(user.id);

  return membership?.[0]?.organizationId ?? null;
}
```

## Benefits

✅ **RLS Enforcement**: Organization ID always injected
✅ **Cross-Org Prevention**: Cannot accidentally access other org's data
✅ **DRY**: Common patterns in base class
✅ **Type Safety**: Compile-time checks
✅ **Testability**: Mock base class for testing
✅ **Consistency**: All repositories follow same pattern

## Files to Create

- `/src/infra/repositories/base-repository.ts` - Base class

## Files to Update

- All repository files (Space, Member, Customer, Project, Subscription, Invoice)
- All action files (need to pass organizationId to repositories)
- All factory functions

## Verification

After implementation:
1. ✅ All repositories extend BaseRepository
2. ✅ Organization ID cannot be omitted from queries
3. ✅ All writes include organization_id
4. ✅ All reads filter by organization_id
5. ✅ No cross-organization data access possible
6. ✅ Factories require organization context

## Effort Estimate

- Base repository implementation: 3 hours
- Update all repositories (8 total): 8 hours
- Update all actions (30+ files): 6 hours
- Context propagation: 4 hours
- Tests: 5 hours
- **Total: ~26 hours**

## Related Issues

- DDD-009: Missing organization_id (column foundation)
- DDD-015: Missing User entity (for context)
- DDD-001: Product tenant isolation (solved with BaseRepository)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Infrastructure Architect & TypeScript generics expert. Você projeta abstrações de repositório que garantem isolamento de dados multi-tenant em compile-time e runtime.
- **Instructions:** Crie uma classe abstrata BaseRepository que injeta `organizationId` em todas as operações de escrita e leitura, impossibilitando acesso cross-tenant. Refatore o ProductRepository como prova de conceito.
- **Steps:** 1) Criar `src/infra/repositories/base-repository.ts` com generics <Entity, Insert, Update>. 2) Implementar `injectOrgId()` e `withOrgFilter()`. 3) Refatorar ProductDrizzleRepository para estender BaseRepository. 4) Atualizar factory `productRepository(orgId)`. 5) Atualizar actions de Product para obter orgId do contexto. 6) Validar type-safety com pnpm build.
- **Expectation:** BaseRepository abstrato, type-safe, sem 'any'. Product migrado como referência. Factory exige organizationId. Impossível criar query sem org context.

### Execução

**Skill 1 de 2 — BaseRepository**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner implementando o Repository pattern com tenant isolation conforme docs/tactical-design.md §5.
Instructions: Crie o BaseRepository e refatore Product como prova de conceito.
Steps: 1) Crie src/infra/repositories/base-repository.ts: abstract class BaseRepository<Entity, Insert, Update> com constructor(organizationId: string, db: Database) que valida organizationId não-vazio. 2) Método protected injectOrgId(input: Insert): adiciona organizationId ao input. 3) Método protected withOrgFilter(condition: SQL): combina com and(condition, eq(table.organizationId, this.organizationId)). 4) Métodos abstract: findById(id), create(input), update(id, input), delete(id). 5) Refatore src/modules/product/repository/product-drizzle-repository.ts para: class ProductDrizzleRepository extends BaseRepository<Product, ProductInsert, ProductUpdate>. 6) Atualize factory: export const productRepository = (orgId: string) => new ProductDrizzleRepository(orgId, db). 7) Atualize create-product-action.ts e find-product-action.ts para passar organizationId.
Expectation: BaseRepository funcional. ProductRepository estende BaseRepository. Actions passam orgId. pnpm build compila. Testes existentes de product atualizados.
Referências: docs/tactical-design.md §5 (Repositories). .issues/ddd-016-missing-base-repository.md.
```

**Skill 2 de 2 — Type Safety**
```
/antigravity-awesome-skills:typescript-expert
Role: TypeScript advanced types specialist revisando generics de infraestrutura.
Instructions: Revise e melhore a type-safety do BaseRepository criado.
Steps: 1) Verifique que BaseRepository<Entity, Insert, Update> tem bounds corretos (no mínimo Record<string, unknown>). 2) injectOrgId deve retornar Insert & { organizationId: string } (intersection type). 3) withOrgFilter deve aceitar SQL (import de drizzle-orm) e retornar SQL. 4) Factory functions devem ter return type explícito (ex: ProductRepository, não 'any'). 5) Elimine qualquer uso de 'as any' ou type assertions desnecessárias. 6) Considere criar um tipo utilitário WithOrgId<T> = T & { organizationId: string }. 7) Valide com pnpm build --strict (se disponível) ou pnpm build.
Expectation: Zero 'any' no BaseRepository e ProductRepository. Tipos inferidos corretamente em toda a chain: action → factory → repository → database. Type errors em compile-time se orgId omitido.
```
