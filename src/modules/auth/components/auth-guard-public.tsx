import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getClaimsAction } from '../actions'

export default async function AuthGuardPublic({ children }: { children: ReactNode }) {
	const { isAuthenticated } = await getClaimsAction()

	if (isAuthenticated) {
		redirect('/dashboard')
	}

	return <>{children}</>
}
