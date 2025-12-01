import { MainContent } from '@components/ui/main-content'
import { PageDescription, PageHeader, PageTitle } from '@components/ui/page-header'
// import { getSessionAction } from '@/modules/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	description: 'This is your dashboard',
	title: 'Dashboard',
}

export default async function Page() {
	// const session = await getSessionAction()
	const title = String(metadata.title)
	const description = String(metadata.description)

	return (
		<MainContent size="2xl">
			<PageHeader>
				<PageTitle>{title}</PageTitle>
				{description && <PageDescription>{description}</PageDescription>}
			</PageHeader>

			<div className="space-y-4">
				<div className="h-[calc(100vh-26rem)] w-full rounded border bg-background/50" />
			</div>
		</MainContent>
	)
}
