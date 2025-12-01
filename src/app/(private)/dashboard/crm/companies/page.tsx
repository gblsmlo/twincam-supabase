import { MainContent } from '@components/ui/main-content'
import { PageDescription, PageHeader, PageTitle } from '@components/ui/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	description: 'View and manage your companies',
	title: 'Companies',
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
		</MainContent>
	)
}
