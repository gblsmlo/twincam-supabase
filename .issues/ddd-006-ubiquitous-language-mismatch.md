# DDD-006: Ubiquitous Language Mismatch Between Documentation and Code

**Severity:** LOW
**Category:** Documentation | Communication
**Status:** Open
**Linear:** [PRD-37](https://linear.app/studio-risine/issue/PRD-37/ddd-006-ubiquitous-language-mismatch-between-documentation-and-code)

## Problem

Architectural documentation and implementation use different terminology for the same concepts, causing confusion and potential miscommunication between developers and stakeholders.

## Documentation vs Code Terminology

| Business Concept | Documentation | Code | Impact |
|------------------|---------------|------|--------|
| Root Organization Unit | **Organization** | **Space** | Developers refer to "Space" in code, docs say "Organization" |
| Organizational Hierarchy | **Sub-account** (parent-child) | **No hierarchy** | Docs promise feature that doesn't exist |
| User Assignment | **Team Member** | **Member** | Minor naming difference |
| Platform Admin | **Platform Admin** | **No role type** | Docs reference unimplemented feature |
| Access Control | **RBAC** (implicit) | **Role enum** (limited) | Docs assume full RBAC, code has basic roles |

## Where Terminology Conflicts Exist

### 1. Strategic Design Document
```markdown
# docs/strategic-design.md
- Uses term: "Organization"
- Mentions: "Sub-account for organizational hierarchy"
- Defines: "Platform Admin" role

# Code Reality
- Uses term: "Space"
- No hierarchy (no parent_space_id)
- No platform_admin role in schema
```

### 2. Tactical Design Document
```markdown
# docs/tactical-design.md
- References "Organization aggregate"
- Defines "RBAC (Role-Based Access Control)"

# Code Reality
- Called "Space" aggregate
- Has basic role enum, no RBAC service
```

### 3. Multi-Tenancy Document
```markdown
# docs/multi-tenancy.md
- Assumes: "Organization hierarchies supported"
- States: "Sub-accounts isolated per organization"

# Code Reality
- Flat structure: Space → Member → User
- No hierarchical nesting
```

## Risks

- 🟡 **Onboarding Confusion**: New developers read docs, then find different names in code
- 🟡 **Stakeholder Misalignment**: Product managers refer to "Organization", engineers say "Space"
- 🟡 **Feature Promises**: Docs promise "Platform Admin" and "Sub-accounts", code doesn't implement
- 🟡 **Migration Planning**: Unclear if "Organization" → "Space" rename is pending or complete

## Root Cause

Design documentation was created before implementation started. As implementation progressed, decisions diverged from initial design without updating documentation.

## Recommendation

### Option A: Update Documentation (Recommended)

Correct docs to match current implementation:

```markdown
# docs/strategic-design.md (UPDATED)

## Bounded Contexts

### Organizational Management
The system models organizational units as "Spaces" — isolated workspaces for multi-tenant data.

**Current Model:**
- Space: Root unit of data isolation
- Member: User assigned to space with role
- Role: OWNER | ADMIN | MEMBER (flat, no hierarchy)

**Future Enhancements:**
- [ ] Sub-account hierarchy (parent Space can own child Spaces)
- [ ] Platform Admin role (for cross-space administration)
- [ ] Advanced RBAC (permission matrices, custom roles)

### Note on Naming
Legacy documentation references "Organization". The current implementation uses "Space".
These terms are equivalent. Over time, "Organization" will be phased out.
```

### Option B: Rename Code to Match Docs (Not Recommended)

If renaming code is preferred:
- Rename `space` module → `organization` module
- Rename `Space` entity → `Organization` entity
- Update all 50+ files referencing `space`
- Large refactoring, low ROI

### Option C: Hybrid Approach

Keep code as-is, document mapping:

```markdown
# docs/terminology.md (NEW FILE)

## Terminology Mapping

| Documentation | Code | Notes |
|---------------|------|-------|
| Organization | Space | Primary unit of multi-tenancy |
| Sub-account | (Not yet implemented) | Planned for v2.0 |
| Team Member | Member | User with role in Organization |
| RBAC | Basic roles | Currently 3 roles: OWNER, ADMIN, MEMBER |
| Platform Admin | (Not implemented) | Cross-organization admin role, planned |

Use **"Organization"** when discussing business concepts.
Use **"Space"** when discussing code implementation.
```

## Files to Update

If choosing Option A (recommended):
- `/docs/strategic-design.md` - Update terminology section
- `/docs/tactical-design.md` - Update entity references
- `/docs/multi-tenancy.md` - Document current flat structure, note hierarchy is future work
- `/docs/terminology.md` (NEW) - Add glossary/mapping table

If choosing Option C:
- `/docs/terminology.md` (NEW) - Add mapping table only

## Verification

After update:
1. ✅ All docs use consistent terminology
2. ✅ Mapping table shows code ↔ business term relationship
3. ✅ Future features clearly marked "Planned"
4. ✅ New developers understand Organization = Space

## Related Issues

- ddd-007: Weak member implementation (relates to missing features mentioned in docs)
- ddd-005: Stub implementations (other unimplemented features documented)

## Timeline

- **Priority**: Low (doesn't block features)
- **Effort**: 2-4 hours (documentation updates)
- **When**: Can be done any time, recommend before onboarding new developers

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um technical writer alinhando documentação arquitetural com a realidade do codebase.
- **Instructions:** Atualize os docs para refletir a terminologia atual do código, ou aplique o glossário criado em DDD-018.
- **Steps:** 1) Aplicar resultado de DDD-018 (rename ou glossário). 2) Atualizar strategic-design.md, tactical-design.md, multi-tenancy.md. 3) Marcar features não implementadas como "Planned".
- **Expectation:** Docs consistentes com código. Features futuras claramente marcadas. Zero confusão para novos devs.

### Execução

> **Nota:** Esta issue é absorvida por DDD-018. Execute DDD-018 primeiro.

**Skill 1 de 1 — Docs Update**
```
/antigravity-awesome-skills:ddd-strategic-design
Role: DDD strategic design consultant atualizando documentação para alinhar com codebase refatorado.
Instructions: Atualize os docs arquiteturais para refletir a terminologia e estado pós-refatoração.
Steps: 1) Em docs/strategic-design.md: atualize §2 (Ubiquitous Language) para refletir a terminologia escolhida (Organization ou Space, conforme decisão DDD-018). Marque "Sub-account" e "Platform Admin" como implementados (se DDD-010 e DDD-015 concluídos) ou "Planned". 2) Em docs/tactical-design.md: confirme que §1-§7 refletem a implementação real (BaseRepository, HierarchyService, etc). 3) Em docs/multi-tenancy.md: atualize §1 para confirmar RLS policies ativas. Atualize §2 para confirmar hierarquia implementada. 4) Se DDD-018 escolheu Strategy C: adicione referência a docs/terminology.md em cada doc.
Expectation: Docs 100% alinhados com código. Nenhuma feature listada como existente que não esteja implementada. Glossário referenciado se Strategy C.
```
