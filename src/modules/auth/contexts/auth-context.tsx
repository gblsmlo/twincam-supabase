'use client'

import { makeSupabaseClient, makeSupabaseSession } from '@/lib/supabase/factories-client'
import { useRouter } from 'next/navigation'
import { createContext, type ReactNode, useCallback, useEffect, useState } from 'react'
import { getUserProfileAction } from '../actions/get-user-profile-action'
import { signOutAction } from '../actions/sign-out-action'
import type { UserAuth, UserSupabase } from '../type'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
	user: null | UserAuth
	status: AuthStatus
	refresh: () => Promise<void>
	signOut: () => Promise<void>
}

export const AuthContext = createContext({} as AuthContextValue)

function mapSupabaseUserToAuthUser(
	user: UserSupabase | null,
	isPlatformAdmin = false,
): UserAuth | null {
	if (!user) return null

	const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User'

	return {
		email: user.email || '',
		id: user.id,
		isPlatformAdmin,
		name: username,
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserAuth | null>(null)
	const [status, setStatus] = useState<AuthStatus>('loading')
	const router = useRouter()

	const refresh = useCallback(async () => {
		try {
			const result = await makeSupabaseSession()

			if (result.success) {
				const { session } = result.data

				let isPlatformAdmin = false
				if (session?.user) {
					const profileResult = await getUserProfileAction()
					if (profileResult.success) {
						isPlatformAdmin = profileResult.data.isPlatformAdmin
					}
				}

				const authUser = mapSupabaseUserToAuthUser(session?.user || null, isPlatformAdmin)
				setUser(authUser)
				setStatus(authUser ? 'authenticated' : 'unauthenticated')
			}
		} catch (error) {
			console.error('Unexpected error during refresh:', error)
			setUser(null)
			setStatus('unauthenticated')
		}
	}, [])

	const signOut = useCallback(async () => {
		try {
			const result = await signOutAction()

			if (result.success) {
				setUser(null)
				setStatus('unauthenticated')

				router.replace(result.data.redirectTo)
			} else {
				console.error('Sign out failed:', result.error)
			}
		} catch (error) {
			console.error('Unexpected error during sign out:', error)
		}
	}, [router])

	useEffect(() => {
		const supabase = makeSupabaseClient()

		refresh()

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_, session) => {
			if (session?.user) {
				const profileResult = await getUserProfileAction()
				const isPlatformAdmin = profileResult.success ? profileResult.data.isPlatformAdmin : false
				const authUser = mapSupabaseUserToAuthUser(session.user, isPlatformAdmin)
				setUser(authUser)
				setStatus('authenticated')
			} else {
				setUser(null)
				setStatus('unauthenticated')
			}
		})

		return () => {
			subscription.unsubscribe()
		}
	}, [refresh])

	return (
		<AuthContext.Provider
			value={{
				refresh,
				signOut,
				status,
				user,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}
