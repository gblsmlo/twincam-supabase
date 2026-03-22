# DDD-015: Missing User Entity and is_platform_admin Flag

**Severity:** HIGH
**Category:** Domain Model | Tactical Design | Authorization
**Status:** Implemented — Schema corrigido para app_metadata
**Linear:** [PRD-23](https://linear.app/studio-risine/issue/PRD-23/ddd-015-missing-user-entity-and-is-platform-admin-flag)
**Blocks:** DDD-012, DDD-016, Platform admin feature
**Depends on:** DDD-009

## Problem

Tactical design requer uma **User entity** com `is_platform_admin` para super-admin capabilities, mas a implementação atual cria uma tabela `public.users` que **duplica dados de `auth.users`** (email), criando risco de dessincronização.

**Estado atual (incorreto):**
```typescript
// public.users duplica email de auth.users — risco de sync
export const usersTable = pgTable('users', {
  _id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text().notNull().unique(), // ❌ Duplicado de auth.users.email
  isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
  ...auditFields,
})
```

**Problemas identificados:**
1. `email` duplicado de `auth.users` — se o user mudar email pelo Supabase Auth, `public.users.email` fica desatualizado
2. Tabela separada para dados que podem residir nativamente no Supabase via `app_metadata`
3. Necessidade de `getUserProfileAction()` fazer query extra ao DB para obter `isPlatformAdmin`

## Correção: Usar `app_metadata` do Supabase (Abordagem Recomendada)

O Supabase armazena dados controlados pelo servidor em `auth.users.raw_app_meta_data`. Este campo:
- **É automaticamente incluído no JWT** — disponível via `auth.jwt()->'app_metadata'`
- **Não é editável pelo usuário** — apenas via Admin API (`service_role`)
- **Não requer tabela adicional** — zero duplicação
- **Performance superior em RLS** — leitura do JWT, sem subquery em tabela

### Referências: Supabase Best Practices aplicadas

Per `security-rls-performance.md`:
```sql
-- ✅ Correto: wrap em SELECT para caching (chamado 1x, não por row)
USING ((select auth.jwt()->'app_metadata'->>'is_platform_admin')::boolean = true)

-- ❌ Incorreto: chamado por row
USING (auth.jwt()->'app_metadata'->>'is_platform_admin' = 'true')
```

Per `security-rls-basics.md`:
```sql
-- Policy para authenticated role com admin bypass
CREATE POLICY admin_bypass ON {table}
  FOR ALL
  TO authenticated
  USING (
    organization_id = (select auth.jwt()->'app_metadata'->>'organization_id')::uuid
    OR (select auth.jwt()->'app_metadata'->>'is_platform_admin')::boolean = true
  );
```

## Implementação Corrigida

### 1. Criar Supabase Admin Client

```typescript
// NEW: src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import { env } from '@/infra/env'

/**
 * Supabase client com service_role key.
 * Uso EXCLUSIVO para operações admin (set app_metadata, manage users).
 * NUNCA expor ao client-side.
 */
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

### 2. Remover tabela `public.users`

```sql
-- Migration: drop duplicated users table
DROP TABLE IF EXISTS public.users CASCADE;
```

### 3. User Entity como Value Object sobre auth.users

```typescript
// UPDATED: src/modules/user/types.ts
// User entity derivado do Supabase auth — sem tabela própria
export interface UserAuth {
  id: string
  email: string
  name: string
  isPlatformAdmin: boolean
}

// Para operações admin
export interface SetPlatformAdminInput {
  userId: string
  isPlatformAdmin: boolean
}
```

### 4. User Repository como Adapter sobre Supabase Admin API

```typescript
// UPDATED: src/modules/user/repository/user-repository.ts
import type { UserAuth, SetPlatformAdminInput } from '../types'

/**
 * Repository para operações sobre o User entity.
 * Diferente dos outros repos: não usa Drizzle/tabela própria.
 * Wraps Supabase Admin API para gerenciar app_metadata.
 */
export interface UserRepository {
  findById(id: string): Promise<UserAuth | null>
  findByEmail(email: string): Promise<UserAuth | null>
  makePlatformAdmin(id: string): Promise<void>
  revokePlatformAdmin(id: string): Promise<void>
  isPlatformAdmin(id: string): Promise<boolean>
}
```

```typescript
// UPDATED: src/modules/user/repository/user-admin-repository.ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { UserAuth } from '../types'
import type { UserRepository } from './user-repository'

export class UserAdminRepository implements UserRepository {
  async findById(id: string): Promise<UserAuth | null> {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id)
    if (error || !data.user) return null

    return this.mapToUserAuth(data.user)
  }

  async findByEmail(email: string): Promise<UserAuth | null> {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) return null

    const user = data.users.find(u => u.email === email)
    return user ? this.mapToUserAuth(user) : null
  }

  async makePlatformAdmin(id: string): Promise<void> {
    await supabaseAdmin.auth.admin.updateUserById(id, {
      app_metadata: { is_platform_admin: true },
    })
  }

  async revokePlatformAdmin(id: string): Promise<void> {
    await supabaseAdmin.auth.admin.updateUserById(id, {
      app_metadata: { is_platform_admin: false },
    })
  }

  async isPlatformAdmin(id: string): Promise<boolean> {
    const { data } = await supabaseAdmin.auth.admin.getUserById(id)
    return data?.user?.app_metadata?.is_platform_admin === true
  }

  private mapToUserAuth(user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): UserAuth {
    return {
      id: user.id,
      email: user.email || '',
      name: (user.user_metadata?.username as string) || user.email?.split('@')[0] || 'User',
      isPlatformAdmin: user.app_metadata?.is_platform_admin === true,
    }
  }
}

export const userRepository = () => new UserAdminRepository()
```

### 5. Simplificar Auth Context — Ler do JWT

```typescript
// UPDATED: src/modules/auth/contexts/auth-context.tsx (trecho relevante)

function mapSupabaseUserToAuthUser(user: UserSupabase | null): UserAuth | null {
  if (!user) return null

  const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User'

  return {
    email: user.email || '',
    id: user.id,
    // ✅ Lê direto do app_metadata no JWT — sem query extra ao DB
    isPlatformAdmin: user.app_metadata?.is_platform_admin === true,
    name: username,
  }
}
```

```typescript
// UPDATED: src/modules/auth/type.ts
export interface UserSupabase {
  id: string
  email?: string
  user_metadata?: Record<string, unknown> & { username?: string }
  app_metadata?: Record<string, unknown> & { is_platform_admin?: boolean }
}
```

**Eliminação de `getUserProfileAction`** — não mais necessário. O `isPlatformAdmin` vem direto do JWT/session user, sem roundtrip adicional ao DB.

### 6. Simplificar Sign-Up — Sem criar User entity separado

```typescript
// UPDATED: src/modules/auth/actions/sign-up-action.ts (trecho relevante)
// Remover a criação de domain User entity no signup:

// ❌ REMOVER:
// if (data.user) {
//   await userRepository().create({ _id: data.user.id, email: ..., isPlatformAdmin: false })
// }

// ✅ Não precisa fazer nada extra — auth.users já foi criado pelo Supabase.
// app_metadata.is_platform_admin defaults to null/undefined (= false).
// Apenas admin explicitamente concede via userRepository().makePlatformAdmin(id).
```

### 7. RLS Policies com Admin Bypass

```sql
-- Helper function para verificar platform admin via JWT (performático)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (select current_setting('request.jwt.claims', true)::json->'app_metadata'->>'is_platform_admin')::boolean,
    false
  );
$$;

-- Policy padrão para tabelas com org scope + admin bypass
-- Exemplo para customers:
CREATE POLICY "org_isolation_with_admin_bypass" ON customers
  FOR ALL
  TO authenticated
  USING (
    organization_id = (select auth.jwt()->'app_metadata'->>'organization_id')::uuid
    OR (select public.is_platform_admin())
  );
```

### 8. Env Variable necessária

```bash
# .env.local — adicionar:
SUPABASE_SECRET_KEY=your-service-role-key

# src/infra/env/ — adicionar validação:
SUPABASE_SECRET_KEY: z.string().min(1)
```

## Migration Plan

### Migration 1: Drop `public.users` table
```sql
-- Reverter migration 0007_clear_the_professor.sql
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_is_platform_admin;
DROP TABLE IF EXISTS public.users CASCADE;
```

### Migration 2: Criar helper function para RLS
```sql
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (select current_setting('request.jwt.claims', true)::json->'app_metadata'->>'is_platform_admin')::boolean,
    false
  );
$$;
```

### Seed: Marcar admin existente (se houver)
```typescript
// Via Supabase Dashboard ou script one-off:
await supabaseAdmin.auth.admin.updateUserById('admin-user-uuid', {
  app_metadata: { is_platform_admin: true },
})
```

## Arquivos a Remover

- `src/infra/db/schemas/user.ts` — tabela eliminada
- `src/modules/auth/actions/get-user-profile-action.ts` — substituído por JWT claim
- Migration `0007_clear_the_professor.sql` — reverter

## Arquivos a Criar

- `src/lib/supabase/admin.ts` — Admin client (service_role)
- `src/modules/user/repository/user-admin-repository.ts` — Adapter sobre Supabase Admin API

## Arquivos a Atualizar

- `src/modules/user/types.ts` — Simplificar tipos
- `src/modules/user/repository/user-repository.ts` — Interface atualizada
- `src/modules/user/schemas.ts` — Remover dependência de usersTable
- `src/modules/auth/type.ts` — Adicionar `app_metadata` ao `UserSupabase`
- `src/modules/auth/contexts/auth-context.tsx` — Ler `isPlatformAdmin` do JWT
- `src/modules/auth/actions/sign-up-action.ts` — Remover criação de domain User
- `src/infra/env/` — Adicionar `SUPABASE_SECRET_KEY`
- `src/infra/db/schemas/index.ts` — Remover export de `usersTable`

## Verificação

1. ✅ Sem tabela `public.users` — zero duplicação de dados
2. ✅ `isPlatformAdmin` lido do JWT (app_metadata) — sem query extra
3. ✅ Admin flag controlado exclusivamente via Supabase Admin API
4. ✅ RLS policies com admin bypass performático (SELECT wrapper)
5. ✅ Sign-up simplificado — Supabase auth cria tudo necessário
6. ✅ `SUPABASE_SECRET_KEY` validada em env
7. ✅ `pnpm build` compila sem erros

## Comparativo: Antes vs Depois

| Aspecto | Antes (incorreto) | Depois (corrigido) |
|---|---|---|
| Armazenamento | `public.users` table | `auth.users.app_metadata` |
| Email | Duplicado | Lido de `auth.users` |
| isPlatformAdmin | Query no DB | JWT claim (zero latência) |
| Signup | Cria auth user + domain user | Apenas auth user |
| RLS bypass | `EXISTS (SELECT FROM users)` | `auth.jwt()->'app_metadata'` |
| Dependência | Drizzle ORM | Supabase Admin API |
| Tabelas extras | 1 (`users`) | 0 |

## Effort Estimate (revisado)

- Admin client + env setup: 1 hora
- Drop users table + migration: 1 hora
- Refactor User module (repository adapter): 2 horas
- Auth context simplification: 1 hora
- RLS helper function: 1 hora
- Tests: 2 horas
- **Total: ~8 horas** (reduzido de 18h — escopo menor sem tabela)

## Related Issues

- DDD-009: Missing organization_id (foundation)
- DDD-012: Missing OnboardingService (uses user context)
- DDD-016: Missing BaseRepository (user context via JWT)

---

## System Prompt RISE + Execucao por Skill

### RISE Context

- **Role:** Voce e um Supabase Auth specialist & DDD adapter designer. Voce integra authorization claims nativos do Supabase (app_metadata/JWT) com a arquitetura DDD existente, sem duplicar dados do auth provider.
- **Instructions:** Corrija a User Entity para usar `app_metadata` do Supabase em vez de tabela separada. Remova `public.users`, crie admin client, adapte repository para Supabase Admin API, simplifique auth context para ler do JWT.
- **Steps:** 1) Criar `src/lib/supabase/admin.ts` com service_role client. 2) Adicionar `SUPABASE_SECRET_KEY` ao env validation. 3) Refatorar `UserRepository` como adapter sobre Supabase Admin API. 4) Atualizar `UserSupabase` type com `app_metadata`. 5) Simplificar `AuthContext` para ler `isPlatformAdmin` do JWT. 6) Remover `getUserProfileAction`. 7) Simplificar `signUpAction` (remover criacao de domain user). 8) Criar migration para drop `public.users`. 9) Criar `is_platform_admin()` SQL function para RLS. 10) Atualizar testes.
- **Expectation:** Zero duplicacao de dados. `isPlatformAdmin` lido do JWT. Admin flag gerenciado via Supabase Admin API. RLS bypass performatico. `pnpm build` e `pnpm test` passam.

### Execucao

**Skill 1 de 3 -- Supabase Admin Setup**
```
/antigravity-awesome-skills:nextjs-supabase-auth
Role: Supabase Admin API specialist configurando service_role client.
Instructions: Crie o admin client e configure env validation.
Steps: 1) Crie src/lib/supabase/admin.ts com createClient usando SUPABASE_SECRET_KEY. 2) Adicione SUPABASE_SECRET_KEY ao src/infra/env/ validation (z.string().min(1), server-only). 3) Verifique que o client NAO expoe ao browser (sem NEXT_PUBLIC_ prefix na key).
Expectation: Admin client funcional, env validada, zero exposicao client-side.
```

**Skill 2 de 3 -- User Module Refactor**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD adapter designer refatorando User module para wrapper sobre Supabase Admin API.
Instructions: Refatore o modulo User para usar Supabase Admin API em vez de Drizzle ORM.
Steps: 1) Atualize src/modules/user/types.ts (UserAuth, SetPlatformAdminInput). 2) Atualize src/modules/user/repository/user-repository.ts (interface sem create/delete). 3) Crie src/modules/user/repository/user-admin-repository.ts (implementacao via Supabase Admin API). 4) Remova src/infra/db/schemas/user.ts. 5) Atualize src/modules/user/schemas.ts (Zod schemas manuais, sem drizzle-zod). 6) Atualize barrel exports. 7) Remova src/modules/auth/actions/get-user-profile-action.ts.
Expectation: User module funcional sem tabela propria. Repository adapter sobre Supabase Admin API. pnpm build compila.
```

**Skill 3 de 3 -- Auth Context + RLS + Migration**
```
/antigravity-awesome-skills:database-migration
Role: Migration engineer + Auth integration specialist.
Instructions: Simplifique auth context, crie migration para drop users table, configure RLS helper.
Steps: 1) Atualize src/modules/auth/type.ts (adicionar app_metadata). 2) Atualize src/modules/auth/contexts/auth-context.tsx (ler isPlatformAdmin do session user.app_metadata). 3) Simplifique src/modules/auth/actions/sign-up-action.ts (remover criacao de domain user). 4) Gere migration via Drizzle para drop usersTable (remova do schema, pnpm db:generate). 5) Adicione manualmente is_platform_admin() SQL function na migration. 6) Valide com pnpm db:migrate local.
Expectation: Auth context le do JWT. Signup simplificado. Migration drop users table + cria helper function. pnpm db:migrate passa.
```
