# DDD-000: Master Refactoring Plan — Align Codebase with Tactical Design

**Status:** Active Roadmap
**DDD Compliance Score:** 35/100 (current) → 95/100 (target)
**Total Effort:** ~300 hours (~7-8 weeks, 1 developer)
**Last Updated:** 2026-03-21
**Linear Project:** [twincan supabase](https://linear.app/studio-risine/project/twincan-supabase-95a063c69453/overview)

## Linear Issue Index

| DDD Issue | Linear | Phase | Priority |
|-----------|--------|-------|----------|
| DDD-009: Missing organization_id | [PRD-22](https://linear.app/studio-risine/issue/PRD-22) | 1 - Foundation | Urgent |
| DDD-015: Missing User Entity | [PRD-23](https://linear.app/studio-risine/issue/PRD-23) | 1 - Foundation | High |
| DDD-016: Missing BaseRepository | [PRD-24](https://linear.app/studio-risine/issue/PRD-24) | 1 - Foundation | High |
| DDD-010: Missing Org Hierarchy | [PRD-25](https://linear.app/studio-risine/issue/PRD-25) | 1 - Foundation | High |
| DDD-011: Missing HierarchyService | [PRD-26](https://linear.app/studio-risine/issue/PRD-26) | 2 - Domain Model | Medium |
| DDD-012: Missing OnboardingService | [PRD-27](https://linear.app/studio-risine/issue/PRD-27) | 2 - Domain Model | Medium |
| DDD-013: Missing OrgFactory | [PRD-28](https://linear.app/studio-risine/issue/PRD-28) | 2 - Domain Model | Medium |
| DDD-014: Missing HierarchyPath VO | [PRD-29](https://linear.app/studio-risine/issue/PRD-29) | 3 - VOs & RBAC | Medium |
| DDD-017: Missing Role VO | [PRD-30](https://linear.app/studio-risine/issue/PRD-30) | 3 - VOs & RBAC | Low |
| DDD-007: Weak Member/Role | [PRD-31](https://linear.app/studio-risine/issue/PRD-31) | 3 - VOs & RBAC | High |
| DDD-001: Product Tenant Isolation | [PRD-32](https://linear.app/studio-risine/issue/PRD-32) | 4 - Arch Fixes | High |
| DDD-002: Invoice Aggregate Coupling | [PRD-33](https://linear.app/studio-risine/issue/PRD-33) | 4 - Arch Fixes | High |
| DDD-003: Missing Domain Services | [PRD-34](https://linear.app/studio-risine/issue/PRD-34) | 4 - Arch Fixes | Medium |
| DDD-004: Missing Domain Events | [PRD-35](https://linear.app/studio-risine/issue/PRD-35) | 4 - Arch Fixes | Medium |
| DDD-018: Terminology Alignment | [PRD-36](https://linear.app/studio-risine/issue/PRD-36) | 5 - Polish | Low |
| DDD-006: Ubiquitous Language | [PRD-37](https://linear.app/studio-risine/issue/PRD-37) | 5 - Polish | Low |
| DDD-005: Stub Implementations | [PRD-38](https://linear.app/studio-risine/issue/PRD-38) | 5 - Polish | Medium |
| DDD-008: Missing Specifications | [PRD-39](https://linear.app/studio-risine/issue/PRD-39) | 5 - Polish | Low |

---

## Resumo Executivo

O codebase possui uma base sólida (Result pattern, repository interfaces, module structure, Drizzle schemas) mas está **severamente desalinhado** com o tactical design documentado em `docs/tactical-design.md`. Dos 7 componentes planejados no tactical design, **0 estão implementados**. Este plano organiza 18 issues em 5 fases de execução ordenadas por dependência.

---

## Diagnóstico: Tactical Design vs. Realidade

### Mapa de Cobertura

| Componente Tático | Documento Referência | Issue | Status Atual |
|---|---|---|---|
| **Organization Aggregate** (organization_id em todas as tabelas) | tactical §1 | DDD-009 | ❌ Nenhuma tabela tem `organization_id` |
| **Organization Hierarchy** (parent_organization_id, hierarchy_path) | tactical §1, multi-tenancy §2 | DDD-010 | ❌ Estrutura flat, sem hierarquia |
| **User Entity** (is_platform_admin) | tactical §2 | DDD-015 | ❌ Não existe; usa auth.users direto |
| **Membership Entity** (Role-aware, RBAC) | tactical §2 | DDD-007 | ⚠️ Schema existe, sem RBAC/ações |
| **Role Value Object** (imutável, com permissões) | tactical §3 | DDD-017 | ❌ Enum plain text, sem comportamento |
| **HierarchyPath Value Object** (materialized path) | tactical §3 | DDD-014 | ❌ Não existe |
| **HierarchyService** (validateMove, cycle prevention) | tactical §4 | DDD-011 | ❌ Não existe |
| **OnboardingService** (user+org+billing creation) | tactical §4 | DDD-012 | ❌ Não existe |
| **BaseRepository** (organization_id injection, RLS) | tactical §5 | DDD-016 | ❌ Repos sem contexto de org |
| **OrganizationFactory** (hierarchy path computation) | tactical §6 | DDD-013 | ❌ Não existe |
| **Tenant Context** (session → infra layer) | tactical §7 | DDD-016 | ❌ Sem propagação de contexto |
| **Admin Bypass** (is_platform_admin → RLS bypass) | tactical §7, multi-tenancy §2 | DDD-015 | ❌ Não existe |
| **RLS Policies** (PostgreSQL row-level security) | multi-tenancy §1 | DDD-009 | ❌ Nenhuma policy criada |

### Módulos: Status de Implementação

| Módulo | Repo | Actions | Services | Value Objects | Events | UI | Score |
|---|---|---|---|---|---|---|---|
| **auth** | N/A | ✅ 6 | ❌ 0 | ❌ 0 | ❌ 0 | ✅ | 60% |
| **product** | ✅ | ✅ 2+tests | ❌ 0 | ❌ 0 | ❌ 0 | ✅ | 90% |
| **space** | ✅ | ✅ 4 | ❌ 0 | ❌ 0 | ❌ 0 | ❌ | 20% |
| **member** | ✅ | ✅ 3 | ❌ 0 | ❌ 0 | ❌ 0 | ❌ | 20% |
| **customer** | ✅ | ✅ 4 | ❌ 0 | ❌ 0 | ❌ 0 | ❌ | 30% |
| **subscription** | ✅ | ✅ 3 | ❌ 0 | ❌ 0 | ❌ 0 | ❌ | 30% |
| **invoice** | ✅ | ✅ 3 | ❌ 0 | ❌ 0 | ❌ 0 | ❌ | 30% |
| **project** | ✅ | ✅ 4 | ❌ 0 | ❌ 0 | ❌ 0 | ❌ | 10% |

---

## Grafo de Dependências

```
DDD-009 (organization_id) ─── CRITICAL FOUNDATION
  ├──→ DDD-010 (hierarchy columns)
  │      ├──→ DDD-011 (HierarchyService)
  │      ├──→ DDD-014 (HierarchyPath VO)
  │      └──→ DDD-013 (OrganizationFactory) ←── DDD-012
  ├──→ DDD-015 (User entity)
  │      └──→ DDD-012 (OnboardingService)
  ├──→ DDD-016 (BaseRepository)
  │      └──→ DDD-001 (Product tenant isolation)
  └──→ DDD-018 (Terminology alignment)

DDD-007 (Member RBAC) ─── INDEPENDENT
  └──→ DDD-017 (Role VO)

DDD-003 (Domain Services) ─── AFTER FOUNDATION
  └──→ DDD-004 (Domain Events)

DDD-002 (Invoice coupling) ─── STANDALONE FIX
DDD-005 (Stub implementations) ─── ONGOING (parallelizable)
DDD-006 (Language mismatch) ─── SUBSUMED BY DDD-018
DDD-008 (Specification objects) ─── LOW PRIORITY REFINEMENT
```

---

## Plano de Execução: 5 Fases

### FASE 1: Foundation — Multi-Tenancy Core
**Objetivo:** Estabelecer a base de isolamento de dados por organização.
**Duração estimada:** ~2 semanas
**Critério de aceite:** Todas as tabelas com organization_id, RLS policies ativas, User entity funcional.

| # | Issue | Severidade | Esforço | Entregável |
|---|---|---|---|---|
| 1 | **DDD-009** | CRITICAL | 34h | `organization_id` em todas as tabelas + RLS policies |
| 2 | **DDD-015** | HIGH | 18h | User entity, schema, repository, is_platform_admin |
| 3 | **DDD-016** | HIGH | 26h | BaseRepository com org context injection |
| 4 | **DDD-010** | HIGH | 16h | parent_organization_id, hierarchy_path, hierarchy_level |

**Subtotal Fase 1:** ~94 horas

**Ordem de execução:**
1. DDD-009 primeiro (tudo depende dele)
2. DDD-015 e DDD-010 em paralelo (ambos dependem apenas de DDD-009)
3. DDD-016 por último (usa organization_id + User entity)

**Verificação da Fase 1:**
- [ ] Todas as tabelas possuem coluna `organization_id`
- [ ] RLS policies funcionando (sem data leakage entre orgs)
- [ ] User entity criado junto com auth.users no signup
- [ ] BaseRepository injeta org_id em todas as escritas
- [ ] Colunas de hierarquia presentes na tabela spaces
- [ ] Testes de isolamento passam
- [ ] `pnpm build && pnpm test` passam

---

### FASE 2: Domain Model — Services & Factories
**Objetivo:** Implementar a camada de serviços de domínio e factories conforme tactical design.
**Duração estimada:** ~1.5 semanas
**Critério de aceite:** Serviços de domínio operacionais, factory validando criação.

| # | Issue | Severidade | Esforço | Entregável |
|---|---|---|---|---|
| 5 | **DDD-011** | MEDIUM | 15h | HierarchyService (validateMove, moveOrganization) |
| 6 | **DDD-012** | MEDIUM | 20h | OnboardingService (user+org+membership+billing) |
| 7 | **DDD-013** | MEDIUM | 11h | OrganizationFactory (root + sub-account creation) |

**Subtotal Fase 2:** ~46 horas

**Ordem de execução:**
1. DDD-011 primeiro (HierarchyService, depende de DDD-010)
2. DDD-013 em paralelo (OrganizationFactory, depende de DDD-010)
3. DDD-012 por último (OnboardingService, usa factory + hierarchy)

**Verificação da Fase 2:**
- [ ] Signup cria User + Organization + Membership + Billing
- [ ] HierarchyService previne ciclos na árvore
- [ ] Factory computa hierarchy_path corretamente
- [ ] Ações de criação de space usam factory
- [ ] Testes de ciclo de hierarquia passam
- [ ] `pnpm build && pnpm test` passam

---

### FASE 3: Value Objects & RBAC
**Objetivo:** Adicionar objetos de valor imutáveis e sistema de permissões.
**Duração estimada:** ~1.5 semanas
**Critério de aceite:** Role e HierarchyPath como value objects, Member com RBAC funcional.

| # | Issue | Severidade | Esforço | Entregável |
|---|---|---|---|---|
| 8 | **DDD-014** | MEDIUM | 11h | HierarchyPath Value Object |
| 9 | **DDD-017** | LOW | 11h | Role Value Object (permissões encapsuladas) |
| 10 | **DDD-007** | MEDIUM | 76h | Member RBAC completo (ações, serviço, convites, UI) |

**Subtotal Fase 3:** ~98 horas

**Ordem de execução:**
1. DDD-014 e DDD-017 em paralelo (value objects independentes)
2. DDD-007 por último (usa Role VO, precisa de BaseRepository)

**Verificação da Fase 3:**
- [ ] Role.canInvite(), Role.canModifyRole() funcionam
- [ ] HierarchyPath.isDescendantOf() funcional
- [ ] Convites de membro com expiração de 7 dias
- [ ] RBAC: OWNER pode convidar, MEMBER não
- [ ] Não é possível remover último OWNER
- [ ] PermissionChecker integrado nas rotas
- [ ] `pnpm build && pnpm test` passam

---

### FASE 4: Architecture Fixes & Domain Services
**Objetivo:** Corrigir violações arquiteturais e implementar serviços de domínio restantes.
**Duração estimada:** ~1 semana
**Critério de aceite:** Sem violações de aggregate boundary, domain services para workflows críticos.

| # | Issue | Severidade | Esforço | Entregável |
|---|---|---|---|---|
| 11 | **DDD-001** | HIGH | 8h | Product tenant isolation (organization_id) |
| 12 | **DDD-002** | HIGH | 12h | Invoice queries via Subscription (não via Customer) |
| 13 | **DDD-003** | MEDIUM | 30h | Domain services: Subscription, Invoice, Customer lifecycle |
| 14 | **DDD-004** | MEDIUM | 20h | Event bus + domain events (Subscription→Invoice) |

**Subtotal Fase 4:** ~70 horas

**Ordem de execução:**
1. DDD-001 e DDD-002 em paralelo (fixes isolados)
2. DDD-003 (domain services, usa BaseRepository da Fase 1)
3. DDD-004 (domain events, integra com services)

**Verificação da Fase 4:**
- [ ] Products filtrados por organization_id
- [ ] Invoice queries passam por Subscription (sem join direto com Customer)
- [ ] SubscriptionDomainService com activate/suspend/cancel
- [ ] EventBus publica SubscriptionCreatedEvent → Invoice gerada
- [ ] Nenhuma query cross-aggregate nos repositories
- [ ] `pnpm build && pnpm test` passam

---

### FASE 5: Polish & Completeness
**Objetivo:** Alinhar terminologia, completar stubs, adicionar specification objects.
**Duração estimada:** ~0.5-1 semana
**Critério de aceite:** Terminologia unificada, todos os módulos com implementações reais.

| # | Issue | Severidade | Esforço | Entregável |
|---|---|---|---|---|
| 15 | **DDD-018** | LOW | 9h | Rename Space→Organization (se estratégia A) |
| 16 | **DDD-006** | LOW | 4h | Documentação atualizada (subsumed by DDD-018) |
| 17 | **DDD-005** | MEDIUM | 30h | Completar stubs restantes (parcialmente feito nas fases anteriores) |
| 18 | **DDD-008** | LOW | 44h | Specification objects para queries complexas |

**Subtotal Fase 5:** ~87 horas (parcialmente já coberto pelas fases anteriores)

**Notas:**
- DDD-006 é essencialmente absorvido por DDD-018
- DDD-005 será ~60% resolvido pelas fases 1-4 (services, actions, RBAC)
- DDD-008 pode ser adiado para sprint futuro (quality refinement)
- DDD-018 pode usar Strategy C (glossário) se Strategy A for muito disruptiva

**Verificação da Fase 5:**
- [ ] Terminologia consistente entre docs e código
- [ ] Nenhum módulo com stubs/throw "Not implemented"
- [ ] Specification objects para Invoice overdue/upcoming queries
- [ ] `pnpm build && pnpm test` passam

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| DDD-009 causa breaking changes em todas as tabelas | Alta | Alto | Executar em migration única, testar com dados de seed |
| Rename Space→Organization (DDD-018) afeta 50+ arquivos | Média | Médio | Pode usar Strategy C (glossário) ao invés de rename |
| BaseRepository (DDD-016) muda assinatura de todos os repos | Alta | Alto | Migrar um módulo por vez, começando por Product (referência) |
| OnboardingService (DDD-012) e auth user creation fora de transação | Média | Alto | Implementar recovery mechanism, não rollback |
| Domain events (DDD-004) adicionam complexidade sem necessity imediata | Baixa | Baixo | Começar com in-process EventBus, persistência depois |

---

## Gaps Identificados (Não Cobertos pelos 18 Issues)

### Gap 1: Session-Level Organization Context
O tactical design (§7) diz: "Tenant Context: The active organization_id is captured at the application layer (Request/Session) and passed down to the infrastructure layer."

**Ação:** Absorvido em DDD-016 (BaseRepository). A implementação deve incluir:
- Middleware que extrai `organization_id` da sessão/cookie
- Propagação para server actions → repository factory
- UI selector para trocar de organização

### Gap 2: RLS Policy Creation Detalhada
DDD-009 menciona RLS brevemente, mas não detalha todas as policies necessárias.

**Ação:** Incluir criação de RLS policies como subtarefa de DDD-009:
- Policy SELECT por organization_id em todas as tabelas
- Policy INSERT/UPDATE/DELETE por organization_id
- Admin bypass policy (após DDD-015)

### Gap 3: Invitation Schema
DDD-007 menciona `member_invitations` table mas não há issue dedicada para o schema.

**Ação:** Absorvido em DDD-007 como subtarefa (criação do schema `member_invitations`).

---

## Métricas de Progresso

### Por Fase
- **Fase 1 completa:** DDD Score 35→55/100
- **Fase 2 completa:** DDD Score 55→70/100
- **Fase 3 completa:** DDD Score 70→80/100
- **Fase 4 completa:** DDD Score 80→90/100
- **Fase 5 completa:** DDD Score 90→95/100

### Checklist Global de Verificação
- [ ] **Tactical Design §1 (Aggregates):** Organization é aggregate root com isolation via RLS
- [ ] **Tactical Design §2 (Entities):** User entity com is_platform_admin; Membership com Role
- [ ] **Tactical Design §3 (Value Objects):** Role e HierarchyPath imutáveis com comportamento
- [ ] **Tactical Design §4 (Domain Services):** HierarchyService e OnboardingService operacionais
- [ ] **Tactical Design §5 (Repositories):** BaseRepository injeta organization_id
- [ ] **Tactical Design §6 (Factories):** OrganizationFactory encapsula criação complexa
- [ ] **Tactical Design §7 (Transparency):** Contexto de tenant propagado, admin bypass funcional
- [ ] **Strategic Design §2 (Ubiquitous Language):** Terminologia unificada docs↔código
- [ ] **Multi-tenancy §1 (Isolation):** RLS policies ativas em todas as tabelas de negócio
- [ ] **Multi-tenancy §2 (Hierarchy):** Sub-accounts com parent_organization_id + recursive RLS

---

## Índice de Issues

| Issue | Título | Fase | Severidade | Esforço | Depende de |
|---|---|---|---|---|---|
| DDD-001 | Product tenant isolation | 4 | HIGH | 8h | DDD-009 |
| DDD-002 | Invoice aggregate coupling | 4 | HIGH | 12h | — |
| DDD-003 | Missing domain services | 4 | MEDIUM | 30h | DDD-016 |
| DDD-004 | Missing domain events | 4 | MEDIUM | 20h | DDD-003 |
| DDD-005 | Stub implementations | 5 | MEDIUM | 30h | Todas as fases |
| DDD-006 | Ubiquitous language mismatch | 5 | LOW | 4h | DDD-018 |
| DDD-007 | Weak member/RBAC | 3 | MEDIUM | 76h | DDD-016, DDD-017 |
| DDD-008 | Missing specification objects | 5 | LOW | 44h | DDD-003 |
| DDD-009 | Missing organization_id | 1 | CRITICAL | 34h | — |
| DDD-010 | Missing org hierarchy | 1 | HIGH | 16h | DDD-009 |
| DDD-011 | Missing HierarchyService | 2 | MEDIUM | 15h | DDD-010 |
| DDD-012 | Missing OnboardingService | 2 | MEDIUM | 20h | DDD-009, DDD-015 |
| DDD-013 | Missing OrganizationFactory | 2 | MEDIUM | 11h | DDD-010, DDD-012 |
| DDD-014 | Missing HierarchyPath VO | 3 | MEDIUM | 11h | DDD-010 |
| DDD-015 | Missing User entity | 1 | HIGH | 18h | DDD-009 |
| DDD-016 | Missing BaseRepository | 1 | HIGH | 26h | DDD-009, DDD-015 |
| DDD-017 | Missing Role VO | 3 | LOW | 11h | DDD-007 |
| DDD-018 | Terminology alignment | 5 | LOW | 9h | DDD-009 |

---

## Execução com Skills — Prompts por Fase

### Convenções

- Cada bloco abaixo contém a **skill** a invocar e o **prompt** a usar.
- Skills podem ser combinadas na mesma sessão (executar uma após outra).
- Use `/antigravity-awesome-skills:{skill-name}` seguido do prompt.
- Quando uma issue requer múltiplas skills, execute na ordem listada.

---

### FASE 1: Foundation — Multi-Tenancy Core

#### DDD-009: Missing organization_id on All Business Tables

**Skills:** `database-architect` → `drizzle-orm-expert` → `database-migration`

```
/antigravity-awesome-skills:database-architect
Analise o schema atual em src/infra/db/schemas/ (product.ts, member.ts, subscription.ts, space.ts, project.ts, customer.ts, invoice.ts, price.ts). Todas as tabelas de negócio precisam de uma coluna organization_id (uuid, NOT NULL, FK para spaces.id) para RLS multi-tenant. Projete: 1) O schema migration adicionando organization_id em cada tabela. 2) Indexes necessários para performance. 3) RLS policies (SELECT/INSERT/UPDATE/DELETE) que filtram por organization_id usando current_setting('app.current_organization_id'). Siga o padrão existente de auditFields em src/infra/db/helpers/audit-fields.ts. Referência: docs/tactical-design.md §1 e docs/multi-tenancy.md §1.
```

```
/antigravity-awesome-skills:drizzle-orm-expert
Com base no schema migration planejado, atualize todos os arquivos de schema Drizzle em src/infra/db/schemas/ para adicionar a coluna organizationId (uuid, notNull, references spacesTable.id) em: productsTable, membersTable, subscriptionsTable, projectsTable, customersTable, invoicesTable. Mantenha o padrão existente de pgTable + auditFields. Atualize também os schemas Zod derivados (createInsertSchema, createSelectSchema, createUpdateSchema) em cada módulo. Referência: src/modules/product/ como módulo canônico.
```

```
/antigravity-awesome-skills:database-migration
Gere a migration Drizzle para adicionar organization_id em todas as tabelas de negócio. Use pnpm db:generate para gerar. A migration deve: 1) ADD COLUMN organization_id uuid NOT NULL com DEFAULT para dados existentes. 2) ADD FOREIGN KEY referenciando spaces(id). 3) CREATE INDEX em organization_id para cada tabela. 4) CREATE RLS POLICY organization_isolation em cada tabela usando organization_id = current_setting('app.current_organization_id')::uuid. Garanta zero-downtime (ADD COLUMN com DEFAULT, depois remove DEFAULT).
```

#### DDD-015: Missing User Entity and is_platform_admin

**Skills:** `ddd-tactical-patterns` → `nextjs-supabase-auth` → `drizzle-orm-expert`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Crie a User Entity conforme docs/tactical-design.md §2. A entidade User deve: 1) Ter schema Drizzle em src/infra/db/schemas/user.ts com campos: id (uuid PK, referencia auth.users.id), email (text unique), isPlatformAdmin (boolean default false), auditFields. 2) Ter módulo completo em src/modules/user/ seguindo o padrão de src/modules/product/ (schemas.ts, types.ts, repository/user-repository.ts + user-drizzle-repository.ts, actions/, index.ts). 3) Repository com: create, findById, findByEmail, update, makePlatformAdmin, revokePlatformAdmin. 4) Implementar como Entity (não Value Object) — tem identidade própria.
```

```
/antigravity-awesome-skills:nextjs-supabase-auth
Integre a nova User entity (src/modules/user/) com o fluxo de auth existente. Atualize src/modules/auth/actions/sign-up-action.ts para: 1) Após supabase.auth.signUp() bem-sucedido, criar User entity via userRepository().create({ id: data.user.id, email, isPlatformAdmin: false }). 2) Tratar falha de criação (cleanup do auth user se possível). 3) Manter compatibilidade com AuthContext existente em src/modules/auth/contexts/auth-context.tsx. 4) O mapSupabaseUserToAuthUser deve incluir isPlatformAdmin do User entity. Referência: docs/auth-context-implementation.md.
```

#### DDD-016: Missing BaseRepository Pattern

**Skills:** `ddd-tactical-patterns` → `typescript-expert`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Implemente o BaseRepository conforme docs/tactical-design.md §5. Crie src/infra/repositories/base-repository.ts como classe abstrata genérica BaseRepository<Entity, Insert, Update> que: 1) Recebe organizationId no construtor (obrigatório, validado). 2) Método protegido injectOrgId(input) que adiciona organizationId a qualquer insert. 3) Método protegido withOrgFilter(condition) que combina condição WHERE com eq(table.organizationId, this.organizationId). 4) Métodos abstratos: findById, create, update, delete. Depois, refatore o ProductDrizzleRepository (src/modules/product/repository/) para estender BaseRepository como prova de conceito. Mantenha a factory function productRepository(organizationId) → new ProductDrizzleRepository(organizationId, db).
```

```
/antigravity-awesome-skills:typescript-expert
Revise os tipos genéricos do BaseRepository em src/infra/repositories/base-repository.ts. Garanta: 1) Type inference correto para Entity, Insert, Update via generics. 2) O método injectOrgId retorna tipo correto (Insert & { organizationId: string }). 3) withOrgFilter é type-safe com SQL do drizzle-orm. 4) Factory functions tipadas: productRepository(orgId: string): ProductRepository. 5) Nenhum uso de 'any' — use tipos concretos ou genéricos bounded. Valide que pnpm build compila sem erros de tipo.
```

#### DDD-010: Missing Organization Hierarchy

**Skills:** `database-architect` → `drizzle-orm-expert`

```
/antigravity-awesome-skills:database-architect
Adicione suporte a hierarquia organizacional na tabela spaces (docs/tactical-design.md §1, §3). Projete: 1) Coluna parent_organization_id (uuid, nullable, self-referencing FK com ON DELETE RESTRICT). 2) Coluna hierarchy_path (text, NOT NULL, default ''): materialized path no formato "ROOT_ID.CHILD_ID.GRANDCHILD_ID". 3) Coluna hierarchy_level (integer, NOT NULL, default 1). 4) Indexes: idx_spaces_hierarchy_path (para LIKE queries), idx_spaces_parent_org_id. 5) Constraint: prevent self-reference (parent_organization_id != id). Referência: docs/multi-tenancy.md §2 sobre sub-accounts.
```

```
/antigravity-awesome-skills:drizzle-orm-expert
Atualize src/infra/db/schemas/space.ts para adicionar as colunas de hierarquia: parentOrganizationId, hierarchyPath, hierarchyLevel. Atualize src/modules/space/schemas.ts para omitir hierarchyPath e hierarchyLevel do createSchema (são computados). Atualize o SpaceDrizzleRepository em src/modules/space/repository/ para adicionar métodos: findByParentId(parentId), findAncestors(id) usando split no hierarchyPath, findDescendants(id) usando LIKE no hierarchyPath. Gere a migration com pnpm db:generate.
```

---

### FASE 2: Domain Model — Services & Factories

#### DDD-011: Missing HierarchyService

**Skills:** `ddd-tactical-patterns` → `testing-patterns`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Crie o HierarchyService conforme docs/tactical-design.md §4. Arquivo: src/modules/space/services/hierarchy-service.ts. O serviço deve: 1) validateMove(orgId, newParentId): previne ciclos (orgId não pode ser ancestor de newParentId), previne self-parent, valida que parent existe. 2) moveOrganization(orgId, newParentId): valida, computa novo hierarchy_path, atualiza org, cascade atualiza todos os descendants. 3) getOrganizationTree(rootId): retorna árvore como OrganizationNode recursivo. 4) Recebe ISpaceRepository via construtor (DI). 5) Erros customizados: HierarchyError extends Error. Siga o Result pattern de src/shared/errors/result.ts. Referência: .issues/ddd-011-missing-hierarchy-service.md.
```

```
/antigravity-awesome-skills:testing-patterns
Crie testes para HierarchyService em src/modules/space/services/hierarchy-service.test.ts. Teste: 1) validateMove rejeita self-parent (orgId === newParentId). 2) validateMove rejeita ciclo (mover parent para under seu próprio child). 3) validateMove aceita move válido. 4) moveOrganization atualiza hierarchy_path de todos os descendants. 5) getOrganizationTree retorna árvore correta. Use vi.mock para mockar o SpaceRepository. Siga o padrão de testes existente em src/modules/product/actions/find-product-action.test.ts.
```

#### DDD-012: Missing OnboardingService

**Skills:** `ddd-tactical-patterns` → `saga-orchestration`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Crie o OnboardingService conforme docs/tactical-design.md §4. Arquivo: src/modules/space/services/onboarding-service.ts. O serviço coordena: 1) onboardNewUser(userId, orgName, orgSlug): cria Organization (via OrganizationFactory), cria Membership como OWNER, inicializa billing plan (free trial 14 dias). 2) inviteUserToOrganization(orgId, email, role, inviterUserId): verifica que inviter é OWNER, cria invitation com token e expiry 7 dias. Recebe repositórios via construtor: ISpaceRepository, IMemberRepository, ISubscriptionRepository. Retorna Result<OnboardingResult>. Referência: .issues/ddd-012-missing-onboarding-service.md.
```

```
/antigravity-awesome-skills:saga-orchestration
O OnboardingService coordena múltiplas operações (auth user + domain user + organization + membership + billing). Projete a estratégia de compensação: 1) Se criação do Organization falhar após User criado: log para recovery, não delete auth user. 2) Se Membership falhar após Organization criada: delete Organization (rollback). 3) Se billing plan falhar: log warning, continue (non-critical). Implemente como saga simples com try/catch + cleanup, não como event-driven saga. O codebase usa Result<T> pattern (src/shared/errors/result.ts), retorne failure() em cada falha.
```

#### DDD-013: Missing OrganizationFactory

**Skills:** `ddd-tactical-patterns`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Crie o OrganizationFactory conforme docs/tactical-design.md §6. Arquivo: src/modules/space/factories/organization-factory.ts. Implemente: 1) createRootOrganization(name, slug, ownerId): retorna SpaceCreate com hierarchyPath='', hierarchyLevel=1, parentOrganizationId=null. 2) createSubAccount(parentId, name, slug, ownerId, parentOrganization): computa hierarchyPath a partir do parent, hierarchyLevel = parent.level + 1. 3) validateOrganization(input): valida name não vazio, slug formato [a-z0-9-], slug length 3-50, ownerId presente — retorna Result<void>. 4) createOrganizationWithValidation(input, spaceRepository): combina validação + check slug unique + factory creation. Use o Result pattern existente. Referência: .issues/ddd-013-missing-organization-factory.md.
```

---

### FASE 3: Value Objects & RBAC

#### DDD-014: Missing HierarchyPath Value Object

**Skills:** `ddd-tactical-patterns`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Crie o HierarchyPath Value Object conforme docs/tactical-design.md §3. Arquivo: src/modules/space/value-objects/hierarchy-path.ts. Requisitos: 1) Classe imutável (private readonly path, ids, level). 2) Factory methods: from(pathString), root(id), extend(parentPath, childId). 3) Métodos: getParentPath(), getAncestorPaths(), getLevel(), getIds(), getRootId(), getLeafId(). 4) Comparação: isDescendantOf(other), isAncestorOf(other). 5) Value equality: equals(other), toString(). 6) Validação: regex para formato UUID dot-separated. 7) Erro customizado: ValueError. Atualize src/modules/space/types.ts para usar HierarchyPath ao invés de string. Referência: .issues/ddd-014-missing-hierarchy-path-value-object.md.
```

#### DDD-017: Missing Role Value Object

**Skills:** `ddd-tactical-patterns`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Crie o Role Value Object conforme docs/tactical-design.md §3. Arquivo: src/modules/member/value-objects/role.ts. Requisitos: 1) Classe imutável com type (OWNER|ADMIN|MEMBER) e permissions (Set<Permission>). 2) Factory: fromType(type), from(value) com validação. 3) Permissões encapsuladas por role: OWNER (all), ADMIN (read+write+delete+invite+remove), MEMBER (read+write). 4) Métodos: hasPermission(p), canModifyRole(targetRole), canInvite(), canRemove(), canDelete(), isHigherOrEqual(other). 5) Value equality: equals(other), toString(). 6) Type Permission = 'read'|'write'|'delete'|'invite_members'|'remove_members'|'change_roles'|'delete_organization'|'transfer_ownership'. Referência: .issues/ddd-017-missing-role-value-object.md.
```

#### DDD-007: Weak Member/RBAC Implementation

**Skills:** `auth-implementation-patterns` → `ddd-tactical-patterns` → `testing-patterns`

```
/antigravity-awesome-skills:auth-implementation-patterns
Implemente o sistema RBAC completo para o módulo Member. Crie src/shared/permissions/permission-checker.ts com métodos: canInviteMember(actorMemberId, targetRole), canRemoveMember(actorMemberId, targetMemberId), canUpdateRole(actorMemberId, targetMemberId, newRole), canDeleteOrganization(actorMemberId). Regras: OWNER pode tudo; ADMIN pode invite/remove MEMBER; MEMBER não pode gerenciar. Invariante: não remover último OWNER. Use o Role Value Object de src/modules/member/value-objects/role.ts. Integre nas server actions existentes de member.
```

```
/antigravity-awesome-skills:ddd-tactical-patterns
Complete o módulo Member com: 1) Schema member_invitations (id, spaceId, email, role, token unique, expiresAt, acceptedAt, auditFields) em src/infra/db/schemas/member-invitation.ts. 2) Actions: invite-member-action.ts (cria invitation, verifica RBAC), accept-invitation-action.ts (cria Member, deleta invitation), reject-invitation-action.ts. 3) MemberRoleService em src/modules/member/services/ com: addMember, updateRole, removeMember, transferOwnership. 4) Domain events: MemberAddedEvent, MemberRoleChangedEvent, MemberRemovedEvent, MemberInvitedEvent. Siga o padrão de actions em docs/action-implementation-standard.md. Mensagens de erro em português.
```

```
/antigravity-awesome-skills:testing-patterns
Crie testes completos para o módulo Member: 1) permission-checker.test.ts: OWNER pode invite, ADMIN pode invite MEMBER, MEMBER não pode invite, não remove último OWNER. 2) invite-member-action.test.ts: success path, validation error, authorization error, expired invitation. 3) member-role-service.test.ts: addMember, updateRole cascade, transferOwnership. Use vi.mock para repositórios. Siga padrão de src/modules/product/actions/find-product-action.test.ts.
```

---

### FASE 4: Architecture Fixes & Domain Services

#### DDD-001: Product Tenant Isolation

**Skills:** `drizzle-orm-expert`

```
/antigravity-awesome-skills:drizzle-orm-expert
O módulo Product (src/modules/product/) é o único 90% completo mas não tem tenant isolation. Agora que BaseRepository existe (Fase 1): 1) Refatore ProductDrizzleRepository para estender BaseRepository<Product, ProductInsert, ProductUpdate>. 2) Atualize productRepository() factory para exigir organizationId. 3) Atualize create-product-action.ts e find-product-action.ts para obter organizationId do contexto de sessão. 4) Atualize os testes existentes em actions/*.test.ts para mockar com organizationId. 5) Este módulo serve como REFERÊNCIA para todos os outros módulos.
```

#### DDD-002: Invoice Aggregate Coupling

**Skills:** `ddd-context-mapping`

```
/antigravity-awesome-skills:ddd-context-mapping
O InvoiceRepository viola a boundary do Customer aggregate com findLatestByCustomerId() que faz JOIN direto invoice→subscription→customer. Refatore: 1) Remova findLatestByCustomerId do InvoiceRepository. 2) Mantenha apenas findBySubscriptionId (respeita aggregate boundary). 3) Crie src/modules/invoice/services/customer-invoice-service.ts que coordena: busca subscriptions via SubscriptionRepository, depois busca invoices via InvoiceRepository. 4) Atualize as actions para usar o service ao invés do repository direto. Mapeie a relação: Invoice ← Subscription ← Customer (Invoice só acessa via Subscription).
```

#### DDD-003: Missing Domain Services

**Skills:** `ddd-tactical-patterns` → `event-sourcing-architect`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Crie domain services para os módulos restantes: 1) SubscriptionDomainService (src/modules/subscription/services/): activateSubscription, suspendSubscription, cancelSubscription, renewSubscription. Regras: só ativa se trial running ou pagamento recebido, não cancela se já past_due. 2) InvoiceGenerationService (src/modules/invoice/services/): generateInvoiceForSubscription, processOverdueInvoices. Regras: invoice date = billing date, amount = plan price. 3) CustomerLifecycleService (src/modules/customer/services/): activateCustomer, deactivateCustomer. Todos recebem repositórios via construtor (DI) e retornam Result<T>.
```

#### DDD-004: Missing Domain Events

**Skills:** `event-sourcing-architect` → `architecture-patterns`

```
/antigravity-awesome-skills:event-sourcing-architect
Implemente um EventBus in-process simples para domain events. 1) Crie src/shared/events/event-bus.ts: interface DomainEvent (id, type, aggregateId, aggregateType, occurredAt, data), classe EventBus com subscribe(eventType, handler) e publish(event). 2) Crie eventos: SubscriptionCreatedEvent, SubscriptionCancelledEvent, InvoiceOverdueEvent, MemberAddedEvent, CustomerStatusChangedEvent. 3) Crie handlers: subscription.created → InvoiceGenerationService.generate, invoice.overdue → NotificationService (stub). 4) NÃO implemente event persistence ainda — apenas in-process pub/sub. Referência: .issues/ddd-004-missing-domain-events.md.
```

---

### FASE 5: Polish & Completeness

#### DDD-018 + DDD-006: Terminology Alignment

**Skills:** `ddd-strategic-design` → `code-refactoring-refactor-clean`

```
/antigravity-awesome-skills:ddd-strategic-design
Avalie a terminologia atual do codebase vs docs/strategic-design.md §2 (Ubiquitous Language). O código usa "Space" onde docs dizem "Organization", e "Member" onde docs dizem "Membership". Recomende: 1) Manter "Member" (GitHub/Slack usam "members", bom o suficiente). 2) Para Space→Organization: avaliar se rename completo vale o esforço (50+ arquivos) ou se um glossário docs/terminology.md com mapeamento é suficiente. 3) Se rename: listar TODOS os arquivos afetados com busca por "space", "Space", "spaceId", "spacesTable".
```

```
/antigravity-awesome-skills:code-refactoring-refactor-clean
SE decidido Strategy A (rename Space→Organization): Execute o rename em batch: 1) git mv src/modules/space/ src/modules/organization/. 2) git mv src/infra/db/schemas/space.ts src/infra/db/schemas/organization.ts. 3) Find & Replace: spacesTable→organizationsTable, Space→Organization, spaceId→organizationId, spaceRepository→organizationRepository. 4) Atualize todos os imports. 5) pnpm lint:fix && pnpm build && pnpm test. SE decidido Strategy C (glossário): Crie docs/terminology.md com tabela de mapeamento docs↔código.
```

#### DDD-005: Stub Implementations

**Skills:** `executing-plans`

```
/antigravity-awesome-skills:executing-plans
Execute o plano de completar os stubs restantes. Após as fases 1-4, os módulos restantes com stubs são: Project (10%), Customer (30% → parcialmente feito via services). Para cada módulo stub: 1) Verifique se repository, actions, schemas estão completos. 2) Implemente actions faltantes seguindo docs/action-implementation-standard.md. 3) Use Product como referência canônica. 4) Cada action: 'use server', validate com Zod, try/catch, retorna Result<T>. 5) Mensagens de erro em português. 6) Rode pnpm build && pnpm test após cada módulo.
```

#### DDD-008: Missing Specification Objects

**Skills:** `ddd-tactical-patterns` → `clean-code`

```
/antigravity-awesome-skills:ddd-tactical-patterns
Implemente o Specification pattern para queries complexas. 1) Crie src/shared/patterns/specification.ts: classe abstrata Specification<T> com conditions (SQL[]), addCondition(condition), toWhereClause(). 2) Crie InvoiceSpecification (src/modules/invoice/specifications/): isOpen(), isPaid(), isOverdueBy(days), isDueWithin(days), isPaidSince(days). 3) Crie SubscriptionSpecification: isActive(), isTrialEnding(days), isSuspended(). 4) Atualize repositories para aceitar findBySpecification(spec). 5) Refatore queries complexas existentes para usar specifications. Referência: .issues/ddd-008-missing-specification-objects.md.
```

---

### Skills Auxiliares (Usar quando necessário em qualquer fase)

| Situação | Skill | Prompt Resumo |
|---|---|---|
| Debugging de tipos TypeScript | `typescript-expert` | "Corrija os erros de tipo em [arquivo]. Use generics bounded, sem 'any'." |
| Problemas com Drizzle queries | `drizzle-orm-expert` | "A query em [arquivo] não compila. Corrija usando Drizzle API correta." |
| Validação Zod complexa | `zod-validation-expert` | "Crie schema Zod para [entidade] derivado do Drizzle com refinements." |
| Testes falhando | `testing-patterns` | "Corrija os testes em [arquivo]. Mock os repositórios corretamente." |
| Revisão arquitetural | `senior-architect` | "Revise a arquitetura do módulo [nome] para DDD compliance." |
| Supabase RLS issues | `supabase-automation` | "Configure RLS policies para a tabela [nome] usando organization_id." |
| Next.js Server Actions | `nextjs-app-router-patterns` | "A action [nome] precisa de org context. Use middleware pattern." |
| Limpeza de código | `clean-code` | "Revise [módulo] para code smells, duplicação e naming." |

## Recomendações Finais

1. **Comece pela Fase 1 imediatamente** — DDD-009 é o bloqueador crítico. Sem `organization_id`, multi-tenancy não funciona.

2. **Use Product como módulo referência** — É o único 90% completo. Ao implementar BaseRepository e org_id, comece refatorando Product como prova de conceito.

3. **DDD-018 (rename Space→Organization) pode esperar** — Use Strategy C (glossário) durante as fases 1-4. Faça o rename completo apenas na Fase 5, se decidido.

4. **DDD-008 (Specification Objects) é opcional** — Pode ser adiado para um sprint de qualidade futuro. O ROI é menor comparado com as outras issues.

5. **Paralelize issues independentes** — Na Fase 1, DDD-015 e DDD-010 podem ser feitos em paralelo. Na Fase 3, DDD-014 e DDD-017 são independentes.

6. **Rode `pnpm build && pnpm test` após cada issue** — Não acumule issues sem validação. Cada issue deve ser um commit atômico funcional.
