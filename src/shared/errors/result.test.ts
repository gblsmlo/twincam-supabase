import { describe, expect, it } from 'vitest'
import { failure, isFailure, isSuccess, type Result, success } from './result'

describe('Result Pattern', () => {
	describe('success()', () => {
		it('should create a success result with data', () => {
			const data = { id: 1, name: 'Test' }
			const result = success(data)

			expect(result).toEqual({
				data,
				message: undefined,
				success: true,
			})
		})

		it('should create a success result with data and message', () => {
			const result = success({ id: 1 }, 'Created successfully')

			expect(result).toEqual({
				data: { id: 1 },
				message: 'Created successfully',
				success: true,
			})
		})

		it('should handle null data (void return)', () => {
			const result = success(null)

			expect(result).toEqual({
				data: null,
				message: undefined,
				success: true,
			})
		})
	})

	describe('failure()', () => {
		it('should create a failure result with required props', () => {
			const result = failure({
				message: 'Resource not found',
				type: 'NOT_FOUND_ERROR',
			})

			expect(result).toEqual({
				details: undefined,
				error: undefined,
				message: 'Resource not found',
				success: false,
				type: 'NOT_FOUND_ERROR',
			})
		})

		it('should create a failure result with error detail', () => {
			const errorObj = new Error('Database connection failed')
			const result = failure({
				error: errorObj,
				message: 'DB Error',
				type: 'DATABASE_ERROR',
			})

			expect(result.error).toBe(errorObj)
			expect(result.type).toBe('DATABASE_ERROR')
		})

		it('should create a failure result with custom details', () => {
			type ValidationErrors = { field: string; issue: string }[]
			const details: ValidationErrors = [{ field: 'email', issue: 'invalid' }]

			const result = failure<ValidationErrors>({
				details,
				message: 'Invalid input',
				type: 'VALIDATION_ERROR',
			})

			expect(result.details).toEqual(details)
		})
	})

	describe('Type Guards', () => {
		it('isSuccess should return true for success result', () => {
			const result = success('ok')
			expect(isSuccess(result)).toBe(true)
			expect(isFailure(result)).toBe(false)
		})

		it('isFailure should return true for failure result', () => {
			const result = failure({ message: 'fail', type: 'UNKNOWN_ERROR' })
			expect(isFailure(result)).toBe(true)
			expect(isSuccess(result)).toBe(false)
		})
	})

	describe('Context Usage: Auth Scenario', () => {
		// Simulating an Auth Action similar to getAuthGuardAction
		type AuthState = { isAuthenticated: boolean; userId?: string }

		const mockAuthAction = async (token: string | null): Promise<Result<AuthState>> => {
			if (!token) {
				return failure({
					message: 'No token provided',
					type: 'AUTHORIZATION_ERROR',
				})
			}

			if (token === 'invalid') {
				return failure({
					error: new Error('Token signature invalid'),
					message: 'Invalid token',
					type: 'AUTHORIZATION_ERROR',
				})
			}

			return success({
				isAuthenticated: true,
				userId: 'user_123',
			})
		}

		it('should return success for valid token', async () => {
			const result = await mockAuthAction('valid_token')

			expect(isSuccess(result)).toBe(true)
			if (isSuccess(result)) {
				expect(result.data.isAuthenticated).toBe(true)
				expect(result.data.userId).toBe('user_123')
			}
		})

		it('should return failure for missing token', async () => {
			const result = await mockAuthAction(null)

			expect(isFailure(result)).toBe(true)
			if (isFailure(result)) {
				expect(result.type).toBe('AUTHORIZATION_ERROR')
				expect(result.message).toBe('No token provided')
			}
		})

		it('should return failure with error object for invalid token', async () => {
			const result = await mockAuthAction('invalid')

			expect(isFailure(result)).toBe(true)
			if (isFailure(result)) {
				expect(result.type).toBe('AUTHORIZATION_ERROR')
				expect(result.error).toBeInstanceOf(Error)
			}
		})
	})
})
