'use client'

import { DataTableView } from '@/components/data-table/data-table-view'
import { mockProducts } from '../mocks/products'
import { productColumns } from './data-table-products.columns'

export function DataTableProducts() {
	return <DataTableView columns={productColumns} data={mockProducts} pageCount={1} />
}
