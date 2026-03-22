# DDD-009: Missing organization_id on All Business Tables

**Severity:** CRITICAL
**Category:** Multi-Tenancy | Foundation | RLS
**Status:** Open
**Linear:** [PRD-22](https://linear.app/studio-risine/issue/PRD-22/ddd-009-missing-organization-id-on-all-business-tables)
**Blocks:** Everything - Core multi-tenancy feature

## Problem

The tactical design requires `organization_id` on ALL business entities for RLS (Row-Level Security) and data isolation, but **not a single business table has this column**.

**Current State:**
```typescript
// ALL tables missing organization_id reference

spacesTable { id, name, slug, ownerId, ... } // NO organization_id
customersTable { id, name, email, spaceId, ... } // Has spaceId, NO organization_id
projectsTable { id, name, slug, spaceId, ... } // Has spaceId, NO organization_id
productsTable { id, name, priceId, ... } // NO spaceId, NO organization_id
invoicesTable { id, subscriptionId, status, ... } // NO organization_id
subscriptionsTable { id, customerId, status, ... } // NO organization_id
```

**Tactical Design Requirement:**
```
Every entity must carry organization_id for RLS compliance
- Enables: WHERE organization_id = current_org_id filtering
- Enables: PostgreSQL RLS policies to enforce tenant boundaries
- Enables: BaseRepository context injection
```

## Business Impact

🔴 **CRITICAL RISKS:**
- **Data Leakage**: Without org_id, RLS policies cannot work
- **Tenant Isolation Broken**: Users could access data from other organizations
- **Compliance Risk**: Multi-tenant data isolation violates SaaS best practices
- **Cannot Deploy**: Missing org_id makes multi-tenancy impossible

## Root Cause

Initial implementation used `spaceId` as organization reference, but:
- Tactical design explicitly requires `organization_id` column
- No plan to migrate from `spaceId` to `organization_id`
- Missing understanding that every table needs both tenant context AND domain context

## Recommendation

### Step 1: Understand the Naming Model

**Current Implementation:**
- `Space` = organizational unit
- `spaceId` = reference to space

**Tactical Design:**
- `Organization` = organizational unit
- `organization_id` = reference to organization (on ALL tables)
- `spaceId` can still exist for relationships, but `organization_id` is REQUIRED for RLS

### Step 2: Add organization_id to All Tables

Create migration adding `organization_id` to every table:

```typescript
// NEW: src/infra/db/migrations/add-organization-id.sql

-- 1. Add organization_id to existing tables
ALTER TABLE spaces ADD COLUMN organization_id uuid NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE spaces ADD CONSTRAINT fk_spaces_org FOREIGN KEY (organization_id) REFERENCES spaces(id);

ALTER TABLE members ADD COLUMN organization_id uuid NOT NULL;
ALTER TABLE members ADD CONSTRAINT fk_members_org FOREIGN KEY (organization_id) REFERENCES spaces(id);

ALTER TABLE customers ADD COLUMN organization_id uuid NOT NULL;
ALTER TABLE customers ADD CONSTRAINT fk_customers_org FOREIGN KEY (organization_id) REFERENCES spaces(id);

ALTER TABLE projects ADD COLUMN organization_id uuid NOT NULL;
ALTER TABLE projects ADD CONSTRAINT fk_projects_org FOREIGN KEY (organization_id) REFERENCES spaces(id);

ALTER TABLE products ADD COLUMN organization_id uuid DEFAULT NULL;
ALTER TABLE products ADD CONSTRAINT fk_products_org FOREIGN KEY (organization_id) REFERENCES spaces(id);

ALTER TABLE subscriptions ADD COLUMN organization_id uuid NOT NULL;
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscriptions_org FOREIGN KEY (organization_id) REFERENCES spaces(id);

ALTER TABLE invoices ADD COLUMN organization_id uuid NOT NULL;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_org FOREIGN KEY (organization_id) REFERENCES spaces(id);

-- 2. Create RLS policies using organization_id
CREATE POLICY organization_isolation ON customers
  FOR SELECT USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY organization_isolation ON projects
  FOR SELECT USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ... Similar for all other tables
```

### Step 3: Update Drizzle Schemas

```typescript
// EXAMPLE: src/infra/db/schemas/customer.ts (UPDATE)
export const customersTable = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(), // ADD THIS
  name: text('name').notNull(),
  email: text('email').notNull(),
  spaceId: uuid('space_id').notNull(), // Keep for backward compat
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  ...auditFields,
},
(table) => ({
  orgFk: foreignKey({
    columns: [table.organizationId],
    foreignColumns: [spacesTable.id],
  }),
  spaceFK: foreignKey({
    columns: [table.spaceId],
    foreignColumns: [spacesTable.id],
  }),
}));

// Update type exports
export type Customer = typeof customersTable.$inferSelect;
export type CustomerInsert = typeof customersTable.$inferInsert;
```

### Step 4: Update All Repository Methods

```typescript
// EXAMPLE: src/modules/customer/repository/customer.ts (UPDATE)
export interface ICustomerRepository {
  // OLD: Just space_id
  // NEW: Require organization_id context
  create(organizationId: string, input: CustomerInsert): Promise<Customer>;
  findById(organizationId: string, id: string): Promise<Customer | null>;
  findBySpaceId(organizationId: string, spaceId: string): Promise<Customer[]>;
  // All methods now take organizationId as first parameter for RLS
}

// Implementation enforces org context
export function customerRepository(organizationId: string): ICustomerRepository {
  return {
    async create(orgId: string, input: CustomerInsert): Promise<Customer> {
      // CRITICAL: Ensure organization_id matches context
      if (orgId !== organizationId) {
        throw new Error('Organization context mismatch');
      }
      return await db.insert(customersTable)
        .values({ ...input, organizationId: orgId })
        .returning()
        .then(rows => rows[0]);
    },

    async findById(orgId: string, id: string): Promise<Customer | null> {
      return await db
        .select()
        .from(customersTable)
        .where(and(
          eq(customersTable.id, id),
          eq(customersTable.organizationId, orgId) // RLS enforcement
        ))
        .then(rows => rows[0] ?? null);
    },
  };
}
```

## Implementation Approach

**Option A: Add Columns + Keep spaceId (Recommended for backward compatibility)**
- Add `organization_id` to all tables
- Keep `spaceId` for existing relationships
- Both point to same spaces table
- Advantage: Gradual migration, no breaking changes
- Timeline: Can do in one migration

**Option B: Rename spaceId to organizationId (Breaking but cleaner)**
- Rename all `spaceId` columns to `organizationId`
- Update all references
- Cleaner terminology alignment
- Advantage: Matches tactical design terminology
- Timeline: Major refactoring, breaking changes

**Recommendation: Option A** - Add without removing existing columns to maintain backward compatibility.

## Files Affected

**Schema Files** (10 files):
- `/src/infra/db/schemas/space.ts`
- `/src/infra/db/schemas/member.ts`
- `/src/infra/db/schemas/customer.ts`
- `/src/infra/db/schemas/product.ts`
- `/src/infra/db/schemas/project.ts`
- `/src/infra/db/schemas/subscription.ts`
- `/src/infra/db/schemas/invoice.ts`
- `/src/infra/db/schemas/price.ts` (if applicable)
- `/src/infra/db/schemas/index.ts`

**Repository Files** (8 files):
- `/src/modules/space/repository/space.ts`
- `/src/modules/member/repository/member.ts`
- `/src/modules/customer/repository/customer.ts`
- `/src/modules/product/repository/product.ts`
- `/src/modules/project/repository/project.ts`
- `/src/modules/subscription/repository/subscription.ts`
- `/src/modules/invoice/repository/invoice.ts`
- New: `/src/infra/db/migrations/[timestamp]-add-organization-id.ts`

**Action Files** (All action files need org context):
- Every file in `/src/modules/*/actions/`

## Database Migration

```bash
pnpm db:generate  # Generate migration from schema
pnpm db:migrate   # Apply migration
pnpm db:studio    # Verify columns added
```

## Verification

After implementation:
1. ✅ All tables have `organization_id` column
2. ✅ Foreign keys properly reference spaces table
3. ✅ RLS policies use `organization_id` for filtering
4. ✅ Repositories enforce organization context
5. ✅ No data leakage between organizations
6. ✅ `spaceId` and `organizationId` point to same entity
7. ✅ Database schema passes validation
8. ✅ RLS policies tested (no cross-org access)

## Effort Estimate

- Schema updates: 6 hours
- Repository refactoring: 10 hours
- Action updates: 8 hours
- Migration scripts: 4 hours
- Testing & verification: 6 hours
- **Total: ~34 hours (~1 week)**

## Timeline

- **Priority**: CRITICAL (blocks everything)
- **When**: First - before any other Phase 1 issues
- **Blocks**: DDD-010, DDD-016, DDD-011, DDD-012, DDD-013

## Related Issues

- DDD-016: Missing BaseRepository (depends on org_id columns)
- DDD-010: Organization hierarchy (extends org_id concept)
- DDD-015: User entity (uses org_id for context)
- DDD-001: Product tenant isolation (solved with org_id)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um Database Architect & Drizzle ORM specialist trabalhando em um SaaS multi-tenant (Next.js 16 + Supabase + Drizzle ORM). Você domina PostgreSQL RLS, multi-tenancy patterns e Drizzle schema design.
- **Instructions:** Adicione a coluna `organization_id` (uuid, NOT NULL, FK → spaces.id) em TODAS as tabelas de negócio do codebase para habilitar Row-Level Security multi-tenant. Crie as RLS policies correspondentes. Atualize os schemas Drizzle e gere a migration.
- **Steps:** 1) Auditar schemas atuais em `src/infra/db/schemas/`. 2) Adicionar `organizationId` em cada tabela Drizzle. 3) Criar indexes para performance. 4) Gerar migration SQL. 5) Criar RLS policies (SELECT/INSERT/UPDATE/DELETE). 6) Atualizar schemas Zod derivados em cada módulo. 7) Validar com `pnpm db:generate && pnpm build`.
- **Expectation:** Todas as 7 tabelas de negócio possuem `organization_id` com FK, indexes e RLS policies. Schemas Zod refletem a nova coluna. Migration gerada e pronta para aplicar. Zero erros de compilação.

### Execução

**Skill 1 de 3 — Design do Schema**
```
/antigravity-awesome-skills:database-architect
Role: Database Architect para SaaS multi-tenant com PostgreSQL + Supabase RLS.
Instructions: Audite os schemas em src/infra/db/schemas/ (product.ts, member.ts, subscription.ts, space.ts, project.ts, customer.ts, invoice.ts, price.ts). Projete a adição de organization_id (uuid NOT NULL FK→spaces.id) em cada tabela de negócio.
Steps: 1) Liste cada tabela e suas colunas atuais. 2) Determine quais tabelas precisam de organization_id (todas exceto spaces que JÁ É a organização). 3) Projete os indexes (idx_{table}_organization_id). 4) Projete RLS policies usando current_setting('app.current_organization_id')::uuid para SELECT/INSERT/UPDATE/DELETE. 5) Documente decisão sobre price.ts (tabela de lookup global ou tenant-scoped).
Expectation: Documento completo com: DDL para cada ALTER TABLE, CREATE INDEX, CREATE POLICY. Decisão arquitetural sobre tabelas globais vs tenant-scoped.
Referências: docs/tactical-design.md §1 (Aggregates), docs/multi-tenancy.md §1 (Isolation Strategy).
```

**Skill 2 de 3 — Implementação Drizzle**
```
/antigravity-awesome-skills:drizzle-orm-expert
Role: Drizzle ORM expert implementando multi-tenancy em schemas existentes.
Instructions: Atualize os schemas Drizzle em src/infra/db/schemas/ para adicionar organizationId. Atualize os schemas Zod derivados.
Steps: 1) Em cada schema file (product.ts, member.ts, customer.ts, project.ts, subscription.ts, invoice.ts), adicione: organizationId: uuid('organization_id').notNull().references(() => spacesTable.id). 2) Adicione index na table config: organizationIdIndex: index('idx_{table}_organization_id').on(table.organizationId). 3) Em cada módulo (src/modules/*/schemas.ts), verifique que createInsertSchema e createSelectSchema capturam a nova coluna. 4) Exporte os tipos atualizados em types.ts.
Expectation: Todos os schemas Drizzle compilam com organizationId. Tipos TypeScript incluem a nova propriedade. pnpm build sem erros.
Referência: src/modules/product/ como padrão canônico. src/infra/db/helpers/audit-fields.ts para padrão de campos compartilhados.
```

**Skill 3 de 3 — Migration**
```
/antigravity-awesome-skills:database-migration
Role: Migration engineer garantindo zero-downtime na adição de colunas.
Instructions: Gere e valide a migration Drizzle para adicionar organization_id em todas as tabelas.
Steps: 1) Execute pnpm db:generate para gerar migration a partir dos schemas atualizados. 2) Revise o SQL gerado — deve conter ADD COLUMN, ADD CONSTRAINT (FK), CREATE INDEX. 3) Para dados existentes, adicione DEFAULT uuid_generate_v4() temporário ou use UPDATE SET organization_id = (SELECT id FROM spaces LIMIT 1) para seed. 4) Adicione manualmente as CREATE POLICY statements ao final da migration. 5) Valide com pnpm db:migrate em ambiente local.
Expectation: Migration gerada, revisada e aplicável. Dados existentes migrados sem perda. RLS policies criadas. pnpm db:studio mostra colunas corretas.
```
