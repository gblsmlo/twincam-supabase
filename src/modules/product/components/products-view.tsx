import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { Suspense } from 'react'
import { DataTableProducts } from './data-table-products'

type ProductsViewProps = {
	organizationId: string
}

export async function ProductsView({ organizationId }: ProductsViewProps) {
	return (
		<Suspense fallback={<DataTableSkeleton columnCount={6} />}>
			<DataTableProducts organizationId={organizationId} />
		</Suspense>
	)
}
