# Feature-Based Architecture (FBA)

**Role:** Senior Frontend Architect & DevOps Engineer  
**Objective:** Establish a scalable directory structure using kebab-case, barrel files, and anti-cycle rules.

## 1. Constraints
- **Naming:** Strict `kebab-case` for ALL files and directories.
- **Aliases:** Every folder under `src/` must have a `@` alias (e.g., `@features`, `@components`).
- **Barrels:** Every directory uses `index.ts` to export its public API.
- **Hygiene:** Biome enforces import rules and prevents cycles.

## 2. Directory Structure
```bash
# Features (Domain-centric)
mkdir -p src/features/auth/{api,components,hooks,stores,types,utils}
mkdir -p src/features/user-profile/{api,components,hooks,types,utils}

# Shared Resources
mkdir -p src/components/{ui,layout}
mkdir -p src/hooks
mkdir -p src/libs
mkdir -p src/types
mkdir -p src/assets
mkdir -p src/routes

## 3. Governance Rules
Rule 1: Internal Imports
Inside a feature, ALWAYS use relative paths. NEVER import from the features own alias or barrel.

✅ import { useAuth } from '../hooks/use-auth'
❌ import { useAuth } from '@features/auth'

Rule 2: External Imports
When importing from other features, ALWAYS use the barrel alias.

✅ import { Button } from '@components/ui';
❌ import { Button } from '@components/ui/button';

Rule 3: Barrel Hygiene
index.ts files must ONLY contain exports. No logic, no side effects.

## 4. Tooling Configuration
Path Aliases (tsconfig.json)
JSON
{
  "compilerOptions": {
    "paths": {
      "@features/*": ["./src/features/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"]
    }
  }
}
Import Governance (biome.json)
JSON
{
  "linter": {
    "rules": {
      "nursery": {
        "noImportCycles": "error"
      }
    }
  }
}
## 5. Verification Checklist
[ ] All directories use kebab-case.
[ ] Every folder has an index.ts barrel.
[ ] No circular dependencies (checked via pnpm lint).
[ ] Internal imports are relative; external are aliased.
