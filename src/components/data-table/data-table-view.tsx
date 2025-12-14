'use client'

import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { useDataTable } from '@/hooks/use-data-table'
import type { ColumnDef } from '@tanstack/react-table'

interface DataTableViewProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	pageCount?: number
	getRowId?: (row: TData) => string
}

export function DataTableView<TData, TValue>({
	columns,
	data,
	pageCount = 1,
	getRowId,
}: DataTableViewProps<TData, TValue>) {
	const { table } = useDataTable({
		columns,
		data,
		getRowId,
		pageCount,
	})

	return (
		<DataTable table={table}>
			<DataTableToolbar table={table}>
				<DataTableSortList table={table} />
			</DataTableToolbar>
		</DataTable>
	)
}

// Re-export DataTableColumnHeader for convenience
export { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
