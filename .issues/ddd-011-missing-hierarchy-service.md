# DDD-011: Missing HierarchyService

**Severity:** MEDIUM
**Category:** Domain Service | Tactical Design
**Status:** Open
**Linear:** [PRD-26](https://linear.app/studio-risine/issue/PRD-26/ddd-011-missing-hierarchyservice)
**Depends on:** DDD-009, DDD-010
**Blocks:** Organization hierarchy operations

## Problem

Tactical design specifies a HierarchyService for validating organizational tree movements, but **no such service exists**.

**Expected Method:**
```
HierarchyService.validateMove(orgId, newParentId): Promise<void>
- Prevents cycles: orgId cannot be ancestor of newParentId
- Prevents self-parent: orgId !== newParentId
- Validates parent exists
- Throws on violation
```

**Current State:** No validation layer for hierarchy operations.

## Recommendation

### Create HierarchyService

```typescript
// NEW: src/modules/space/services/hierarchy-service.ts

export class HierarchyService {
  constructor(private spaceRepository: ISpaceRepository) {}

  /**
   * Validates a move operation in the organization tree.
   * Prevents cycles and invalid moves.
   */
  async validateMove(orgId: string, newParentId: string | null): Promise<void> {
    // Rule 1: Cannot move to self
    if (orgId === newParentId) {
      throw new HierarchyError('Cannot make organization its own parent');
    }

    // Rule 2: If no parent specified, it's a root (valid)
    if (newParentId === null) {
      return;
    }

    // Rule 3: New parent must exist
    const newParent = await this.spaceRepository.findById(newParentId);
    if (!newParent) {
      throw new NotFoundError('Parent organization not found');
    }

    // Rule 4: orgId cannot already be ancestor of newParentId
    // (This would create a cycle)
    const proposedParentAncestors = await this.spaceRepository.findAncestors(newParentId);
    const isAncestorConflict = proposedParentAncestors.some(
      ancestor => ancestor.id === orgId
    );

    if (isAncestorConflict) {
      throw new HierarchyError(
        `Cannot move organization under its own descendant (would create cycle)`
      );
    }
  }

  /**
   * Moves an organization to a new parent and updates hierarchy_path.
   */
  async moveOrganization(
    orgId: string,
    newParentId: string | null
  ): Promise<Space> {
    // Validate first
    await this.validateMove(orgId, newParentId);

    // Compute new hierarchy_path
    let newPath = '';
    let newLevel = 1;

    if (newParentId) {
      const newParent = await this.spaceRepository.findById(newParentId);
      if (newParent) {
        newPath = `${newParent.hierarchyPath}.${orgId}`;
        newLevel = newParent.hierarchyLevel + 1;
      }
    } else {
      newPath = orgId; // Root organization
      newLevel = 1;
    }

    // Update organization
    const updated = await this.spaceRepository.update(orgId, {
      parentOrganizationId: newParentId,
      hierarchyPath: newPath,
      hierarchyLevel: newLevel,
    });

    // Cascade: Update all descendants' paths
    await this.updateDescendantPaths(orgId, newPath);

    return updated;
  }

  /**
   * Recursively updates all descendants when parent moves.
   */
  private async updateDescendantPaths(
    parentId: string,
    newParentPath: string
  ): Promise<void> {
    const descendants = await this.spaceRepository.findChildren(parentId);

    for (const descendant of descendants) {
      const oldPath = descendant.hierarchyPath;
      const relativePathPart = oldPath.substring(oldPath.lastIndexOf('.') + 1);

      const newDescendantPath = `${newParentPath}.${relativePathPart}`;
      const newLevel = (newParentPath.match(/\./g) || []).length + 2;

      await this.spaceRepository.update(descendant.id, {
        hierarchyPath: newDescendantPath,
        hierarchyLevel: newLevel,
      });

      // Recursively update this descendant's children
      await this.updateDescendantPaths(descendant.id, newDescendantPath);
    }
  }

  /**
   * Gets the organizational tree starting from root.
   */
  async getOrganizationTree(rootId: string): Promise<OrganizationNode> {
    const root = await this.spaceRepository.findById(rootId);
    if (!root) throw new NotFoundError('Organization not found');

    const children = await this.spaceRepository.findChildren(rootId);
    const childNodes = await Promise.all(
      children.map(child => this.getOrganizationTree(child.id))
    );

    return {
      id: root.id,
      name: root.name,
      level: root.hierarchyLevel,
      children: childNodes,
    };
  }
}

// Error types
export class HierarchyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HierarchyError';
  }
}

export interface OrganizationNode {
  id: string;
  name: string;
  level: number;
  children: OrganizationNode[];
}
```

### Use in Space Actions

```typescript
// src/modules/space/actions/move-space-action.ts

'use server';

export async function moveSpaceAction(
  spaceId: string,
  newParentId: string | null
): Promise<Result<Space>> {
  try {
    const hierarchyService = new HierarchyService(spaceRepository());
    const movedSpace = await hierarchyService.moveOrganization(spaceId, newParentId);

    return success(movedSpace, 'Organization moved successfully');
  } catch (error) {
    if (error instanceof HierarchyError) {
      return failure(
        VALIDATION_ERROR,
        error.message,
        { hierarchy: error.message }
      );
    }
    if (error instanceof NotFoundError) {
      return failure(NOT_FOUND_ERROR, error.message);
    }
    return failure(UNKNOWN_ERROR, 'Failed to move organization');
  }
}
```

## Files to Create

- `/src/modules/space/services/hierarchy-service.ts` - Main service
- `/src/modules/space/errors/hierarchy-errors.ts` - Custom errors

## Repository Enhancement

```typescript
// src/modules/space/repository/space.ts (UPDATE)

export interface ISpaceRepository {
  // ... existing methods
  findChildren(parentId: string): Promise<Space[]>; // Direct children
  update(id: string, input: Partial<SpaceUpdate>): Promise<Space>; // For updates
}
```

## Verification

After implementation:
1. ✅ Cannot move organization under itself
2. ✅ Cannot create cycles (org under its own descendant)
3. ✅ Parent must exist before moving
4. ✅ All descendants' hierarchy_path updated when parent moves
5. ✅ Tree structure remains valid after moves
6. ✅ Tests verify cycle prevention

## Effort Estimate

- Service implementation: 6 hours
- Repository enhancements: 2 hours
- Action integration: 3 hours
- Tests: 4 hours
- **Total: ~15 hours**

## Related Issues

- DDD-009: Missing organization_id (foundation)
- DDD-010: Missing organization hierarchy (prerequisite)
- DDD-012: Missing OnboardingService (depends on service pattern)
- DDD-013: Missing OrganizationFactory (uses hierarchy validation)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Domain Service designer especializado em invariantes de árvore e cycle prevention. Você cria serviços de domínio testáveis com dependency injection.
- **Instructions:** Crie o HierarchyService que valida e executa movimentações na árvore organizacional, prevenindo ciclos e atualizando materialized paths em cascata.
- **Steps:** 1) Criar `src/modules/space/services/hierarchy-service.ts` com DI via construtor. 2) Implementar validateMove (cycle detection, self-parent, parent exists). 3) Implementar moveOrganization (validate + update + cascade descendants). 4) Implementar getOrganizationTree (recursive tree build). 5) Criar erros customizados. 6) Criar testes unitários completos.
- **Expectation:** HierarchyService previne ciclos em 100% dos casos. Cascade update funciona para árvores de qualquer profundidade. Testes cobrem todos os edge cases. Retorna Result<T>.

### Execução

**Skill 1 de 2 — Service Implementation**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner criando Domain Service para validação de hierarquia organizacional (docs/tactical-design.md §4).
Instructions: Implemente o HierarchyService com cycle prevention e cascade path updates.
Steps: 1) Crie src/modules/space/services/hierarchy-service.ts. Constructor recebe ISpaceRepository (DI). 2) validateMove(orgId, newParentId): a) Se orgId === newParentId → throw HierarchyError('Cannot make organization its own parent'). b) Se newParentId é null → válido (root move). c) Busque newParent via repository.findById — se null → throw NotFoundError. d) Busque ancestors de newParentId — se orgId está nos ancestors → throw HierarchyError('Cycle detected'). 3) moveOrganization(orgId, newParentId): chama validateMove, computa newPath (parent.hierarchyPath + '.' + orgId ou apenas orgId se root), atualiza org, chama updateDescendantPaths recursivamente. 4) updateDescendantPaths(parentId, newParentPath): busca filhos diretos, para cada filho recalcula path e level, recursa. 5) getOrganizationTree(rootId): retorna OrganizationNode { id, name, level, children[] }. 6) Crie src/modules/space/errors/hierarchy-errors.ts com HierarchyError extends Error.
Expectation: Service completo, compilando, usando DI. Erros customizados. Sem dependência de infra direta (usa interface de repository).
Referência: .issues/ddd-011-missing-hierarchy-service.md (código de exemplo completo).
```

**Skill 2 de 2 — Tests**
```
/antigravity-awesome-skills:testing-patterns
Role: Test engineer criando testes unitários para domain service com Vitest.
Instructions: Crie testes completos para HierarchyService.
Steps: 1) Crie src/modules/space/services/hierarchy-service.test.ts. 2) Mock ISpaceRepository com vi.fn() para cada método. 3) Teste validateMove: a) Rejeita self-parent → expect HierarchyError. b) Rejeita ciclo (A→B→C, mover A under C) → expect HierarchyError. c) Rejeita parent inexistente → expect NotFoundError. d) Aceita move válido (sem ciclo) → no throw. e) Aceita move para root (newParentId=null). 4) Teste moveOrganization: a) Atualiza hierarchy_path da org movida. b) Cascade atualiza paths de 2+ níveis de descendants. c) Atualiza hierarchy_level corretamente. 5) Teste getOrganizationTree: retorna estrutura recursiva correta. Use vi.mock e siga o padrão de src/modules/product/actions/find-product-action.test.ts.
Expectation: 8+ test cases cobrindo happy path e edge cases. 100% dos branches de validateMove testados. Testes passam com pnpm test.
```
