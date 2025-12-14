'use client'

import { useAuth } from '@/modules/auth'
import { Button } from '@tc96/ui-react'
import Link from 'next/link'

export function NavAuth() {
	const { status } = useAuth()

	if (status === 'authenticated') {
		return (
			<Link href="/dashboard">
				<Button variant="accent">Dashboard</Button>
			</Link>
		)
	}

	if (status === 'unauthenticated') {
		return (
			<div className="flex gap-2">
				<Link href="/auth/login">
					<Button variant="ghost">Login</Button>
				</Link>
				<Link href="/auth/register">
					<Button>Register</Button>
				</Link>
			</div>
		)
	}
}
