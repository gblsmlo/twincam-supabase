'use client'

import { AuthProvider } from '@/modules/auth/contexts/auth-context'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from './theme-provider'

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
			<AuthProvider>
				<NuqsAdapter>{children}</NuqsAdapter>
				<Toaster />
			</AuthProvider>
		</ThemeProvider>
	)
}
