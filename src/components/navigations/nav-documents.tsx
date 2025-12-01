'use client'

import type { Route } from '@/shared/config/routes'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@components/ui/sidebar'
import Link from 'next/link'

export function NavDocuments({ items }: { items: Route[] }) {
	const { state } = useSidebar()
	const isCollapsed = state === 'collapsed'

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Documents</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<SidebarMenuItem key={item.label}>
						<SidebarMenuButton asChild>
							<Link href={item.link}>
								{item.icon && <item.icon />}
								{!isCollapsed && <span>{item.label}</span>}
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
