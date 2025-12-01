import { AuthLayout } from '@/modules/auth/components'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
	return <AuthLayout>{children}</AuthLayout>
}
