'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
			<NuqsAdapter>{children}</NuqsAdapter>
		</ThemeProvider>
	)
}
