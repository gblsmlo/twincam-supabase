import { isSuccess } from '@/shared/errors'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getAuthGuardAction } from '../actions'

export async function AuthGuard({
	children,
	isPrivate,
}: {
	children: ReactNode
	isPrivate?: boolean
}) {
	const result = await getAuthGuardAction()
	const isAuthenticated = isSuccess(result)

	if (isAuthenticated && !isPrivate) {
		redirect('/dashboard')
	}

	if (!isAuthenticated && isPrivate) {
		redirect('/auth/login')
	}

	return <>{children}</>
}
