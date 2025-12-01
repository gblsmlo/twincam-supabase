import { MainContent } from '@components/ui/main-content'
import { PageDescription, PageHeader, PageTitle } from '@components/ui/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	description: 'Manage your product prices and plans',
	title: 'Prices',
}

export default function Page() {
	const title = String(metadata.title)
	const description = String(metadata.description)

	return (
		<MainContent size="2xl">
			<PageHeader>
				<PageTitle>{title}</PageTitle>
				<PageDescription>{description}</PageDescription>
			</PageHeader>
			<div className="space-y-4">
				<div className="h-[calc(100vh-26rem)] w-full rounded border bg-background/50" />
			</div>
		</MainContent>
	)
}
