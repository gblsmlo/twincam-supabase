# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm lint         # Check with Biome
pnpm lint:fix     # Auto-fix with Biome
pnpm test         # Run all tests (Vitest)
pnpm test {file}  # Run single test file
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
pnpm types:gen    # Generate Supabase TypeScript types
```

## Architecture

### Tech Stack
- **Next.js 16** App Router with React Server Components and Server Actions
- **Drizzle ORM** + PostgreSQL (via postgres-js) + **Supabase** for auth/storage
- **Biome** for linting/formatting (not ESLint/Prettier)
- **Vitest** for testing
- **React Hook Form** + **Zod** + **drizzle-zod** for forms and validation
- **TanStack Table v8** + **Nuqs** for data tables with URL-synced state
- **Sonner** for toasts, **Shadcn/ui** + Radix UI for components

### Directory Structure

```
src/
├── app/            # Next.js App Router — route groups: (marketing), (private), auth/, _auth/
├── components/     # Shared UI: ui/ (shadcn), data-table/, app-partials/, providers/
├── hooks/          # Shared hooks (useDataTable, useMobile, etc.)
├── infra/          # Infrastructure layer
│   ├── db/         # Drizzle client, schemas, migrations, helpers
│   ├── env/        # T3 env validation (required vars checked at startup)
│   └── auth/       # Auth configuration
├── lib/            # Supabase client factories (server.ts, client.ts)
├── modules/        # Feature modules (DDD-style)
└── shared/         # Cross-cutting: errors/, types/, utils/, config/
```

### Module Structure

Each feature module under `src/modules/{feature}/` follows this structure:

```
actions/        # Server actions: {verb}-{noun}-action.ts
components/     # Feature components (views, dialogs, data tables)
forms/          # React Hook Form + Zod components
repository/     # Data access: interface + Drizzle implementation
schemas.ts      # Zod schemas (derived from Drizzle via drizzle-zod)
types.ts        # TypeScript types (inferred from Zod schemas)
index.ts        # Barrel exports
```

See `src/modules/product/` as the canonical reference module.

### Key Patterns

**Result Type (Error Handling)**
All server actions return `Result<T>` — a discriminated union from `src/shared/errors/result.ts`. Use `isSuccess()` / `isFailure()` guards to narrow the type. Error types: `VALIDATION_ERROR`, `DATABASE_ERROR`, `AUTHORIZATION_ERROR`, `NOT_FOUND_ERROR`, `UNKNOWN_ERROR`.

**Server Actions**
`'use server'` → validate input with Zod → try DB operation via repository → return `Result<T>`. Errors are returned typed, never thrown to the client.

**Repository Pattern**
Each module defines a repository interface and a Drizzle implementation. Use the factory function (e.g., `productRepository()`) in actions. In tests, mock the module with `vi.mock()`.

**Schemas & Types**
Derive Zod schemas from Drizzle table schemas using `drizzle-zod` (`createSelectSchema`, `createInsertSchema`, `createUpdateSchema`). Infer TypeScript types from Zod schemas — never duplicate type definitions.

**Forms**
`'use client'` → `useForm({ resolver: zodResolver(schema) })` → `useTransition` for loading state → call server action → check `isSuccess`/`isFailure` → `toast` feedback + form-level errors. On success: reset form + `router.refresh()`.

**Data Tables**
Use `useDataTable` hook for URL-synced pagination/sorting/filtering via Nuqs. Column definitions use `DataTableColumnHeader` for sortable headers and `meta.variant` for filter types. Wrap with `DataTableView` component from `src/components/data-table/`.

**Audit Fields**
Apply helpers from `src/infra/db/helpers/audit-fields.ts` to Drizzle schemas: `auditFields`, `auditFieldsWithDeletedAt`, `auditFieldsWithDeletedAtAndCreatedBy`.

**Styling**
Use `cn()` from `src/shared/utils/cn.ts` (clsx + tailwind-merge) for all className composition.

**Supabase Clients**
Use `src/lib/supabase/server.ts` (cookie-based, for Server Components/Actions) and `src/lib/supabase/client.ts` (browser, for client components).

**User-facing error messages are written in Portuguese.**
