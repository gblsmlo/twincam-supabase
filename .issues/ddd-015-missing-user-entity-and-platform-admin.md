# DDD-015: Missing User Entity and is_platform_admin Flag

**Severity:** HIGH
**Category:** Domain Model | Tactical Design | Authorization
**Status:** Open
**Linear:** [PRD-23](https://linear.app/studio-risine/issue/PRD-23/ddd-015-missing-user-entity-and-is-platform-admin-flag)
**Blocks:** DDD-012, DDD-016, Platform admin feature
**Depends on:** DDD-009

## Problem

Tactical design requires a **User entity** with `is_platform_admin` flag for super-admin capabilities, but the codebase only has Supabase's `auth.users` (external, not domain model).

**Current State:**
```typescript
// No User entity in domain
// Uses Supabase auth.users directly
// No is_platform_admin flag anywhere
```

**Tactical Design Requirement:**
```
User Entity (Domain Model):
- Represents physical identity within system
- Has is_platform_admin flag
- If is_platform_admin=true: can access any organization (RLS bypass)
- Linked to auth.users for authentication
```

## Business Impact

🔴 **BLOCKED FEATURES:**
- Platform admin dashboard (super admin bypass)
- Cross-organization admin operations
- Support staff access to customer accounts
- Compliance/audit log access

## Recommendation

### Create User Entity & Schema

```typescript
// NEW: src/infra/db/schemas/user.ts

export const usersTable = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(), // Same as auth.users.id
    email: text('email').notNull().unique(),
    isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
    ...auditFields,
  },
  (table) => ({
    emailIndex: index('idx_users_email').on(table.email),
    platformAdminIndex: index('idx_users_is_platform_admin').on(table.isPlatformAdmin),
  })
);

export type User = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;
export type UserUpdate = typeof usersTable.$inferInsert;
```

### Create User Module

```typescript
// NEW: src/modules/user/schemas.ts
export const userSelectSchema = createSelectSchema(usersTable);
export const userCreateSchema = createInsertSchema(usersTable);
export const userUpdateSchema = createUpdateSchema(usersTable);

export type User = z.infer<typeof userSelectSchema>;

// NEW: src/modules/user/repository/user.ts
export interface IUserRepository {
  create(input: UserInsert): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, input: Partial<UserUpdate>): Promise<User>;
  makePlatformAdmin(id: string): Promise<User>;
  revokePlatformAdmin(id: string): Promise<User>;
}

export function userRepository(): IUserRepository {
  return {
    async create(input: UserInsert): Promise<User> {
      return await db
        .insert(usersTable)
        .values(input)
        .returning()
        .then(rows => rows[0]);
    },

    async findById(id: string): Promise<User | null> {
      return await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .then(rows => rows[0] ?? null);
    },

    async findByEmail(email: string): Promise<User | null> {
      return await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .then(rows => rows[0] ?? null);
    },

    async update(id: string, input: Partial<UserUpdate>): Promise<User> {
      return await db
        .update(usersTable)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(usersTable.id, id))
        .returning()
        .then(rows => rows[0]);
    },

    async makePlatformAdmin(id: string): Promise<User> {
      return await this.update(id, { isPlatformAdmin: true });
    },

    async revokePlatformAdmin(id: string): Promise<User> {
      return await this.update(id, { isPlatformAdmin: false });
    },
  };
}
```

### Update Auth Sign-Up to Create User

```typescript
// src/modules/auth/actions/sign-up-action.ts (UPDATE)

'use server';

export async function signUpAction(input: SignUpInput): Promise<Result<AuthResponse>> {
  try {
    // Step 1: Create Supabase user
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      return failure(DATABASE_ERROR, 'Failed to create user account');
    }

    // Step 2: Create domain User entity
    const userResult = await userRepository().create({
      id: data.user.id, // Link to auth user
      email: data.user.email!,
      isPlatformAdmin: false, // New users are never admin
    });

    if (!userResult) {
      // If user creation fails, should delete auth user
      // This is a transaction safety issue
      return failure(DATABASE_ERROR, 'Failed to create user profile');
    }

    // Step 3: Onboard organization (from DDD-012)
    const onboardingService = new OnboardingService(...);
    const onboardResult = await onboardingService.onboardNewUser(
      data.user.id,
      input.organizationName,
      input.organizationSlug,
    );

    if (isFailure(onboardResult)) {
      return onboardResult;
    }

    return success({
      user: userResult,
      organization: onboardResult.data.organization,
    });
  } catch (error) {
    return failure(UNKNOWN_ERROR, 'Signup failed');
  }
}
```

### RLS Policy for Platform Admin Bypass

```sql
-- Allow platform admin to access any organization
CREATE POLICY admin_bypass_policy ON customers
  FOR SELECT
  USING (
    organization_id = current_setting('app.current_organization_id')::uuid
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_platform_admin = true
    )
  );
```

### Authorization Middleware

```typescript
// NEW: src/shared/middleware/admin-context.ts

export async function getOrganizationContext(userId: string): Promise<{
  organizationId: string | null;
  isPlatformAdmin: boolean;
}> {
  const user = await userRepository().findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.isPlatformAdmin) {
    // Platform admin can access any org
    // Next request should specify which org to access
    return { organizationId: null, isPlatformAdmin: true };
  }

  // Regular user: get their default organization
  const membership = await memberRepository().findByUser(userId);
  return {
    organizationId: membership?.organizationId ?? null,
    isPlatformAdmin: false,
  };
}
```

## Database Migration

```sql
-- Create users table linked to auth.users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  is_platform_admin boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_platform_admin ON users(is_platform_admin);

-- Auto-create user on auth signup (PostgreSQL trigger or via application)
```

## Files to Create

- `/src/infra/db/schemas/user.ts` - User schema
- `/src/modules/user/schemas.ts` - Zod schemas
- `/src/modules/user/types.ts` - Types
- `/src/modules/user/repository/user-interface.ts` - Interface
- `/src/modules/user/repository/user.ts` - Implementation
- `/src/shared/middleware/admin-context.ts` - RLS context
- New migration file

## Files to Update

- `/src/modules/auth/actions/sign-up-action.ts` - Create user entity
- `/src/modules/auth/actions/sign-in-action.ts` - Maybe verify user exists

## Verification

After implementation:
1. ✅ User table created with proper foreign key to auth.users
2. ✅ New users automatically created with is_platform_admin=false
3. ✅ Platform admins can be marked in database
4. ✅ RLS policies respect platform admin flag
5. ✅ Auth sign-in works with new User entity
6. ✅ No auth data leakage (user only sees domain User, not auth.users)

## Effort Estimate

- Schema and repository: 4 hours
- Auth integration: 4 hours
- RLS policies: 3 hours
- Middleware/context: 3 hours
- Tests: 4 hours
- **Total: ~18 hours**

## Related Issues

- DDD-009: Missing organization_id (foundation)
- DDD-012: Missing OnboardingService (uses user creation)
- DDD-016: Missing BaseRepository (uses user context)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Tactical Designer & Supabase Auth specialist. Você cria entidades de domínio que complementam o auth provider externo (Supabase) sem duplicar responsabilidades.
- **Instructions:** Crie a User Entity como modelo de domínio próprio, separado do auth.users do Supabase. A entity deve ter `is_platform_admin` para bypass RLS. Integre com o fluxo de signup existente.
- **Steps:** 1) Criar schema Drizzle `usersTable` em `src/infra/db/schemas/user.ts`. 2) Criar módulo `src/modules/user/` completo (schemas, types, repository, actions, index). 3) Integrar com sign-up-action para criar User domain entity após auth signup. 4) Adicionar RLS bypass policy para platform admins. 5) Atualizar AuthContext para incluir isPlatformAdmin.
- **Expectation:** User entity criado em signup, is_platform_admin funcional, platform admin pode bypassar RLS, módulo segue padrão de src/modules/product/.

### Execução

**Skill 1 de 2 — Entity & Module**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner criando uma Entity de domínio (User) que complementa auth.users do Supabase.
Instructions: Crie o módulo User completo seguindo o padrão canônico de src/modules/product/.
Steps: 1) Crie src/infra/db/schemas/user.ts: usersTable com id (uuid PK referenciando auth.users.id via FK), email (text unique notNull), isPlatformAdmin (boolean notNull default false), auditFields. 2) Crie src/modules/user/schemas.ts com createSelectSchema, createInsertSchema, createUpdateSchema via drizzle-zod. 3) Crie src/modules/user/types.ts inferindo tipos dos schemas Zod. 4) Crie src/modules/user/repository/user-repository.ts (interface) + user-drizzle-repository.ts (implementação com factory). Interface: create, findById, findByEmail, update, makePlatformAdmin, revokePlatformAdmin. 5) Crie src/modules/user/index.ts com barrel exports.
Expectation: Módulo user/ com mesma estrutura de product/. Repository funcional com Drizzle. Tipos type-safe. pnpm build compila.
Referências: docs/tactical-design.md §2 (User entity). src/modules/product/ (padrão canônico). src/infra/db/helpers/audit-fields.ts.
```

**Skill 2 de 2 — Auth Integration**
```
/antigravity-awesome-skills:nextjs-supabase-auth
Role: Next.js + Supabase Auth specialist integrando domain User entity com auth flow existente.
Instructions: Integre o novo módulo User com o signup e o AuthContext existentes.
Steps: 1) Atualize src/modules/auth/actions/sign-up-action.ts: após supabase.auth.signUp() sucesso, chame userRepository().create({ id: data.user.id, email: data.user.email, isPlatformAdmin: false }). 2) Trate falha: se User creation falhar, log error (não delete auth user — recovery manual). 3) Atualize src/modules/auth/contexts/auth-context.tsx: adicione isPlatformAdmin ao tipo AuthUser. 4) Atualize mapSupabaseUserToAuthUser para buscar isPlatformAdmin da tabela users via server call. 5) Crie RLS bypass policy: CREATE POLICY admin_bypass ON {cada_tabela} FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_platform_admin = true)).
Expectation: Signup cria auth user + domain User atomicamente (best-effort). AuthContext expõe isPlatformAdmin. Platform admin bypassa RLS. Compatibilidade mantida com guards existentes (verify-session, useAuthGuard).
Referências: docs/auth-context-implementation.md. src/modules/auth/contexts/auth-context.tsx. src/modules/auth/actions/sign-up-action.ts.
```
