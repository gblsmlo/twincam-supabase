# DDD-018: Complete Terminology Alignment (Organization/Membership/User)

**Severity:** LOW
**Category:** Documentation | Ubiquitous Language | Alignment
**Status:** Open
**Linear:** [PRD-36](https://linear.app/studio-risine/issue/PRD-36/ddd-018-complete-terminology-alignment-organizationmembershipuser)
**Depends on:** DDD-009 through DDD-017
**Blocks:** Nothing critical; quality improvement

## Problem

Tactical design and code use different terminology for the same concepts, causing confusion:

| Business Concept | Tactical Design | Current Code | Status |
|------------------|-----------------|--------------|--------|
| Root organizational unit | Organization | Space | MISALIGNED |
| User organizational association | Membership | Member | SLIGHT MISMATCH |
| Physical user identity | User (with is_platform_admin) | Supabase auth.users | MISSING |
| Organizational hierarchy | Sub-account (parent_organization_id) | (not implemented yet) | MISSING |
| Permission structure | Role-based (implicit) | Role enum | PARTIAL |

## Business Impact

- 🟡 **Team Confusion**: Developers read "Organization" in docs, see "Space" in code
- 🟡 **Onboarding Slow**: New team members need translation guide
- 🟡 **Maintenance Cost**: Terminology mismatch makes refactoring harder
- 🟡 **Stakeholder Misalignment**: Product managers say "Organization", engineers say "Space"

## Recommendation

### Update Terminology Consistently

**Choose one of three strategies:**

#### Strategy A: Rename Code to Match Docs (RECOMMENDED)
Rename "Space" → "Organization" throughout codebase.

**Changes:**
```typescript
// BEFORE: Space
spacesTable → organizationsTable
Space → Organization
space module → organization module
spaceId → organizationId (partially done with DDD-009)
SpaceService → OrganizationService

// AFTER: Organization
organizationsTable ✓ (already uses spaces name, just conceptually)
Organization ✓ (clearer intent)
organization module ✓ (matches docs)
organizationId ✓ (matches tactical design)
OrganizationService ✓ (matches naming)
```

**Pros:**
- Matches tactical design exactly
- Clearer business intent
- Aligns all terminology

**Cons:**
- Large refactoring (50+ files)
- Breaking changes
- Database migration needed

#### Strategy B: Update Documentation to Match Code
Update tactical design docs to say "Space" instead of "Organization".

**Pros:**
- No code changes
- Fast (documentation only)
- No breaking changes

**Cons:**
- Terminology still unclear to newcomers
- Misses business context (Tactical design was intentional)

#### Strategy C: Glossary with Mapping (HYBRID)
Keep code as-is, add clear glossary mapping in docs.

**Pros:**
- Zero code changes
- Clear mapping for team
- Fast implementation

**Cons:**
- Code still confusing without glossary
- Terminology mismatch persists

### Recommended: Strategy A (Rename to Organization)

Given we're implementing DDD-009 through DDD-017, this is the right time for naming cleanup.

### Implementation Plan

**Phase 1: Database Schema**
```sql
-- Rename table (with backup)
ALTER TABLE spaces RENAME TO organizations;
ALTER INDEX idx_spaces_slug RENAME TO idx_organizations_slug;
```

**Phase 2: Drizzle Schema Update**
```typescript
// src/infra/db/schemas/organization.ts (RENAME from space.ts)
export const organizationsTable = pgTable('organizations', { ... }); // was spacesTable
```

**Phase 3: Module Rename**
```
src/modules/space/ → src/modules/organization/
  actions/ (same)
  repository/ (same)
  services/ (same)
  value-objects/ (same)
  schemas.ts (same)
  types.ts (same)
  index.ts (same)
```

**Phase 4: Type/Variable Rename**
```typescript
// All exports
Space → Organization
ISpaceRepository → IOrganizationRepository
spaceRepository() → organizationRepository()
spaceCreateSchema → organizationCreateSchema
// etc.
```

**Phase 5: Update Documentation**
```markdown
# docs/tactical-design.md (UPDATE)
- "Organization" is the root aggregate (was calling it Organization, now code matches)
- Implement parent_organization_id for hierarchy
- Membership links User to Organization
- Terminology now unified: docs and code both use "Organization"

# docs/terminology.md (NEW)
This document removes the need for mapping table because terminology is now unified.
```

### Files Affected (Renaming)

**Schema:**
- `/src/infra/db/schemas/space.ts` → `/src/infra/db/schemas/organization.ts`

**Module:**
- `/src/modules/space/` → `/src/modules/organization/`
  - All 8 files in directory
  - All imports referencing space module

**Tests & Mocks:**
- All test files referencing Space/space
- All mock files (mockOrganizations instead of mockSpaces)

**Everywhere else:**
- `/src/app/` route groups
- `/src/components/` (forms, dialogs, tables)
- `/src/shared/` (utils, types, errors)
- Action/type imports across all modules

### Alternative Files to Update (If Keeping Space)

If choosing Strategy B or C, update these docs only:

- `/docs/tactical-design.md` - Add clarification: "Organization = Space in code"
- `/docs/terminology.md` (NEW) - Add mapping table
- `/docs/ubiquitous-language.md` (NEW) - Glossary with definitions

### Quick Win: Membership → Member Alignment

Minor terminology fix:
```typescript
// Tactical design says "Membership"
// Code says "Member"
// Both are acceptable; choose one for clarity

Option 1: Stay with "Member" (current)
- Simpler (fewer changes)
- Common naming (GitHub, Slack use "members")

Option 2: Change to "Membership"
- Matches tactical design exactly
- More formal / enterprise terminology

Recommendation: Keep "Member" (already partially done, good enough)
```

## Git Workflow for Rename

```bash
# Step 1: Ensure tests pass before rename
pnpm test

# Step 2: Database migration
pnpm db:generate  # Generate rename migration

# Step 3: Rename files
git mv src/modules/space/ src/modules/organization/
git mv src/infra/db/schemas/space.ts src/infra/db/schemas/organization.ts

# Step 4: Update all imports using batch replacement
# Use IDE refactoring: Find & Replace All
#   Space → Organization
#   spaceId → organizationId
#   space module → organization module

# Step 5: Test
pnpm lint:fix  # Fix formatting
pnpm test      # Run all tests
pnpm build     # Build project

# Step 6: Commit
git commit -m "refactor: Rename Space to Organization (align with tactical design)"
```

## Verification

After implementation (whichever strategy):
1. ✅ Terminology consistent between docs and code
2. ✅ No "space" vs "Space" confusion
3. ✅ New developers can understand from code alone
4. ✅ Glossary/mapping clear if using hybrid approach
5. ✅ All tests passing after rename
6. ✅ No broken imports

## Effort Estimate (by Strategy)

**Strategy A (Code Rename):**
- File renames: 2 hours (IDE refactoring)
- Import updates: 4 hours (find & replace)
- Tests & verification: 3 hours
- **Total: ~9 hours**

**Strategy B (Doc Update):**
- Update tactical-design.md: 1 hour
- Add clarification notes: 1 hour
- **Total: ~2 hours**

**Strategy C (Glossary):**
- Create terminology.md: 2 hours
- Add mapping table: 1 hour
- **Total: ~3 hours**

## Related Issues

- DDD-006: Ubiquitous language mismatch (covers partial alignment)
- DDD-009 through DDD-017: All use "Organization" terminology

## Timeline

- **Priority**: LOW (aesthetic quality, not functional)
- **When**: After Phase 1-3 issues implemented OR in separate cleanup sprint
- **Ideally**: With database schema changes (DDD-009, DDD-010)

## Recommendation

**If implementing DDD-009-017:** Do Strategy A simultaneously (rename while refactoring schemas)
**If just documenting:** Do Strategy C (lightweight, minimal changes)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Strategic Design consultant & code refactoring specialist. Você alinha ubiquitous language entre documentação e codebase para eliminar ambiguidade.
- **Instructions:** Avalie o custo/benefício de renomear Space→Organization no codebase. Se Strategy A: execute rename em batch. Se Strategy C: crie glossário docs/terminology.md.
- **Steps:** 1) Avaliar impacto (quantos arquivos afetados). 2) Decidir estratégia (A rename ou C glossário). 3) Executar a estratégia escolhida. 4) Atualizar docs. 5) Validar build.
- **Expectation:** Terminologia unificada entre docs e código (via rename ou glossário). Zero ambiguidade para novos devs.

### Execução

**Skill 1 de 2 — Avaliação**
```
/antigravity-awesome-skills:ddd-strategic-design
Role: DDD strategic design consultant avaliando ubiquitous language alignment.
Instructions: Avalie o impacto de renomear Space→Organization e recomende a estratégia.
Steps: 1) Busque todas as ocorrências de "space", "Space", "spaceId", "spacesTable", "SpaceRepository" no codebase. Conte arquivos afetados. 2) Avalie: docs/strategic-design.md §2 usa "Organization" e "Membership". O código usa "Space" e "Member". 3) Para "Member" vs "Membership": recomende manter "Member" (GitHub/Slack usam, é idiomático). 4) Para "Space" vs "Organization": se <30 arquivos → Strategy A (rename). Se >50 arquivos → Strategy C (glossário). 5) Documente a decisão com justificativa. 6) Se Strategy C: descreva o conteúdo exato de docs/terminology.md (tabela docs↔código).
Expectation: Decisão documentada com contagem de arquivos. Recomendação clara (A ou C). Se C: conteúdo do glossário pronto.
Referência: docs/strategic-design.md §2. .issues/ddd-018-complete-terminology-alignment.md.
```

**Skill 2 de 2 — Execução (se Strategy A)**
```
/antigravity-awesome-skills:code-refactoring-refactor-clean
Role: Refactoring specialist executando rename em batch sem quebrar o codebase.
Instructions: Execute o rename Space→Organization SE decidido na Skill 1.
Steps: 1) git mv src/modules/space/ src/modules/organization/. 2) git mv src/infra/db/schemas/space.ts src/infra/db/schemas/organization.ts. 3) Find & Replace All (case-sensitive): spacesTable→organizationsTable, Space→Organization (em types/interfaces), spaceId→organizationId (em propriedades), spaceRepository→organizationRepository, space-drizzle-repository→organization-drizzle-repository. 4) NÃO renomear: database table name 'spaces' (requer migration separada, pode manter). 5) Atualize todos os imports quebrados. 6) pnpm lint:fix para corrigir formatting. 7) pnpm build para validar compilação. 8) pnpm test para validar testes. 9) Se Strategy C: crie docs/terminology.md com tabela de mapeamento e crie PR separado.
Expectation: Zero erros de compilação. Zero testes quebrados. Todos os imports corretos. Biome lint passando.
```
