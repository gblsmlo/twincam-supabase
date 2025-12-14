# Server Action Implementation Standard

This document outlines the standard pattern for implementing server actions in this codebase. All server actions must follow these guidelines to ensure consistency, reliability, and maintainability.

## Overview

Server actions are asynchronous functions that execute on the server and return a `Result<T>` type, which represents either a successful operation (`Success<T>`) or a failure (`Failure<E>`). This pattern provides explicit error handling and makes it easier to handle both success and failure cases on the client side.

## Pattern Requirements

### 1. File Structure

Each action should be in its own file within the module's `actions/` directory:

```
src/modules/{module-name}/
  ├── actions/
  │   ├── index.ts                    # Barrel export
  │   ├── {action-name}-action.ts     # Action implementation
  │   └── {action-name}-action.test.ts # Unit tests
```

### 2. Action Implementation

**Basic Template:**

```typescript
'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { repository } from '../repository/my-repository'
import { mySchema } from '../schemas'
import type { MyType, MyInputType } from '../types'

type MyActionOutput = {
  data: MyType
  // Add any additional metadata
}

export const myAction = async (
  input: MyInputType,
): Promise<Result<MyActionOutput>> => {
  // Step 1: Validate input with zod schema
  const validated = mySchema.safeParse(input)

  if (!validated.success) {
    return failure({
      details: validated.error.errors,
      error: validated.error.name,
      message: 'Human-readable validation error message',
      type: 'VALIDATION_ERROR',
    })
  }

  // Step 2: Execute business logic with try/catch
  try {
    const repo = repository()
    const result = await repo.someMethod(validated.data)

    return success({
      data: result,
    })
  } catch (error) {
    // Step 3: Handle known errors
    if (error instanceof Error) {
      return failure({
        error: error.name,
        message: error.message || 'Default error message',
        type: 'DATABASE_ERROR', // or 'AUTHORIZATION_ERROR'
      })
    }

    // Step 4: Handle unknown errors
    return failure({
      error: 'Erro desconhecido',
      message: 'A generic fallback message',
      type: 'UNKNOWN_ERROR',
    })
  }
}
```

### 3. Checklist

Before submitting a server action, ensure the following:

- ✅ **File header**: Use `'use server'` directive at the top of the file
- ✅ **Type safety**: Define input and output types explicitly
- ✅ **Validation**: Validate all user input with zod schemas using `safeParse()`
- ✅ **Return type**: Return `Result<OutputType>` using `success()` or `failure()`
- ✅ **Error handling**: Wrap external calls (repository, APIs) in `try/catch`
- ✅ **Error types**: Use appropriate error types:
  - `VALIDATION_ERROR` - Invalid input data
  - `AUTHORIZATION_ERROR` - Permission/auth issues
  - `DATABASE_ERROR` - Database operation failures
  - `NOT_FOUND_ERROR` - Resource not found
  - `UNKNOWN_ERROR` - Unexpected errors
- ✅ **Error details**: Include `error`, `message`, `type` and optionally `details` in failures
- ✅ **Meaningful messages**: Provide user-friendly error messages in Portuguese (or project language)
- ✅ **Barrel export**: Export action from `actions/index.ts`
- ✅ **Unit tests**: Create comprehensive tests covering:
  - ✅ Success path (valid input → successful result)
  - ✅ Validation failures (invalid input → validation error)
  - ✅ Repository/API errors (simulate throw → appropriate error type)
  - ✅ Edge cases (empty data, null values, etc.)

### 4. Client-Side Integration

When consuming server actions on the client:

```typescript
'use client'

import { isSuccess, isFailure } from '@/shared/errors/result'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { myAction } from '../actions'

export function MyForm() {
  const [isPending, startTransition] = useTransition()
  const form = useForm({...})

  const handleSubmit = (data) => {
    form.clearErrors()

    startTransition(async () => {
      const result = await myAction(data)

      if (isFailure(result)) {
        // Set form root error
        form.setError('root', {
          message: result.message,
        })

        // Show error toast
        toast.error(result.error || 'Erro', {
          description: result.message,
        })
      }

      if (isSuccess(result)) {
        // Show success toast
        toast.success('Sucesso!', {
          description: 'Operation completed',
        })

        // Refresh or redirect
        router.refresh()
        // or redirect(result.data.redirectTo)
      }
    })
  }

  return (/* form UI */)
}
```

### 5. Testing Guidelines

**Test Structure:**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { myAction } from './my-action'

vi.mock('../repository/my-repository', () => ({
  myRepository: vi.fn(),
}))

describe('myAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should succeed with valid input', async () => {
    // Mock repository
    const mockMethod = vi.fn().mockResolvedValue(mockData)
    vi.mocked(myRepository).mockReturnValue({ method: mockMethod } as any)

    // Execute action
    const result = await myAction(validInput)

    // Assert success
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(expectedOutput)
    }
  })

  it('should return validation error for invalid input', async () => {
    const result = await myAction(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.type).toBe('VALIDATION_ERROR')
      expect(result.details).toBeDefined()
    }
  })

  it('should handle repository errors', async () => {
    const mockMethod = vi.fn().mockRejectedValue(new Error('DB error'))
    vi.mocked(myRepository).mockReturnValue({ method: mockMethod } as any)

    const result = await myAction(validInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.type).toBe('DATABASE_ERROR')
    }
  })
})
```

## Best Practices

1. **Keep actions focused**: Each action should have a single responsibility
2. **Validate early**: Always validate input before performing any side effects
3. **Be explicit with errors**: Provide clear, actionable error messages
4. **Type everything**: Use TypeScript types for inputs, outputs, and intermediate values
5. **Test thoroughly**: Cover all code paths including edge cases
6. **Document complex logic**: Add comments for non-obvious business rules
7. **Use consistent naming**: Name actions as `{verb}{noun}Action` (e.g., `createProductAction`)

## Common Pitfalls

❌ **Don't**: Skip validation  
✅ **Do**: Always validate with zod schemas

❌ **Don't**: Return raw data without `success()` wrapper  
✅ **Do**: Always wrap success results with `success({ data })`

❌ **Don't**: Let errors propagate uncaught  
✅ **Do**: Wrap external calls in try/catch

❌ **Don't**: Use generic error messages  
✅ **Do**: Provide specific, user-friendly error messages

❌ **Don't**: Forget to mock repositories in tests  
✅ **Do**: Mock all external dependencies

## Examples

Refer to these existing implementations:

- [`src/modules/auth/actions/sign-up-action.ts`](../auth/actions/sign-up-action.ts) - Complete example with validation
- [`src/modules/product/actions/create-product-action.ts`](./create-product-action.ts) - Repository pattern
- [`src/modules/auth/forms/sign-up-form.tsx`](../auth/forms/sign-up-form.tsx) - Client integration

---

**Last Updated**: December 2025  
**Maintained by**: Development Team
