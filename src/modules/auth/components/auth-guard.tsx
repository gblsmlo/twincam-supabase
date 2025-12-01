'use server'

import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getSessionAction } from '../actions/get-session-action'

export default async function AuthGuard({ children }: { children: ReactNode }) {
	const session = await getSessionAction()

	if (session?.user) {
		redirect('/dashboard')
	}

	return <>{children}</>
}
