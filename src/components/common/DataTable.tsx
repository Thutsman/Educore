import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/utils/cn'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T | string
  header: string
  cell?: (row: T) => ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  emptyState?: ReactNode
  className?: string
  rowClassName?: (row: T) => string
  onRowClick?: (row: T) => void
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-border">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div
                className="h-4 animate-pulse rounded bg-muted"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  sortKey,
  sortDir,
  onSort,
  pagination,
  emptyState,
  className,
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {

  const getCellValue = (row: T, col: Column<T>): ReactNode => {
    if (col.cell) return col.cell(row)
    const val = (row as Record<string, unknown>)[col.key as string]
    if (val === null || val === undefined) return <span className="text-muted-foreground">—</span>
    return String(val)
  }

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1

  return (
    <div className={cn('space-y-3', className)}>
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      col.headerClassName
                    )}
                    onClick={() => col.sortable && onSort?.(String(col.key))}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        sortKey === String(col.key) ? (
                          sortDir === 'asc'
                            ? <ArrowUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            : <ArrowDown className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton cols={columns.length} />
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-0">
                    {emptyState ?? (
                      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                        <p className="text-sm text-muted-foreground">No records found</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-muted/40',
                      rowClassName?.(row)
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn('px-4 py-3 align-middle', col.className)}
                      >
                        {getCellValue(row, col)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > pagination.pageSize && (
        <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
          <p>
            Showing{' '}
            <span className="font-medium text-foreground">
              {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}
            </span>
            {' '}–{' '}
            <span className="font-medium text-foreground">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>
            {' '}of{' '}
            <span className="font-medium text-foreground">{pagination.total}</span>
          </p>

          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationButton>

            <span className="px-2 tabular-nums">
              {pagination.page} / {totalPages}
            </span>

            <PaginationButton
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => pagination.onPageChange(totalPages)}
              disabled={pagination.page === totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  )
}

function PaginationButton({
  children,
  onClick,
  disabled,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  'aria-label'?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {children}
    </button>
  )
}
