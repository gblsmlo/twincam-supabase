export const errorType = [
	'NOT_FOUND_ERROR',
	'VALIDATION_ERROR',
	'DATABASE_ERROR',
	'AUTHORIZATION_ERROR',
	'UNKNOWN_ERROR',
] as const

export type Failure<E = unknown> = {
	success: false
	type: (typeof errorType)[number]
	message: string
	error?: string | Error
	details?: E
}

export type Success<T> = {
	success: true
	data: T
	message?: string
}

export type Result<T, E = unknown> = Success<T> | Failure<E>

export const success = <T>(data: T, message?: string): Success<T> => ({
	data,
	message,
	success: true,
})

type FailureProps<E> = {
	type: (typeof errorType)[number]
	message: string
	error?: string | Error
	details?: E
}

export const failure = <E = unknown>({
	type,
	message,
	error,
	details,
}: FailureProps<E>): Failure<E> => ({
	details,
	error,
	message,
	success: false,
	type,
})

// Type Guards
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => result.success
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => !result.success
