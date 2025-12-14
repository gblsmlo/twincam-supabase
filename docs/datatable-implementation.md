# DiceUI DataTable Implementation

This project integrates [DiceUI DataTable](https://www.diceui.com/docs/components/data-table) with a wrapper strategy for reusable table components.

## Architecture

### Wrapper Component
**Location:** `src/components/ui/app-data-table.tsx`

The `AppDataTable` wrapper provides:
- Consistent table configuration across the app
- Standard toolbar with sorting capabilities
- Integration with DiceUI's `useDataTable` hook
- Pagination support

```tsx
<AppDataTable columns={columns} data={data} pageCount={1} />
```

### Module-Specific Tables
Each module defines its own columns and table component:

**Example: Product Module**
- Columns: `src/modules/product/components/data-table-products.columns.tsx`
- Table Component: `src/modules/product/components/data-table-products.tsx`
- Mock Data: `src/modules/product/mocks/products.ts`

## Features

### Standard Toolbar
- **Sorting:** Click column headers to sort
- **Sort List:** Manage multiple sort orders via the toolbar
- **Filtering:** Text, date, and select filters per column
- **View Options:** Toggle column visibility

### Column Configuration
Each column can define:
```tsx
{
  accessorKey: "name",
  header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
  cell: ({ row }) => <div>{row.getValue("name")}</div>,
  meta: {
    label: "Name",
    placeholder: "Filter by name...",
    variant: "text", // text | number | date | select | etc.
  },
  enableSorting: true,
  enableColumnFilter: true,
}
```

## Usage

### Creating a New Table

1. **Define your columns:**
```tsx
// src/modules/yourmodule/components/data-table-yourmodule.columns.tsx
import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/app-data-table"
import type { YourType } from "../types"

export const yourModuleColumns: ColumnDef<YourType>[] = [
  {
    accessorKey: "field",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Field" />,
    cell: ({ row }) => <div>{row.getValue("field")}</div>,
    meta: {
      label: "Field",
      placeholder: "Filter...",
      variant: "text",
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
]
```

2. **Create your table component:**
```tsx
// src/modules/yourmodule/components/data-table-yourmodule.tsx
"use client"

import { AppDataTable } from "@/components/ui/app-data-table"
import { yourModuleColumns } from "./data-table-yourmodule.columns"

interface DataTableYourModuleProps {
  data: YourType[]
}

export function DataTableYourModule({ data }: DataTableYourModuleProps) {
  return <AppDataTable columns={yourModuleColumns} data={data} pageCount={1} />
}
```

3. **Use in your page:**
```tsx
// src/app/your-page/page.tsx
import { DataTableYourModule } from "@/modules/yourmodule"

export default function Page() {
  const data = await fetchYourData()
  return <DataTableYourModule data={data} />
}
```

## Dependencies

- `@tanstack/react-table` - Core table functionality
- `nuqs` - URL state management for filters/sorts
- `date-fns` - Date formatting
- DiceUI DataTable components

## Files Structure

```
src/
├── components/
│   ├── data-table/          # DiceUI generated components
│   │   ├── data-table.tsx
│   │   ├── data-table-toolbar.tsx
│   │   ├── data-table-sort-list.tsx
│   │   ├── data-table-column-header.tsx
│   │   └── ...
│   └── ui/
│       └── app-data-table.tsx  # Wrapper component
├── hooks/
│   └── use-data-table.ts    # DiceUI hook
├── lib/
│   └── data-table.ts        # Utilities
├── config/
│   └── data-table.ts        # Configuration
├── types/
│   └── data-table.ts        # Type definitions
└── modules/
    └── product/
        ├── components/
        │   ├── data-table-products.tsx         # Product table
        │   └── data-table-products.columns.tsx # Product columns
        └── mocks/
            └── products.ts   # Mock data
```

## Advanced Features

### Server-Side Data
Pass real data from server actions:
```tsx
export default async function Page() {
  const products = await findProductAction()
  return <DataTableProducts data={products} />
}
```

### Pagination
For server-side pagination, pass `pageCount`:
```tsx
<AppDataTable 
  columns={columns} 
  data={data} 
  pageCount={totalPages} 
/>
```

### Custom Row ID
For proper row selection:
```tsx
<AppDataTable 
  columns={columns} 
  data={data} 
  getRowId={(row) => row.customId}
/>
```

## Documentation
- [DiceUI DataTable Docs](https://www.diceui.com/docs/components/data-table)
- [TanStack Table Docs](https://tanstack.com/table/latest)
