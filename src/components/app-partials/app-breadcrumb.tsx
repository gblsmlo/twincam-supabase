'use client'

import { allRoutes } from '@/shared/config/routes'
import { toSlug } from '@/utils/to-slug'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@components/ui/breadcrumb'
import type { LucideIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

type BreadcrumbRoute = {
	icon?: LucideIcon | null
	label: string
	link: string | null
}

type AppBreadcrumbProps = {
	routes: BreadcrumbRoute[]
}

function buildItemsFromSegments(pathname: string) {
	const segments = pathname.split('/').filter(Boolean)
	const items: BreadcrumbRoute[] = []

	segments.forEach((_, index) => {
		const CURRENT_INDEX = index + 1
		const currentPath = `/${segments.slice(0, CURRENT_INDEX).join('/')}`
		const isLastSegment = segments.length === CURRENT_INDEX

		const matchedRoute = allRoutes.find((route) => route.link === currentPath)

		if (matchedRoute) {
			items.push({
				icon: matchedRoute.icon,
				label: matchedRoute.label,
				link: !isLastSegment ? matchedRoute.link : null,
			})
		}
	})

	return items
}

export function AppBreadcrumb({ routes }: AppBreadcrumbProps) {
	const pathname = usePathname()

	const itemsFromSegments = useMemo(() => {
		return buildItemsFromSegments(pathname)
	}, [pathname])

	const items = routes ?? itemsFromSegments

	if (items.length === 0) {
		return null
	}

	return (
		<Breadcrumb className="px-2">
			<BreadcrumbList>
				{items.map((item, index) => {
					const isLastItem = index === items.length - 1
					const Icon = item.icon

					return isLastItem ? (
						<BreadcrumbItem key={toSlug(item.label)}>
							<BreadcrumbPage className="flex items-center gap-2">
								{Icon && <Icon className="size-4" />}
								{item.label}
							</BreadcrumbPage>
						</BreadcrumbItem>
					) : (
						<div className="flex items-center gap-2" key={toSlug(item.label)}>
							<BreadcrumbItem>
								<BreadcrumbLink
									className="flex items-center gap-2 transition-colors hover:text-foreground"
									href={item.link || '#'}
								>
									{Icon && <Icon className="size-4" />}
									{item.label}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator> / </BreadcrumbSeparator>
						</div>
					)
				})}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
