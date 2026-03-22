# DDD-010: Missing Organization Hierarchy Support

**Severity:** HIGH
**Category:** Multi-Tenancy | Hierarchy | Tactical Design
**Status:** Open
**Linear:** [PRD-25](https://linear.app/studio-risine/issue/PRD-25/ddd-010-missing-organization-hierarchy-support)
**Blocks:** DDD-011, DDD-012, DDD-013, DDD-014
**Depends on:** DDD-009

## Problem

Tactical design specifies organization hierarchy (sub-accounts) with parent-child relationships and materialized path for efficient tree traversal, but the current implementation has **no hierarchy support**.

**Current State:**
```typescript
// Space has no hierarchy fields
export const spacesTable = pgTable('spaces', {
  id: uuid('id'),
  name: text('name'),
  slug: text('slug'),
  ownerId: uuid('owner_id'),
  // MISSING: parent_organization_id
  // MISSING: hierarchy_path (materialized path)
  ...auditFields,
});
```

**Tactical Design Requirement:**
```
- Hierarchy: parent_organization_id allows nested organizations
- Path: hierarchy_path (e.g., "ORG1.ORG2.ORG3") for efficient tree queries
- Validation: HierarchyService prevents cycles in organizational structure
```

## Business Impact

- **Sub-accounts Feature Blocked**: Cannot create nested organizations
- **Tree Queries Inefficient**: No materialized path means recursive queries
- **Cycle Prevention Missing**: No validation to prevent circular hierarchies
- **Enterprise Feature Unavailable**: Multi-level organizational structure needed for enterprise customers

## Recommendation

### Step 1: Add Hierarchy Columns to Organization (Space)

```typescript
// src/infra/db/schemas/space.ts (UPDATE)
export const spacesTable = pgTable('spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(), // From DDD-009
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull(),

  // HIERARCHY SUPPORT (NEW)
  parentOrganizationId: uuid('parent_organization_id')
    .references(() => spacesTable.id, { onDelete: 'restrict' }), // Prevent deletion if has children

  hierarchyPath: text('hierarchy_path').notNull().default(''), // Materialized path: "ROOT.CHILD.GRANDCHILD"
  hierarchyLevel: integer('hierarchy_level').notNull().default(1), // For efficient filtering

  ...auditFields,
},
(table) => ({
  parentOrgFk: foreignKey({
    columns: [table.parentOrganizationId],
    foreignColumns: [table.id],
  }),
  hierarchyPathIndex: index('idx_spaces_hierarchy_path').on(table.hierarchyPath),
  parentOrgIndex: index('idx_spaces_parent_org_id').on(table.parentOrganizationId),
}));
```

### Step 2: Migration to Add Columns

```sql
-- Add hierarchy columns to spaces table
ALTER TABLE spaces ADD COLUMN parent_organization_id uuid REFERENCES spaces(id) ON DELETE RESTRICT;
ALTER TABLE spaces ADD COLUMN hierarchy_path text NOT NULL DEFAULT '';
ALTER TABLE spaces ADD COLUMN hierarchy_level integer NOT NULL DEFAULT 1;

-- Update root organizations (level 1, no parent)
UPDATE spaces SET hierarchy_path = id::text, hierarchy_level = 1 WHERE parent_organization_id IS NULL;

-- Create index for efficient tree queries
CREATE INDEX idx_spaces_hierarchy_path ON spaces(hierarchy_path);
CREATE INDEX idx_spaces_parent_org_id ON spaces(parent_organization_id);
```

### Step 3: Update Organization Schema Type

```typescript
// src/modules/space/schemas.ts (UPDATE)
export const spaceSelectSchema = createSelectSchema(spacesTable);
export const spaceCreateSchema = createInsertSchema(spacesTable)
  .omit({ hierarchyPath: true, hierarchyLevel: true }) // Computed
  .superRefine((data, ctx) => {
    if (data.slug && !isValidSlug(data.slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Slug must be URL-safe',
        path: ['slug'],
      });
    }
  });

export const spaceUpdateSchema = createUpdateSchema(spacesTable)
  .omit({ hierarchyPath: true, hierarchyLevel: true })
  .partial();

export type Space = z.infer<typeof spaceSelectSchema>;
export type SpaceCreate = z.infer<typeof spaceCreateSchema>;
export type SpaceUpdate = z.infer<typeof spaceUpdateSchema>;
```

### Step 4: Update Repository to Support Hierarchy

```typescript
// src/modules/space/repository/space.ts (UPDATE)
export interface ISpaceRepository {
  create(input: SpaceCreate): Promise<Space>;
  findById(id: string): Promise<Space | null>;
  findByParentId(parentId: string): Promise<Space[]>; // Direct children
  findAncestors(id: string): Promise<Space[]>; // All parents up to root
  findDescendants(id: string): Promise<Space[]>; // All children down to leaves
  updateHierarchy(id: string, parentId: string | null): Promise<Space>; // With validation
}

// Implementation
export function spaceRepository(): ISpaceRepository {
  return {
    async findByParentId(parentId: string): Promise<Space[]> {
      return await db
        .select()
        .from(spacesTable)
        .where(eq(spacesTable.parentOrganizationId, parentId));
    },

    async findAncestors(id: string): Promise<Space[]> {
      // Use hierarchy_path to find all ancestors efficiently
      const org = await this.findById(id);
      if (!org?.hierarchyPath) return [];

      const ancestorIds = org.hierarchyPath.split('.').slice(0, -1); // Remove self
      return await db
        .select()
        .from(spacesTable)
        .where(inArray(spacesTable.id, ancestorIds));
    },

    async findDescendants(id: string): Promise<Space[]> {
      // Use LIKE on hierarchy_path for efficient tree traversal
      const org = await this.findById(id);
      if (!org?.hierarchyPath) return [];

      return await db
        .select()
        .from(spacesTable)
        .where(like(spacesTable.hierarchyPath, `${org.hierarchyPath}.%`));
    },

    async updateHierarchy(id: string, parentId: string | null): Promise<Space> {
      // This delegates to HierarchyService for validation
      throw new Error('Use HierarchyService.moveOrganization() instead');
    },
  };
}
```

## Materialized Path Pattern

**Example Tree Structure:**
```
Root Organization (ID: ORG1)
├── Sub-account A (ID: ORG2, parent: ORG1, path: "ORG1.ORG2")
│   └── Sub-account A1 (ID: ORG3, parent: ORG2, path: "ORG1.ORG2.ORG3")
└── Sub-account B (ID: ORG4, parent: ORG1, path: "ORG1.ORG4")

Query Benefits:
- Find all parents of ORG3: SELECT * WHERE hierarchy_path LIKE 'ORG1.ORG2.ORG3'.substring(0, -1) (parent part)
- Find all children of ORG1: SELECT * WHERE hierarchy_path LIKE 'ORG1.%'
- Get tree depth: COUNT(`.` separators) in hierarchy_path + 1
```

## Files Affected

**Schema:**
- `/src/infra/db/schemas/space.ts`
- `/src/modules/space/schemas.ts`
- `/src/modules/space/types.ts`

**Repository:**
- `/src/modules/space/repository/space.ts`
- `/src/modules/space/repository/space-interface.ts`

**New Migration:**
- `/src/infra/db/migrations/[timestamp]-add-organization-hierarchy.ts`

**New Service** (covered in DDD-011):
- `/src/modules/space/services/hierarchy-service.ts`

## Verification

After implementation:
1. ✅ All organizations have hierarchy_path and hierarchy_level
2. ✅ Root organizations have no parent (parent_organization_id is NULL)
3. ✅ hierarchy_path correctly formatted (dot-separated IDs)
4. ✅ hierarchy_level matches depth in tree
5. ✅ Indexes created for efficient queries
6. ✅ Tree queries work efficiently using LIKE on hierarchy_path

## Effort Estimate

- Schema updates: 4 hours
- Repository enhancements: 6 hours
- Migration: 2 hours
- Testing: 4 hours
- **Total: ~16 hours**

## Related Issues

- DDD-009: Missing organization_id (prerequisite)
- DDD-011: Missing HierarchyService (depends on this)
- DDD-014: Missing HierarchyPath Value Object (refinement)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um Database Architect especializado em tree structures e materialized path pattern em PostgreSQL. Você projeta schemas para hierarquias organizacionais eficientes.
- **Instructions:** Adicione suporte a hierarquia na tabela spaces com parent_organization_id (self-referencing FK), hierarchy_path (materialized path) e hierarchy_level. Atualize o repository com queries de árvore.
- **Steps:** 1) Adicionar colunas de hierarquia ao schema Drizzle. 2) Criar indexes para queries eficientes. 3) Adicionar métodos de árvore ao repository (findByParentId, findAncestors, findDescendants). 4) Gerar migration. 5) Omitir campos computados dos schemas Zod de insert.
- **Expectation:** Tabela spaces suporta hierarquia n-levels. Queries de árvore eficientes via LIKE em hierarchy_path. Migration aplicável. Schemas Zod corretos.

### Execução

**Skill 1 de 2 — Schema Design**
```
/antigravity-awesome-skills:database-architect
Role: Database Architect projetando materialized path para hierarquia organizacional.
Instructions: Projete as colunas de hierarquia para a tabela spaces.
Steps: 1) Coluna parent_organization_id: uuid, nullable, self-referencing FK (spaces.id), ON DELETE RESTRICT (não permitir deletar org com filhos). 2) Coluna hierarchy_path: text NOT NULL DEFAULT '' — formato "ROOT_UUID.CHILD_UUID.GRANDCHILD_UUID". 3) Coluna hierarchy_level: integer NOT NULL DEFAULT 1 — profundidade na árvore. 4) Index idx_spaces_hierarchy_path para queries LIKE 'path%'. 5) Index idx_spaces_parent_org_id para lookup de filhos diretos. 6) CHECK constraint: parent_organization_id != id (prevent self-reference). 7) Documente query patterns: filhos diretos (WHERE parent_org_id = X), todos descendentes (WHERE hierarchy_path LIKE 'X.%'), ancestrais (split hierarchy_path).
Expectation: DDL completo com ALTER TABLE, CREATE INDEX, ADD CONSTRAINT. Exemplos de queries para cada pattern (children, descendants, ancestors). Performance analysis para árvores de até 5 levels.
Referências: docs/tactical-design.md §3 (HierarchyPath). docs/multi-tenancy.md §2 (Sub-accounts).
```

**Skill 2 de 2 — Drizzle Implementation**
```
/antigravity-awesome-skills:drizzle-orm-expert
Role: Drizzle ORM expert implementando tree queries com materialized path.
Instructions: Atualize schema e repository do módulo Space para suportar hierarquia.
Steps: 1) Em src/infra/db/schemas/space.ts, adicione: parentOrganizationId (uuid nullable, self-ref), hierarchyPath (text notNull default ''), hierarchyLevel (integer notNull default 1). Adicione indexes na table config. 2) Em src/modules/space/schemas.ts: omita hierarchyPath e hierarchyLevel do spaceCreateSchema (são computados pelo HierarchyService/Factory). 3) Em src/modules/space/repository/space-drizzle-repository.ts, adicione: findByParentId(parentId) com WHERE parent_organization_id = parentId; findDescendants(id) com WHERE hierarchy_path LIKE '{orgPath}.%'; findAncestors(id) extraindo IDs do hierarchy_path e usando WHERE id IN (...). 4) Atualize a interface ISpaceRepository com os novos métodos. 5) Gere migration: pnpm db:generate.
Expectation: Schema compilando com novos campos. Repository com 3 novos métodos de árvore. Types.ts refletindo novas propriedades. Migration gerada.
Referência: src/modules/product/repository/ (padrão de repository).
```
