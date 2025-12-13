'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/modules/auth'
import { type Route, userRoutes } from '@/shared/config/routes'
import { toSlug } from '@/shared/utils/to-slug'
import { Dot, LogOutIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ComponentProps, useCallback, useMemo } from 'react'
import { NavUserAvatar } from './nav-user-avatar'

type NavUserProps = ComponentProps<'ul'> & {
	items: Route[]
}

export function NavUser({ items, ...props }: NavUserProps) {
	const { isMobile } = useSidebar()

	const router = useRouter()
	const { user, signOut } = useAuth()

	const handleSignOut = useCallback(async () => {
		await signOut()
	}, [signOut])

	const handleNavigate = useCallback(
		(link: string) => {
			router.push(link)
		},
		[router],
	)

	const cachedUser = useMemo(() => user, [user])

	if (!cachedUser) return null

	return (
		<SidebarMenu {...props}>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							size="lg"
						>
							<NavUserAvatar name={cachedUser.name} />

							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{cachedUser.name}</span>
								<span className="truncate text-muted-foreground text-xs">{cachedUser.email}</span>
							</div>
							<Dot className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? 'bottom' : 'right'}
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<NavUserAvatar name={cachedUser.name} />

								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{cachedUser.name}</span>
									<span className="truncate text-muted-foreground text-xs">{cachedUser.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							{userRoutes.map((route) => {
								return (
									<DropdownMenuItem
										key={toSlug(route.label)}
										onClick={() => handleNavigate(route.link)}
									>
										{route.label}
									</DropdownMenuItem>
								)
							})}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleSignOut}>
							<LogOutIcon />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
