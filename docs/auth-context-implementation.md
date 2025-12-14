# AuthContext Implementation

## Overview

The `AuthContext` provides a centralized authentication state management system for the application, integrating Supabase session handling with React Context API. It offers reactive UI updates while ensuring server-side cookie integrity through hybrid client-server architecture.

## Architecture

### Client-Side (CSR)
- **Session retrieval**: Uses `createClient()` from `@/lib/supabase/client` to fetch user session
- **Real-time updates**: Subscribes to `onAuthStateChange()` for instant UI reactivity
- **State management**: Maintains `user`, `status`, `refresh()`, and `signOut()` in context

### Server-Side (SSR)
- **Sign-out action**: `signOutAction` uses `createClient()` from `@/lib/supabase/server` to clear cookies reliably via `supabase.auth.signOut()` and revalidates the layout path
- **Cookie management**: Leverages Next.js 15+ cookies API with `getAll()` and `setAll()` for SSR cookie synchronization

### Middleware
- **Session sync**: Existing `src/app/proxy.ts` middleware refreshes session cookies between client and server, preventing drift
- **Auth guards**: Server-side guard (`verify-session.ts`) protects private routes; client hook (`useAuthGuard`) handles redirects

## Components

### 1. AuthContext (`src/modules/auth/contexts/auth-context.tsx`)

**State:**
- `user: UserAuth | null` – Current authenticated user
- `status: AuthStatus` – `'loading' | 'authenticated' | 'unauthenticated'`

**Methods:**
- `refresh(): Promise<void>` – Fetches latest session from Supabase and updates state
- `signOut(): Promise<void>` – Calls server action to sign out, clears state, and redirects to `/auth/login`

**Lifecycle:**
- On mount: Fetches initial session via `refresh()`
- Subscribes to `onAuthStateChange()` for real-time updates
- Maps Supabase `User` to `AuthUser` (id, name, email) using `user_metadata.username` or email prefix

### 2. signOutAction (`src/modules/auth/actions/sign-out-action.ts`)

Server action that:
1. Creates server Supabase client with cookies integration
2. Calls `supabase.auth.signOut()` to clear server-side session
3. Revalidates the root layout path with `revalidatePath('/', 'layout')`
4. Returns `{ success: boolean, error?: string }`

### 3. useAuth Hook (`src/modules/auth/hooks/use-auth.ts`)

Convenience hook for consuming `AuthContext`:
```typescript
const { user, status, refresh, signOut } = useAuth()
```

Throws error if used outside `AuthProvider`.

### 4. Provider Setup (`src/components/providers/providers.tsx`)

`AuthProvider` is mounted in the provider tree:
```tsx
<ThemeProvider>
  <AuthProvider>
    <NuqsAdapter>{children}</NuqsAdapter>
  </AuthProvider>
</ThemeProvider>
```

### 5. Navigation Integration (`src/components/navigations/nav-user.tsx`)

Consumes `useAuth()` to:
- Display real user data (name, email) from context
- Wire sign-out button to `signOut()` method
- Hide navigation if no user is authenticated

## Client vs Server: Trade-offs

### Client-Side Session (CSR via `createClient()`)

**Advantages:**
- ✅ Immediate UI reactivity to auth changes
- ✅ No extra server round trips for status checks
- ✅ Simple integration with client components (buttons, dropdowns)
- ✅ Works seamlessly with `onAuthStateChange()` subscription
- ✅ Aligns with existing `useAuthGuard` client hook

**Disadvantages:**
- ❌ Hydration mismatch risk if session loads after initial render (mitigated by `status: 'loading'`)
- ❌ Potential cookie/session drift without middleware (solved by `proxy.ts`)
- ❌ Client sign-out may not clear server cookies reliably (solved by using server action)

### Server Actions (SSR via `createClient()` from server)

**Advantages:**
- ✅ Consistent cookie handling via Next.js cookies API integration
- ✅ Reliable server-side session clearing with `signOut()`
- ✅ SSR redirects are immediate (already used in `verify-session.ts`)
- ✅ Security: keeps auth logic server-side, avoids exposing secrets
- ✅ Aligns with existing server guards (`PrivateGuard`)

**Disadvantages:**
- ❌ Less reactive UI without client-side state (mitigated by hybrid approach)
- ❌ Requires client routing after server action (handled by `router.replace('/auth/login')`)
- ❌ Extra request hop for sign-out (acceptable trade-off for reliability)

### Hybrid Approach (Recommended)

The implementation uses **hybrid architecture**:
- **Client context** for reactive UI state and user display
- **Server action** for critical sign-out to ensure cookie integrity
- **Middleware** (`proxy.ts`) for continuous session synchronization
- **Server guards** (`verify-session.ts`) for SSR route protection

This balances reactivity with security, leveraging the strengths of both approaches while mitigating their weaknesses.

## Usage Examples

### Basic consumption:
```tsx
import { useAuth } from '@/modules/auth'

function MyComponent() {
  const { user, status, signOut } = useAuth()

  if (status === 'loading') return <Skeleton />
  if (status === 'unauthenticated') return <LoginPrompt />

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Conditional rendering:
```tsx
const { user, status } = useAuth()

{status === 'authenticated' && <PrivateContent />}
```

### Manual refresh:
```tsx
const { refresh } = useAuth()

// After profile update
await updateProfile(data)
await refresh()
```

## Integration with Existing Guards

### Server-Side (SSR)
- **Layout guard**: `src/app/(private)/layout.tsx` uses `PrivateGuard` → calls `verifySessionAction` server action
- **Action**: `src/modules/auth/actions/verify-session.ts` uses `getAuthAction` to fetch session server-side and redirects if unauthorized
- **Middleware**: `src/app/proxy.ts` refreshes session cookies on every request, preventing stale sessions

### Client-Side (CSR)
- **Hook guard**: `src/modules/auth/hooks/useAuthGuard` uses `getAuthAction` client-side to check session and redirect
- **Context**: `AuthContext` provides real-time session state for UI components via `onAuthStateChange()`

Both approaches coexist:
- **SSR guards** handle initial page loads and redirects
- **Client context** handles UI state and navigation interactions
- **Middleware** ensures cookie consistency between both layers

## User Mapping

`mapSupabaseUserToAuthUser()` transforms Supabase session user to `AuthUser`:
```typescript
{
  id: user.id,
  name: user.user_metadata?.username || user.email.split('@')[0] || 'User',
  email: user.email || ''
}
```

Falls back to email prefix if `username` is not set in `user_metadata`.

## Security Considerations

1. **Cookie handling**: Server action uses `createServerClient` with Next.js cookies integration to ensure HttpOnly cookies are cleared
2. **Revalidation**: `revalidatePath('/', 'layout')` ensures cached pages are refreshed after sign-out
3. **Middleware**: `proxy.ts` maintains session integrity across SSR and CSR boundaries
4. **Type safety**: All session data is typed via `AuthUser` interface
5. **Error handling**: Both `refresh()` and `signOut()` include try-catch with console error logging

## Future Enhancements

- [ ] Add `loading` UI skeleton in navigation while `status === 'loading'`
- [ ] Implement optimistic updates for faster perceived sign-out
- [ ] Add session expiry notification with auto-refresh option
- [ ] Store additional user metadata (avatar, role, preferences)
- [ ] Add telemetry for auth state transitions (analytics)
