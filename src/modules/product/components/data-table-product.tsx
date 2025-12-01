'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTable } from '@components/data-table/data-table'
import { DataTableColumnHeader } from '@components/data-table/data-table-column-header'
import { DataTableToolbar } from '@components/data-table/data-table-toolbar'
import { Badge } from '@components/ui/badge'
import { Button } from '@components/ui/button'
import { Checkbox } from '@components/ui/checkbox'
import type { Column, ColumnDef } from '@tanstack/react-table'
import { CheckCircle, CheckCircle2, DollarSign, MoreHorizontal, Text, XCircle } from 'lucide-react'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import * as React from 'react'

interface Project {
	id: string
	title: string
	status: 'active' | 'inactive'
	budget: number
}

const data: Project[] = [
	{
		budget: 50000,
		id: '1',
		status: 'active',
		title: 'Project Alpha',
	},
	{
		budget: 75000,
		id: '2',
		status: 'inactive',
		title: 'Project Beta',
	},
	{
		budget: 25000,
		id: '3',
		status: 'active',
		title: 'Project Gamma',
	},
	{
		budget: 100000,
		id: '4',
		status: 'active',
		title: 'Project Delta',
	},
]

export function DataTableProduct() {
	const [title] = useQueryState('title', parseAsString.withDefault(''))
	const [status] = useQueryState('status', parseAsArrayOf(parseAsString).withDefault([]))

	// Ideally we would filter the data server-side, but for the sake of this example, we'll filter the data client-side
	const filteredData = React.useMemo(() => {
		return data.filter((project) => {
			const matchesTitle = title === '' || project.title.toLowerCase().includes(title.toLowerCase())
			const matchesStatus = status.length === 0 || status.includes(project.status)

			return matchesTitle && matchesStatus
		})
	}, [title, status])

	const columns = React.useMemo<ColumnDef<Project>[]>(
		() => [
			{
				cell: ({ row }) => (
					<Checkbox
						aria-label="Select row"
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
					/>
				),
				enableHiding: false,
				enableSorting: false,
				header: ({ table }) => (
					<Checkbox
						aria-label="Select all"
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && 'indeterminate')
						}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					/>
				),
				id: 'select',
				size: 32,
			},
			{
				accessorKey: 'title',
				cell: ({ cell }) => <div>{cell.getValue<Project['title']>()}</div>,
				enableColumnFilter: true,
				header: ({ column }: { column: Column<Project, unknown> }) => (
					<DataTableColumnHeader column={column} label="Title" />
				),
				id: 'title',
				meta: {
					icon: Text,
					label: 'Title',
					placeholder: 'Search titles...',
					variant: 'text',
				},
			},
			{
				accessorKey: 'status',
				cell: ({ cell }) => {
					const status = cell.getValue<Project['status']>()
					const Icon = status === 'active' ? CheckCircle2 : XCircle

					return (
						<Badge className="capitalize" variant="outline">
							<Icon />
							{status}
						</Badge>
					)
				},
				enableColumnFilter: true,
				header: ({ column }: { column: Column<Project, unknown> }) => (
					<DataTableColumnHeader column={column} label="Status" />
				),
				id: 'status',
				meta: {
					label: 'Status',
					options: [
						{ icon: CheckCircle, label: 'Active', value: 'active' },
						{ icon: XCircle, label: 'Inactive', value: 'inactive' },
					],
					variant: 'multiSelect',
				},
			},
			{
				accessorKey: 'budget',
				cell: ({ cell }) => {
					const budget = cell.getValue<Project['budget']>()

					return (
						<div className="flex items-center gap-1">
							<DollarSign className="size-4" />
							{budget.toLocaleString()}
						</div>
					)
				},
				header: ({ column }: { column: Column<Project, unknown> }) => (
					<DataTableColumnHeader column={column} label="Budget" />
				),
				id: 'budget',
			},
			{
				cell: function Cell() {
					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="icon" variant="ghost">
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Edit</DropdownMenuItem>
								<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)
				},
				id: 'actions',
				size: 32,
			},
		],
		[],
	)

	const { table } = useDataTable({
		columns,
		data: filteredData,
		getRowId: (row) => row.id,
		initialState: {
			columnPinning: { right: ['actions'] },
			sorting: [{ desc: true, id: 'title' }],
		},
		pageCount: 1,
	})

	return (
		<div className="data-table-container">
			<DataTable table={table}>
				<DataTableToolbar table={table} />
			</DataTable>
		</div>
	)
}
