import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getClaimsAction } from '../actions'

export async function AuthGuardPrivate({ children }: { children: ReactNode }) {
	const { isAuthenticated } = await getClaimsAction()

	if (!isAuthenticated) {
		redirect('/auth/login')
	}

	return <>{children}</>
}
