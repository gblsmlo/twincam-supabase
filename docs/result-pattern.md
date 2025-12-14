# Result Pattern Documentation

This document describes the `Result` pattern used for error handling and function returns in the application. The goal is to provide a type-safe and predictable way to handle operations that might fail, avoiding excessive use of `try/catch` for control flow and making errors explicit in function signatures.

## Structure

The `Result<T, E>` type is a discriminated union of two types: `Success<T>` and `Failure<E>`.

### Base Types

```typescript
// Success: contains the returned data
type Success<T> = {
  success: true
  data: T
  message?: string
}

// Failure: contains error information
type Failure<E = unknown> = {
  success: false
  type: ErrorType // 'NOT_FOUND_ERROR', 'VALIDATION_ERROR', etc.
  message: string
  error?: string | Error // Technical error detail (optional)
  details?: E // Additional error metadata (optional)
}
```

### Error Types (`ErrorType`)

The standardized error types are:
- `NOT_FOUND_ERROR`: Resource not found.
- `VALIDATION_ERROR`: Invalid input data.
- `DATABASE_ERROR`: Error in the database layer.
- `AUTHORIZATION_ERROR`: Permission or authentication failure.
- `UNKNOWN_ERROR`: Unexpected errors.

## Helper Functions

### `success<T>(data: T, message?: string): Success<T>`

Creates a success object.

**Example:**
```typescript
return success({ id: 1, name: "Test" })
return success(userData, "User created successfully")
```

### `failure<E>(props: FailureProps<E>): Failure<E>`

Creates a failure object.

**Example:**
```typescript
return failure({
  type: 'NOT_FOUND_ERROR',
  message: 'User not found'
})
```

## How to Use

### 1. Returning a Value (Data)

When your function needs to return data, define the type `T` in `Result<T>`.

**Example (Authentication):**

```typescript
import { createClient } from '@/lib/supabase/server'
import { failure, success, type Result } from '@/shared/errors'

type AuthOutput = {
  isAuthenticated: boolean
  userId?: string
}

export const checkAuth = async (): Promise<Result<AuthOutput>> => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    // Returning error
    return failure({
      type: 'AUTHORIZATION_ERROR',
      message: 'User not authenticated',
      error: error // Optional: pass original error for debugging
    })
  }

  // Returning data with success
  return success({
    isAuthenticated: true,
    userId: user.id
  })
}
```

**Consumption:**

```typescript
const result = await checkAuth()

if (result.success) {
  // TypeScript infers that result.data exists and is of type AuthOutput
  console.log("Logged in:", result.data.isAuthenticated)
} else {
  // TypeScript knows it is a failure and has message, type, etc.
  console.error("Error:", result.message)
}
```

### 2. Returning "Nothing" (Void)

When the operation is an action (e.g., delete, send email) and does not have a specific return value beyond success, you can use `Result<null>` or `Result<void>`. The recommended convention is to use `null` to be explicit in `success(null)`.

**Example:**

```typescript
export const deleteUser = async (id: string): Promise<Result<null>> => {
  try {
    await db.delete(id)
    return success(null, "User deleted successfully")
  } catch (err) {
    return failure({
      type: 'DATABASE_ERROR',
      message: 'Failed to delete user',
      error: err instanceof Error ? err : 'Unknown error'
    })
  }
}
```

## Type Checking (Type Guards)

Use the `isSuccess` and `isFailure` functions for boolean checking if necessary, although checking `result.success` directly is often sufficient and supports TypeScript's type narrowing.

```typescript
if (isFailure(result)) {
  // Handle error
  return
}
// Follow success flow
```
