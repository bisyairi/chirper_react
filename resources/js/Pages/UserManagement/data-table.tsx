import * as React from "react"

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable, SortingFn, FilterFn, sortingFns, Column, Row, RowData, RowModel,
} from "@tanstack/react-table"

import { mkConfig, generateCsv, download } from 'export-to-csv'

import {
    RankingInfo,
    rankItem,
    compareItems,
} from "@tanstack/match-sorter-utils"

declare module '@tanstack/react-table' {
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }
    interface FilterMeta {
        itemRank: RankingInfo
    }
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table"

import { Button } from "@/Components/ui/button"

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"

import { Input } from "@/Components/ui/input"
import {DataTablePagination} from "@/Components/DataTablePagination";
import {User} from "@/Pages/UserManagement/columns";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value)

    // Store the itemRank info
    addMeta({
        itemRank,
    })

    // Return if the item should be filtered in/out
    return itemRank.passed
}

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
    let dir = 0

    // Only sort by rank if the column has ranking information
    if (rowA.columnFiltersMeta[columnId]) {
        dir = compareItems(
            rowA.columnFiltersMeta[columnId]?.itemRank!,
            rowB.columnFiltersMeta[columnId]?.itemRank!
        )
    }

    // Provide an alphanumeric fallback for when the item ranks are equal
    return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

export function DataTable<TData, TValue>({columns, data,}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})

    const [rowSelection, setRowSelection] = React.useState({})

    const [globalFilter, setGlobalFilter] = React.useState('')

    const table = useReactTable({
        data,
        columns,
        filterFns: {
          fuzzy: fuzzyFilter,
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'fuzzy',
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    })

    const csvConfig = mkConfig({
        fieldSeparator: ',',
        filename: 'sample', // export file name (without .csv)
        decimalSeparator: '.',
        useKeysAsHeaders: true,
    })

    const exportExcel = () => {
        const selectedRows = table.getSelectedRowModel().rows;
        const rowsToExport = selectedRows.length > 0 ? selectedRows : table.getFilteredRowModel().rows;
        const rowData = rowsToExport.map((row) => row.original as User);
        const csv = generateCsv(csvConfig)(rowData)
        download(csvConfig)(csv)
    }

    return (
        <div className="bg-white rounded-md px-4">
            <div className="flex items-center py-4 gap-x-2">
                {/*<Input*/}
                {/*    placeholder="Filter emails..."*/}
                {/*    value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}*/}
                {/*    onChange={(event) =>*/}
                {/*        table.getColumn("email")?.setFilterValue(event.target.value)*/}
                {/*    }*/}
                {/*    className="max-w-sm"*/}
                {/*/>*/}
                <DebouncedInput
                    value={globalFilter ?? ''}
                    onChange={value => setGlobalFilter(String(value))}
                    className="max-w-xs"
                    placeholder="Search all columns..."
                />
                <div className="ml-auto flex gap-x-2">
                    <Button variant="outline" onClick={() => exportExcel()}>
                        Exports
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) => column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div className="flex flex-col space-y-2 py-2">
                                                    <div
                                                        {...{
                                                            className: header.column.getCanSort()
                                                                ? 'cursor-pointer select-none'
                                                                : '',
                                                            onClick: header.column.getToggleSortingHandler(),
                                                        }}
                                                    >
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                        {{
                                                            asc: ' 🔼',
                                                            desc: ' 🔽',
                                                        }[header.column.getIsSorted() as string] ?? null}
                                                    </div>
                                                    {header.column.getCanFilter() ? (
                                                        <div className="w-full">
                                                            <Filter column={header.column} />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}

                                            {/*{header.isPlaceholder*/}
                                            {/*    ? null*/}
                                            {/*    : flexRender(*/}
                                            {/*        header.column.columnDef.header,*/}
                                            {/*        header.getContext()*/}
                                            {/*    )}*/}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                {/*<div className="flex-1 text-sm text-muted-foreground">*/}
                {/*    {table.getFilteredSelectedRowModel().rows.length} of{" "}*/}
                {/*    {table.getFilteredRowModel().rows.length} row(s) selected.*/}
                {/*</div>*/}
                {/*<Button*/}
                {/*    variant="outline"*/}
                {/*    size="sm"*/}
                {/*    onClick={() => table.previousPage()}*/}
                {/*    disabled={!table.getCanPreviousPage()}*/}
                {/*>*/}
                {/*    Previous*/}
                {/*</Button>*/}
                {/*<Button*/}
                {/*    variant="outline"*/}
                {/*    size="sm"*/}
                {/*    onClick={() => table.nextPage()}*/}
                {/*    disabled={!table.getCanNextPage()}*/}
                {/*>*/}
                {/*    Next*/}
                {/*</Button>*/}
                <DataTablePagination table={table} />
            </div>
        </div>
    )
}

function Filter({ column }: { column: Column<any, unknown> }) {
    const columnFilterValue = column.getFilterValue()
    const { filterVariant } = column.columnDef.meta ?? {}

    return filterVariant === 'range' ? (
        <div>
            <div className="flex space-x-2">
                {/* See faceted column filters example for min max values functionality */}
                <DebouncedInput
                    type="number"
                    value={(columnFilterValue as [number, number])?.[0] ?? ''}
                    onChange={value =>
                        column.setFilterValue((old: [number, number]) => [value, old?.[1]])
                    }
                    placeholder={`Min`}
                    className="w-24 border shadow rounded"
                />
                <DebouncedInput
                    type="number"
                    value={(columnFilterValue as [number, number])?.[1] ?? ''}
                    onChange={value =>
                        column.setFilterValue((old: [number, number]) => [old?.[0], value])
                    }
                    placeholder={`Max`}
                    className="w-24 border shadow rounded"
                />
            </div>
            <div className="h-1" />
        </div>
    ) : filterVariant === 'select' ? (
        <select
            onChange={e => column.setFilterValue(e.target.value)}
            value={columnFilterValue?.toString()}
        >
            {/* See faceted column filters example for dynamic select options */}
            <option value="">All</option>
            <option value="complicated">complicated</option>
            <option value="relationship">relationship</option>
            <option value="single">single</option>
        </select>
    ) : (
        <DebouncedInput
            className="w-1/2 border shadow rounded"
            onChange={value => column.setFilterValue(value)}
            placeholder={`Search...`}
            type="text"
            value={(columnFilterValue ?? '') as string}
        />
        // See faceted column filters example for datalist search suggestions
    )
}

function DebouncedInput({
                            value: initialValue,
                            onChange,
                            debounce = 500,
                            ...props
                        }: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
    const [value, setValue] = React.useState(initialValue)

    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
    }, [value])

    return (
        <Input {...props} value={value} onChange={e => setValue(e.target.value)} />
    )
}
