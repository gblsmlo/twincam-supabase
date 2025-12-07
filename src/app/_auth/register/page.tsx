import { SignUpView } from '@/modules/auth/components'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Register',
}

export default function RegisterPage() {
	return <SignUpView />
}
