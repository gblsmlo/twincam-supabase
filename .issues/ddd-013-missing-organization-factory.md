# DDD-013: Missing OrganizationFactory

**Severity:** MEDIUM
**Category:** Factory Pattern | Domain Design | Tactical Design
**Status:** Open
**Linear:** [PRD-28](https://linear.app/studio-risine/issue/PRD-28/ddd-013-missing-organizationfactory)
**Depends on:** DDD-009, DDD-010, DDD-012
**Blocks:** Complex organization creation logic encapsulation

## Problem

Tactical design specifies OrganizationFactory for encapsulating complex organization creation logic, but **no factory exists**. Currently, creation logic is scattered or embedded in services.

**Tactical Design Requirement:**
```
OrganizationFactory:
- Encapsulates complex creation of an organization
- Ensures hierarchy_path is correctly computed based on parent
- Initializes all required defaults
- Returns fully valid organization ready to use
```

**Current State:** No factory; repository creates directly or logic scattered in actions.

## Recommendation

### Create OrganizationFactory

```typescript
// NEW: src/modules/space/factories/organization-factory.ts

export class OrganizationFactory {
  /**
   * Creates a root organization (no parent).
   */
  static createRootOrganization(
    name: string,
    slug: string,
    ownerId: string
  ): SpaceCreate {
    return {
      organizationId: crypto.randomUUID(),
      name,
      slug,
      ownerId,
      parentOrganizationId: null,
      hierarchyPath: '', // Will be set to ID after creation
      hierarchyLevel: 1,
    };
  }

  /**
   * Creates a sub-account (child of existing organization).
   */
  static async createSubAccount(
    parentId: string,
    name: string,
    slug: string,
    ownerId: string,
    parentOrganization: Space,
  ): Promise<SpaceCreate> {
    // Compute hierarchy path from parent
    const hierarchyPath = parentOrganization.hierarchyPath
      ? `${parentOrganization.hierarchyPath}.${parentId}`
      : parentId;

    const hierarchyLevel = parentOrganization.hierarchyLevel + 1;

    return {
      organizationId: parentOrganization.organizationId, // Inherit parent's org ID
      name,
      slug,
      ownerId,
      parentOrganizationId: parentId,
      hierarchyPath,
      hierarchyLevel,
    };
  }

  /**
   * Validates organization creation inputs.
   */
  static validateOrganization(input: {
    name: string;
    slug: string;
    ownerId: string;
  }): Result<void> {
    if (!input.name || input.name.trim().length === 0) {
      return failure(VALIDATION_ERROR, 'Organization name cannot be empty');
    }

    if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) {
      return failure(
        VALIDATION_ERROR,
        'Slug must contain only lowercase letters, numbers, and hyphens'
      );
    }

    if (input.slug.length < 3 || input.slug.length > 50) {
      return failure(VALIDATION_ERROR, 'Slug must be 3-50 characters');
    }

    if (!input.ownerId) {
      return failure(VALIDATION_ERROR, 'Owner ID is required');
    }

    return success(void 0);
  }

  /**
   * Creates organization with all validations and defaults.
   */
  static async createOrganizationWithValidation(
    input: {
      name: string;
      slug: string;
      ownerId: string;
      parentId?: string;
    },
    spaceRepository: ISpaceRepository
  ): Promise<Result<SpaceCreate>> {
    // Validate
    const validationResult = this.validateOrganization(input);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Check slug uniqueness
    const existing = await spaceRepository.findBySlug(input.slug);
    if (existing) {
      return failure(VALIDATION_ERROR, 'Organization slug already exists');
    }

    // If parent specified, validate it exists and get its data
    if (input.parentId) {
      const parent = await spaceRepository.findById(input.parentId);
      if (!parent) {
        return failure(NOT_FOUND_ERROR, 'Parent organization not found');
      }

      const createInput = await this.createSubAccount(
        input.parentId,
        input.name,
        input.slug,
        input.ownerId,
        parent
      );

      return success(createInput);
    }

    // Create root organization
    const createInput = this.createRootOrganization(
      input.name,
      input.slug,
      input.ownerId
    );

    return success(createInput);
  }
}

export type SpaceCreate = Parameters<ISpaceRepository['create']>[0];
```

### Use Factory in Actions

```typescript
// src/modules/space/actions/create-space-action.ts (UPDATE)

'use server';

export async function createSpaceAction(
  input: { name: string; slug: string; parentId?: string }
): Promise<Result<Space>> {
  try {
    // Factory validates and prepares input
    const createResult = await OrganizationFactory.createOrganizationWithValidation(
      {
        ...input,
        ownerId: currentUserId,
      },
      spaceRepository()
    );

    if (isFailure(createResult)) {
      return createResult;
    }

    // Repository creates the validated input
    const space = await spaceRepository().create(createResult.data);

    return success(space);
  } catch (error) {
    return failure(UNKNOWN_ERROR, 'Failed to create organization');
  }
}
```

### Use in OnboardingService

```typescript
// src/modules/space/services/onboarding-service.ts (UPDATE)

async onboardNewUser(
  userId: string,
  organizationName: string,
  organizationSlug: string,
): Promise<Result<OnboardingResult>> {
  // Use factory to create and validate organization
  const createInput = await OrganizationFactory.createOrganizationWithValidation(
    {
      name: organizationName,
      slug: organizationSlug,
      ownerId: userId,
    },
    this.spaceRepository,
  );

  if (isFailure(createInput)) {
    return createInput;
  }

  const organization = await this.spaceRepository.create(createInput.data);
  // ... rest of onboarding
}
```

## Benefits of Factory Pattern

✅ **Encapsulation**: Complex logic in one place
✅ **Validation**: Centralized input validation
✅ **Consistency**: All organizations created the same way
✅ **Testability**: Test factory logic independently
✅ **Reusability**: Both OnboardingService and actions use same logic
✅ **Maintenance**: Change creation logic in one place

## Files to Create

- `/src/modules/space/factories/organization-factory.ts` - Main factory

## Files to Update

- `/src/modules/space/actions/create-space-action.ts` - Use factory
- `/src/modules/space/services/onboarding-service.ts` - Use factory

## Verification

After implementation:
1. ✅ Root organizations created with hierarchy_level = 1
2. ✅ Sub-accounts created with correct parent and hierarchy path
3. ✅ All organizations have slug uniqueness enforced
4. ✅ Validation happens before creation
5. ✅ Factory can be unit tested independently
6. ✅ No creation logic in actions or services

## Effort Estimate

- Factory implementation: 4 hours
- Integration into actions/services: 3 hours
- Tests: 4 hours
- **Total: ~11 hours**

## Related Issues

- DDD-010: Missing organization hierarchy (factory uses it)
- DDD-012: Missing OnboardingService (uses factory)
- DDD-001: Product tenant isolation (factory pattern can be applied)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Factory pattern specialist. Você encapsula lógica complexa de criação de aggregates em factories que garantem consistência e validação.
- **Instructions:** Crie o OrganizationFactory que encapsula a criação de organizações root e sub-accounts, computando hierarchy metadata automaticamente.
- **Steps:** 1) Criar `src/modules/space/factories/organization-factory.ts`. 2) Implementar createRootOrganization. 3) Implementar createSubAccount (computa path/level). 4) Implementar validateOrganization. 5) Implementar createOrganizationWithValidation (combo). 6) Integrar com OnboardingService e create-space-action.
- **Expectation:** Factory encapsula 100% da lógica de criação. Nenhuma action ou service computa hierarchy diretamente. Validação centralizada. Retorna Result<T>.

### Execução

**Skill 1 de 1**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner implementando Factory pattern para criação de Organization aggregate (docs/tactical-design.md §6).
Instructions: Crie o OrganizationFactory com validação e hierarchy path computation.
Steps: 1) Crie src/modules/space/factories/organization-factory.ts como classe com métodos static. 2) createRootOrganization(name, slug, ownerId): retorna SpaceCreate com organizationId=crypto.randomUUID(), parentOrganizationId=null, hierarchyPath='' (será setado para id após insert), hierarchyLevel=1. 3) createSubAccount(parentId, name, slug, ownerId, parentOrganization: Space): computa hierarchyPath = parent.hierarchyPath ? `${parent.hierarchyPath}.${newId}` : newId, hierarchyLevel = parent.hierarchyLevel + 1. Retorna SpaceCreate. 4) validateOrganization(input: { name, slug, ownerId }): valida name não-vazio, slug regex /^[a-z0-9-]+$/, slug length 3-50, ownerId presente. Retorna Result<void> usando success()/failure() de src/shared/errors/result.ts. 5) createOrganizationWithValidation(input, spaceRepository): combina validate + check slug unique (findBySlug) + factory create. Retorna Result<SpaceCreate>. 6) Integre: OnboardingService.onboardNewUser deve usar este factory. create-space-action deve usar este factory.
Expectation: Factory completo com 4 métodos. Validação centralizada. Hierarchy path computado corretamente para root e sub-accounts. Usado por OnboardingService e actions. pnpm build compila.
Referência: .issues/ddd-013-missing-organization-factory.md (código de exemplo).
```
