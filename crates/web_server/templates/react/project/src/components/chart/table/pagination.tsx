import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Table } from '@tanstack/react-table'
import classNames from 'classnames'

const num = 3

export function Pager({ table }: { table: Table<Record<string, any>> }) {
  const pageOptions = table.getPageOptions()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const rows = table.getFilteredRowModel().rows

  if (!rows.length) return null

  return (
    <Pagination className="items-center justify-end space-x-2 py-4">
      <div className="text-left flex flex-1">
        {!!selectedRows.length ? `已选择 ${selectedRows.length} 行共 ${rows.length} 行` : `共 ${rows.length} 行`}{' '}
      </div>
      {pageOptions.length > 1 && (
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              className={classNames({ disabled: !table.getCanPreviousPage() })}
              onClick={() => {
                table.previousPage()
              }}
            />
          </PaginationItem>
          {pageOptions.slice(0, num).map((page) => (
            <PaginationItem>
              <PaginationLink href="#">{page + 1}</PaginationLink>
            </PaginationItem>
          ))}

          {!!pageOptions.slice(num).length && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              className={classNames({ disabled: table.getCanNextPage() })}
              onClick={() => {
                table.nextPage()
              }}
            />
          </PaginationItem>
        </PaginationContent>
      )}
    </Pagination>
  )
}
