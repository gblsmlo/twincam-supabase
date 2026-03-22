import { DataTableView } from '@/components/data-table/data-table-view'
import { isSuccess } from '@/shared/errors'
import { sleep } from '@/shared/utils/sleep'
import { findProductAction } from '../actions'
import { dataTableProductColumns } from './columns'
import { CreateProductDialog } from './create-product-dialog'

type DataTableProductsProps = {
	organizationId: string
}

export async function DataTableProducts({ organizationId }: DataTableProductsProps) {
	const result = await findProductAction(organizationId)

	await sleep(5000)

	if (!isSuccess(result)) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground">Erro ao carregar produtos: {result.message}</p>
			</div>
		)
	}

	const products = result.data.products ?? []

	return (
		<DataTableView
			actionToCreate={<CreateProductDialog organizationId={organizationId} />}
			columns={dataTableProductColumns}
			data={products}
			pageCount={0}
		/>
	)
}
