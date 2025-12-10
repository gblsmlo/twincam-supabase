import { MainContent } from '@/components/ui/main-content'
import { PageDescription, PageHeader, PageTitle } from '@/components/ui/page-header'
import { findProductAction } from '@/modules/product/actions/find-product-action'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	description: 'Manage your products and services',
	title: 'Products',
}

export default async function Page() {
	const title = String(metadata.title)
	const description = String(metadata.description)

	const products = await findProductAction()

	return (
		<MainContent size="2xl">
			<PageHeader>
				<PageTitle>{title}</PageTitle>
				<PageDescription>{description}</PageDescription>
			</PageHeader>

			<div>
				{JSON.stringify(products, null, 2)}
				{/*<DataTableProduct />*/}
			</div>
		</MainContent>
	)
}
