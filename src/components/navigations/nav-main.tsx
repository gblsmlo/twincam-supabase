'use client'

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@components/ui/sidebar'
import type { Route } from '@shared/config/routes'
import { toSlug } from '@utils/to-slug'
import Link from 'next/link'

export function NavMain({ items }: { items: Route[] }) {
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={toSlug(item.label)}>
							<SidebarMenuButton asChild>
								<Link href={item.link}>
									{item.icon && <item.icon />}
									<span>{item.label}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
