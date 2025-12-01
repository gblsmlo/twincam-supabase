'use client'

import { signOut, useSession } from '@/infra/auth/client'
import { type Route, userRoutes } from '@/shared/config/routes'
import { toSlug } from '@/utils/to-slug'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@components/ui/sidebar'
import { IconDotsVertical, IconLogout } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { type ComponentProps, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { NavUserAvatar } from './nav-user-avatar'

type NavUserProps = ComponentProps<'ul'> & {
	items: Route[]
	user: {
		name: string
		email: string
		avatar: string
	}
}

type User = {
	name: string
	email?: string
	image?: string | null
}

export function NavUser({ items, ...props }: NavUserProps) {
	const [user, setUser] = useState<User | null>()
	const { isMobile } = useSidebar()
	const { data: session } = useSession()
	const router = useRouter()

	useEffect(() => {
		if (!session?.user) {
			setUser(null)
			return
		}

		setUser({
			email: session.user.email,
			image: session.user.image,
			name: session.user.name,
		})
	}, [session?.user])

	const handleSignOut = async () => {
		await signOut({
			fetchOptions: {
				onError: () => {
					toast.error('Ocorreu um erro ao sair. Tente novamente.')
				},
				onSuccess: () => {
					router.push('/auth/login')
				},
			},
		})
	}

	if (!user) {
		return null
	}

	return (
		<SidebarMenu {...props}>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							size="lg"
						>
							<NavUserAvatar image={user?.image} name={user.name} />

							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-muted-foreground text-xs">{user.email}</span>
							</div>
							<IconDotsVertical className="ml-auto size-4" />
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
								<NavUserAvatar image={user?.image} name={user.name} />

								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-muted-foreground text-xs">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							{userRoutes.map((route) => {
								return (
									<DropdownMenuItem
										key={toSlug(route.label)}
										onClick={() => router.push(route.link)}
									>
										{route.label}
									</DropdownMenuItem>
								)
							})}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleSignOut}>
							<IconLogout />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
