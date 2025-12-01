'use client'

import { toSlug } from '@/utils/to-slug'
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@components/ui/sidebar'
import type { Route } from '@shared/config/routes'
import Link from 'next/link'
import type { ComponentProps } from 'react'

type NavSecondaryProps = ComponentProps<'div'> & {
	items: Route[]
}

export function NavSecondary({ items, ...props }: NavSecondaryProps) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
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
