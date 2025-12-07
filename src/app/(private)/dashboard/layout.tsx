import { AppHeader } from '@/components/app-partials/app-header'
import { AppSidebar } from '@/components/app-partials/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<SidebarProvider>
			<section className="relative flex h-screen w-full">
				<AppSidebar />
				<SidebarInset className="flex flex-col">
					<AppHeader />
					{children}
				</SidebarInset>
			</section>
		</SidebarProvider>
	)
}
