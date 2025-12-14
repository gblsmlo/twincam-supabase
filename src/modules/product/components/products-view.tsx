import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { Suspense } from 'react'
import { DataTableProducts } from './data-table-products'

export async function ProductsView() {
	return (
		<Suspense fallback={<DataTableSkeleton columnCount={6} />}>
			<DataTableProducts />
		</Suspense>
	)
}
