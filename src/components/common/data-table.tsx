import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { SortState } from '@/types';

export interface DataTableColumn<TRow, TSortField extends string> {
  id: string;
  header: ReactNode;
  /** Enables the sort control on this header and maps it to a service field. */
  sortField?: TSortField;
  cell: (row: TRow) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** Hides the column below the given breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<TRow, TSortField extends string> {
  columns: DataTableColumn<TRow, TSortField>[];
  rows: TRow[];
  getRowId: (row: TRow) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  sort?: SortState<TSortField>;
  onSortChange?: (field: TSortField) => void;
  onRowClick?: (row: TRow) => void;
  emptyState?: ReactNode;
  compact?: boolean;
  className?: string;
}

const hideBelowClass = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
} as const;

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

export function DataTable<TRow, TSortField extends string>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  skeletonRows = 6,
  sort,
  onSortChange,
  onRowClick,
  emptyState,
  compact = false,
  className,
}: DataTableProps<TRow, TSortField>) {
  if (!isLoading && rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <TableWrapper className={className}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => {
              const sortable = Boolean(column.sortField && onSortChange);
              const sortDirection =
                sort && column.sortField && sort.field === column.sortField
                  ? sort.direction
                  : undefined;
              const isSorted = sortDirection !== undefined;

              return (
                <TableHead
                  key={column.id}
                  aria-sort={
                    sortDirection === 'asc'
                      ? 'ascending'
                      : sortDirection === 'desc'
                        ? 'descending'
                        : undefined
                  }
                  className={cn(
                    column.hideBelow && hideBelowClass[column.hideBelow],
                    column.align && alignClass[column.align],
                    column.headerClassName,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(column.sortField!)}
                      className={cn(
                        'group -mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 uppercase tracking-wider transition-colors hover:text-foreground',
                        isSorted && 'text-foreground',
                      )}
                    >
                      {column.header}
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="size-3" />
                      ) : sortDirection === 'desc' ? (
                        <ArrowDown className="size-3" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading
            ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        compact && 'py-2.5',
                        column.hideBelow && hideBelowClass[column.hideBelow],
                      )}
                    >
                      <Skeleton className="h-4 w-[70%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row, index) => (
                <motion.tr
                  key={getRowId(row)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2) }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-border transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-accent/55',
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        compact && 'py-2.5',
                        column.hideBelow && hideBelowClass[column.hideBelow],
                        column.align && alignClass[column.align],
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}
