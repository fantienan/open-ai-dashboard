import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WEB_SERVER_ROOT_PATH } from '@/lib/constant'
import { MetadataInfo } from '@/types'
import { fetcher } from '@/utils'
import { AnalyzeResultSchema } from '@ai-dashboard/common/utils'
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
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { memo, useState } from 'react'
import useSWR from 'swr'
import { CardFooterRenderer, CardHeaderRenderer } from '../utils'
import { Pager } from './pagination'

export type DataTableProps = Omit<AnalyzeResultSchema, 'chartType'> & { className?: string }

export function PureDataTable({ data, tableName, title, footer }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const { data: metadatas = [] } = useSWR<MetadataInfo[]>(
    `${WEB_SERVER_ROOT_PATH}/metadata/find_by_table_name`,
    (input: string, init?: RequestInit) =>
      fetcher(input, { ...init, method: 'POST', body: JSON.stringify({ table_name: tableName }) }).then(
        (res) => res.data as any,
      ),
    { fallbackData: [] },
  )

  const columns: ColumnDef<Record<string, any>>[] = metadatas.map((meta) => ({
    accessorKey: meta.columnName!,
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {meta.columnAliases}
          <ArrowUpDown />
        </Button>
      )
    },
  }))
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <Card className="w-full">
      <CardHeaderRenderer {...title} />
      <CardContent>
        <div className="flex items-center py-4">
          <Input placeholder="请输入" className="max-w-sm" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                列 <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
        <Pager table={table} />
      </CardContent>

      {!!footer && <CardFooterRenderer {...footer} />}
    </Card>
  )
}

export const DataTable = memo(PureDataTable, (prevProps, nextProps) => {
  if (prevProps.className !== nextProps.className) return false
  if (prevProps.data !== nextProps.data) return false
  if (prevProps.title !== nextProps.title) return false
  if (prevProps.footer !== nextProps.footer) return false
  return true
})
