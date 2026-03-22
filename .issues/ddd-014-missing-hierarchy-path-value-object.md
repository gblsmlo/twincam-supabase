# DDD-014: Missing HierarchyPath Value Object

**Severity:** MEDIUM
**Category:** Value Object | Refactoring | Domain Design
**Status:** Open
**Linear:** [PRD-29](https://linear.app/studio-risine/issue/PRD-29/ddd-014-missing-hierarchypath-value-object)
**Depends on:** DDD-010
**Blocks:** Type-safe hierarchy path operations

## Problem

Hierarchy paths (e.g., "ORG1.ORG2.ORG3") are currently plain strings, but should be encapsulated as immutable Value Objects for type safety and encapsulated behavior.

**Current State:**
```typescript
// Plain string in schema
hierarchyPath: text('hierarchy_path').notNull().default('');

// Used unsafely in code
const ancestors = path.split('.').slice(0, -1);
```

**Tactical Design Expectation:**
```
HierarchyPath Value Object:
- Immutable representation of organizational hierarchy
- Encapsulates parsing and validation
- Provides methods: getParentPath(), getChildren(), getLevel(), toIds()
```

## Recommendation

### Create HierarchyPath Value Object

```typescript
// NEW: src/modules/space/value-objects/hierarchy-path.ts

export class HierarchyPath {
  private readonly path: string;
  private readonly ids: string[];
  private readonly level: number;

  private constructor(path: string) {
    this.path = path;
    this.ids = path ? path.split('.') : [];
    this.level = this.ids.length;
  }

  /**
   * Creates a HierarchyPath from dot-separated IDs.
   */
  static from(pathString: string): HierarchyPath {
    if (!pathString) {
      return new HierarchyPath('');
    }

    if (!/^[0-9a-f-]+(?:\.[0-9a-f-]+)*$/.test(pathString)) {
      throw new ValueError('Invalid hierarchy path format');
    }

    return new HierarchyPath(pathString);
  }

  /**
   * Creates a root path (single ID).
   */
  static root(id: string): HierarchyPath {
    if (!id || !this.isValidId(id)) {
      throw new ValueError('Invalid ID format');
    }
    return new HierarchyPath(id);
  }

  /**
   * Creates a child path from parent and child ID.
   */
  static extend(parentPath: HierarchyPath, childId: string): HierarchyPath {
    if (!childId || !HierarchyPath.isValidId(childId)) {
      throw new ValueError('Invalid child ID format');
    }

    const newPath = parentPath.path
      ? `${parentPath.path}.${childId}`
      : childId;

    return new HierarchyPath(newPath);
  }

  /**
   * Gets the parent path (all IDs except last).
   */
  getParentPath(): HierarchyPath | null {
    if (this.ids.length <= 1) return null;
    return new HierarchyPath(this.ids.slice(0, -1).join('.'));
  }

  /**
   * Gets all ancestor paths (root through parent).
   */
  getAncestorPaths(): HierarchyPath[] {
    const ancestors: HierarchyPath[] = [];
    for (let i = 1; i < this.ids.length; i++) {
      ancestors.push(new HierarchyPath(this.ids.slice(0, i).join('.')));
    }
    return ancestors;
  }

  /**
   * Gets the level (depth) in the tree.
   */
  getLevel(): number {
    return this.level;
  }

  /**
   * Gets all IDs in the path.
   */
  getIds(): string[] {
    return [...this.ids];
  }

  /**
   * Gets the root ID (first in path).
   */
  getRootId(): string | null {
    return this.ids[0] ?? null;
  }

  /**
   * Gets the leaf ID (last in path).
   */
  getLeafId(): string | null {
    return this.ids[this.ids.length - 1] ?? null;
  }

  /**
   * Checks if this path is a descendant of another.
   */
  isDescendantOf(other: HierarchyPath): boolean {
    if (other.level >= this.level) return false;
    return this.path.startsWith(other.path + '.');
  }

  /**
   * Checks if this path is an ancestor of another.
   */
  isAncestorOf(other: HierarchyPath): boolean {
    return other.isDescendantOf(this);
  }

  /**
   * String representation (dot-separated IDs).
   */
  toString(): string {
    return this.path;
  }

  /**
   * Equality check (value object equality).
   */
  equals(other: HierarchyPath): boolean {
    return this.path === other.path;
  }

  /**
   * Validates ID format (UUID).
   */
  private static isValidId(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
  }
}

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueError';
  }
}
```

### Use in Domain

```typescript
// src/modules/space/types.ts (UPDATE)

export type Space = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  ownerId: string;
  parentOrganizationId: string | null;
  hierarchyPath: HierarchyPath; // Value object instead of string
  hierarchyLevel: number;
  createdAt: Date;
  updatedAt: Date;
};

// Update schema to use value object:
// hierarchyPath: HierarchyPath.from(row.hierarchy_path)
```

### Use in HierarchyService

```typescript
// src/modules/space/services/hierarchy-service.ts (UPDATE)

async moveOrganization(orgId: string, newParentId: string | null): Promise<Space> {
  // Use value object methods
  let newPath: HierarchyPath;

  if (newParentId) {
    const newParent = await this.spaceRepository.findById(newParentId);
    if (newParent) {
      newPath = HierarchyPath.extend(newParent.hierarchyPath, orgId);
    }
  } else {
    newPath = HierarchyPath.root(orgId);
  }

  return await this.spaceRepository.update(orgId, {
    parentOrganizationId: newParentId,
    hierarchyPath: newPath, // Value object
    hierarchyLevel: newPath.getLevel(),
  });
}
```

### Repository Integration

```typescript
// src/modules/space/repository/space.ts (UPDATE)

async findDescendants(id: string): Promise<Space[]> {
  const org = await this.findById(id);
  if (!org) return [];

  return await db
    .select()
    .from(spacesTable)
    .where(like(spacesTable.hierarchyPath, `${org.hierarchyPath}%`));
    // .then(rows => rows.map(r => ({
    //   ...r,
    //   hierarchyPath: HierarchyPath.from(r.hierarchy_path)
    // })));
}
```

## Benefits

✅ **Type Safety**: No string confusion, clear intent
✅ **Encapsulation**: Parsing and validation in one place
✅ **Immutability**: Cannot accidentally modify path
✅ **Behavior**: Methods like `isAncestorOf()` encapsulated
✅ **Testability**: Value object logic easily tested
✅ **Documentation**: Code intent clear from types

## Files to Create

- `/src/modules/space/value-objects/hierarchy-path.ts` - Value object
- `/src/modules/space/errors/value-errors.ts` - Value object errors

## Files to Update

- `/src/modules/space/types.ts` - Use value object
- `/src/modules/space/services/hierarchy-service.ts` - Use methods
- `/src/modules/space/repository/space.ts` - Map from database

## Verification

After implementation:
1. ✅ HierarchyPath immutable (no setters)
2. ✅ Parsing validated (rejects invalid formats)
3. ✅ Methods work correctly (ancestors, descendants, etc.)
4. ✅ Equals() checks value equality
5. ✅ toString() returns dot-separated path
6. ✅ Type system prevents string/value confusion

## Effort Estimate

- Value object: 4 hours
- Repository mapping: 3 hours
- Tests: 4 hours
- **Total: ~11 hours**

## Related Issues

- DDD-010: Missing organization hierarchy (foundation)
- DDD-011: Missing HierarchyService (will use value object)
- DDD-017: Missing Role Value Object (similar pattern)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Value Object designer. Você cria objetos imutáveis com comportamento encapsulado, validação no construtor e value equality.
- **Instructions:** Crie o HierarchyPath Value Object que encapsula materialized paths como objetos imutáveis com métodos de navegação na árvore.
- **Steps:** 1) Criar classe imutável com private readonly. 2) Factory methods (from, root, extend). 3) Métodos de navegação (getParent, getAncestors, isDescendantOf). 4) Value equality (equals, toString). 5) Integrar no tipo Space e HierarchyService.
- **Expectation:** HierarchyPath é imutável, validado, com comportamento encapsulado. Substitui string no tipo Space. HierarchyService usa métodos do VO.

### Execução

**Skill 1 de 1**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner implementando Value Object imutável para materialized path (docs/tactical-design.md §3).
Instructions: Crie o HierarchyPath Value Object com validação e comportamento de árvore.
Steps: 1) Crie src/modules/space/value-objects/hierarchy-path.ts. Classe com private constructor, private readonly path (string), ids (string[]), level (number). 2) Static from(pathString): valida formato (regex UUID dot-separated /^[0-9a-f-]+(?:\.[0-9a-f-]+)*$/), retorna instância ou throw ValueError. 3) Static root(id): cria path com um único ID. 4) Static extend(parentPath, childId): cria novo path = parent + '.' + child. 5) getParentPath(): retorna HierarchyPath | null (tudo exceto último ID). 6) getAncestorPaths(): retorna HierarchyPath[] (do root até parent). 7) getLevel(): retorna profundidade. 8) getIds(), getRootId(), getLeafId(). 9) isDescendantOf(other): this.path.startsWith(other.path + '.'). 10) isAncestorOf(other): other.isDescendantOf(this). 11) equals(other): this.path === other.path. 12) toString(): retorna path string. 13) Crie ValueError em src/modules/space/errors/value-errors.ts. 14) Atualize src/modules/space/types.ts: hierarchyPath: HierarchyPath (ao invés de string). 15) Atualize HierarchyService para usar HierarchyPath.extend() ao invés de concatenação manual.
Expectation: Value Object imutável (nenhum setter). Factory methods validam input. Métodos de árvore corretos. Integrado no type Space e HierarchyService. pnpm build compila.
Referência: .issues/ddd-014-missing-hierarchy-path-value-object.md (código completo).
```
