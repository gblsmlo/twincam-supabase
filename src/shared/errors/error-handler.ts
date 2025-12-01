import { APIError } from 'better-auth/api'
import type { AppErrorType } from './app-error'
import { type Failure, failure } from './result'

export function handleAuthError(error: unknown): Failure {
	if (error instanceof APIError) {
		const status = error.status
		const message = error.body?.message || error.message || 'Erro de autenticação.'

		let type: AppErrorType = 'UNKNOWN_ERROR'

		switch (status) {
			case 400:
			case 422:
				type = 'VALIDATION_ERROR'
				break
			case 401:
			case 403:
				type = 'AUTHORIZATION_ERROR'
				break
			case 404:
				type = 'NOT_FOUND_ERROR'
				break
			case 500:
				type = 'DATABASE_ERROR'
				break
			default:
				type = 'UNKNOWN_ERROR'
		}

		return failure({
			details: error.body,
			error: `Auth Error (${status})`,
			message,
			type,
		})
	}

	if (error instanceof Error) {
		return failure({
			error: 'Unexpected Error',
			message: error.message,
			type: 'UNKNOWN_ERROR',
		})
	}

	return failure({
		error: 'Unknown',
		message: 'Ocorreu um erro desconhecido na autenticação.',
		type: 'UNKNOWN_ERROR',
	})
}
