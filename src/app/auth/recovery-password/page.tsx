import { RecoveryPasswordView } from '@/modules/auth/components/recovery-password-view'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	description: '',
	title: 'Recovery Password',
}

export default function Page() {
	return <RecoveryPasswordView />
}
