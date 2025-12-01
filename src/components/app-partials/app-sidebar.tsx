'use client'

import { NavDocuments } from '@components/navigations/nav-documents'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	useSidebar,
} from '@components/ui/sidebar'
import {
	crmRoutes,
	documentsRoutes,
	mainRoutes,
	secondaryRoutes,
	storeRoutes,
	userRoutes,
} from '@shared/config/routes'
import Link from 'next/link'
import type * as React from 'react'
import { Logo } from '../logo'
import { NavCRM } from '../navigations/nav-crm'
import { NavMain } from '../navigations/nav-main'
import { NavSecondary } from '../navigations/nav-secondary'
import { NavStore } from '../navigations/nav-store'
import { NavUser } from '../navigations/nav-user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { state } = useSidebar()
	const isCollapsed = state === 'collapsed'

	return (
		<Sidebar collapsible="icon" variant="inset" {...props}>
			<SidebarHeader>
				<Link className="flex items-center gap-2" href="/">
					<Logo className="h-8 w-8" />
					{!isCollapsed && (
						<span className="font-semibold text-foreground dark:text-white">Acme</span>
					)}
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={mainRoutes} />
				<NavCRM items={crmRoutes} />
				<NavDocuments items={documentsRoutes} />
				<NavStore items={storeRoutes} />
				<NavSecondary className="mt-auto" items={secondaryRoutes} />
			</SidebarContent>
			<SidebarFooter className="mt-4 border-t pt-4">
				<NavUser
					items={userRoutes}
					user={{
						avatar: 'https://github.com/gabriel-melo.png',
						email: 'gabriel.melo@acme.com',
						name: 'Gabriel Melo',
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	)
}
