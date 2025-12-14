'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'

export function AuthGuardClient({
	children,
	isPrivate,
}: {
	children: ReactNode
	isPrivate?: boolean
}) {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)

	useEffect(() => {
		const supabase = createClient()

		const checkAuth = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser()
			const authenticated = !!user

			setIsAuthenticated(authenticated)
			setIsLoading(false)

			if (authenticated && !isPrivate) {
				router.push('/dashboard')
			} else if (!authenticated && isPrivate) {
				router.push('/auth/login')
			}
		}

		checkAuth()

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			const authenticated = !!session?.user

			setIsAuthenticated(authenticated)

			if (event === 'SIGNED_OUT' && isPrivate) {
				router.push('/auth/login')
			} else if (event === 'SIGNED_IN' && !isPrivate) {
				router.push('/dashboard')
			}
		})

		return () => subscription.unsubscribe()
	}, [router, isPrivate])

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-gray-900 border-t-2 border-b-2" />
			</div>
		)
	}

	if (isPrivate && !isAuthenticated) return null
	if (!isPrivate && isAuthenticated) return null

	return <>{children}</>
}
