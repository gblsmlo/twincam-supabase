# DDD-001: Product Context Missing Tenant Isolation

**Severity:** HIGH
**Category:** Data Privacy | Context Boundary Violation
**Status:** Done
**Linear:** [PRD-32](https://linear.app/studio-risine/issue/PRD-32/ddd-001-product-context-missing-tenant-isolation)

## Problem

The `Product` bounded context lacks tenant isolation. Unlike all other business entities (`Customer`, `Subscription`, `Invoice`, `Project`), the `Product` table has no `spaceId` reference.

**Current Schema:**
```typescript
// src/infra/db/schemas/product.ts
export const productsTable = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  priceId: uuid('price_id'),
  // Missing: spaceId reference for tenant isolation
  ...auditFields,
});
```

## Risks

- 🚨 **Data Privacy**: Product catalog could leak across tenants if queries aren't carefully guarded
- 🚨 **Multi-Tenant Safety**: No database-level RLS can enforce tenant boundaries
- 🚨 **Compliance**: May violate data isolation requirements in production

## Root Cause

Product was designed as a global, platform-level catalog rather than tenant-specific. This decision needs alignment with multi-tenant architecture.

## Recommendation

**Option A: Add Tenant Scoping (Recommended)**
- Add `spaceId: uuid('space_id').references(() => spacesTable.id)` to schema
- Update all product queries to include space filter
- Affected files:
  - `/src/infra/db/schemas/product.ts` - Add column
  - `/src/modules/product/repository/product.ts` - Update queries
  - `/src/modules/product/actions/find-product-action.ts` - Add space context
  - `/src/modules/product/actions/create-product-action.ts` - Require space context

**Option B: Treat as Shared Bounded Context**
- Document Product as a "shared context" with global scope
- Implement explicit ACL/authorization in actions (not ideal for data isolation)
- Add `created_at` audit to log tenant usage

## Files Affected

- `/src/infra/db/schemas/product.ts` - Schema definition
- `/src/modules/product/repository/product.ts` - Queries
- `/src/modules/product/actions/` - All action files
- `/src/modules/product/types.ts` - Type definitions
- Database migration needed

## Verification

After fix:
1. ✅ Product queries include space filter
2. ✅ RLS policy enforces tenant boundary on products table
3. ✅ Type system requires spaceId in ProductInsert schema
4. ✅ No product from space A visible to space B

## Related Issues

- ddd-002: Invoice aggregate coupling (depends on proper boundaries)
- ddd-004: Missing domain events (event publish needs space context)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um Drizzle ORM expert refatorando o módulo de referência (Product) para usar BaseRepository com tenant isolation.
- **Instructions:** Migre ProductDrizzleRepository para estender BaseRepository, atualize factory e actions para exigir organizationId. Este módulo será o padrão para todos os outros.
- **Steps:** 1) ProductDrizzleRepository extends BaseRepository. 2) Usar injectOrgId em create. 3) Usar withOrgFilter em findById/findAll. 4) Factory exige orgId. 5) Actions obtêm orgId do contexto. 6) Atualizar testes.
- **Expectation:** Product 100% tenant-isolated. Factory exige orgId. Nenhuma query sem org filter. Testes passam. Serve como referência para demais módulos.

### Execução

**Skill 1 de 1**
```
/antigravity-awesome-skills:drizzle-orm-expert
Role: Drizzle ORM expert migrando Product para BaseRepository com tenant isolation.
Instructions: Refatore o módulo Product (o mais completo do codebase) para usar BaseRepository como prova de conceito.
Steps: 1) Em src/modules/product/repository/product-drizzle-repository.ts: mude class ProductDrizzleRepository para extends BaseRepository<Product, ProductInsert, ProductUpdate>. 2) No constructor, chame super(organizationId, db). 3) No create(): use this.injectOrgId(input) para adicionar organizationId ao insert. 4) No findById(): use this.withOrgFilter(eq(productsTable.id, id)) no WHERE. 5) No findAll(): adicione WHERE eq(productsTable.organizationId, this.organizationId). 6) Atualize factory: export const productRepository = (organizationId: string) => new ProductDrizzleRepository(organizationId, db). 7) Em src/modules/product/actions/create-product-action.ts: obtenha organizationId (por enquanto hardcode ou extraia do contexto de sessão). Passe para productRepository(orgId). 8) Em src/modules/product/actions/find-product-action.ts: idem. 9) Atualize testes em actions/*.test.ts: mock productRepository deve receber orgId.
Expectation: ProductRepository estende BaseRepository. Todas as queries filtram por organizationId. Factory exige orgId como parâmetro. Actions passam orgId. Testes atualizados e passando. pnpm build && pnpm test.
Referência: BaseRepository em src/infra/repositories/base-repository.ts (criado em DDD-016).
```
