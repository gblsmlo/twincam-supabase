import { AuthGuard } from '@/modules/auth'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
	return <AuthGuard isPrivate>{children}</AuthGuard>
}
