'use server'

import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getSessionAction } from '../actions/get-session-action'

export async function AuthPrivate({ children }: { children: ReactNode }) {
	const session = await getSessionAction()

	if (!session) {
		redirect('/auth/login')
	}

	return <>{children}</>
}
