import { SignInView } from '@/modules/auth/components'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Login',
}

export default function Page() {
	return <SignInView />
}
