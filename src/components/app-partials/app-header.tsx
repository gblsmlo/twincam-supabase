import { AppBreadcrumb } from '@components/app-partials/app-breadcrumb'
import { Separator } from '../ui/separator'
import { SidebarTrigger } from '../ui/sidebar'

export function AppHeader() {
	return (
		<div className="flex h-10 items-center gap-3 border-b px-2 py-2">
			<SidebarTrigger />
			<Separator orientation="vertical" />
			<AppBreadcrumb />
		</div>
	)
}
